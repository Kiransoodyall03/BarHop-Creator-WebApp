const {onCall, onRequest, HttpsError} =
  require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
const {recordFoursquareUsage} = require("./foursquareUsage");

if (!admin.apps.length) {
  admin.initializeApp();
}

// ==============================
//  DISTRICT VENUE CACHE (scheduled Foursquare refresh)
// ==============================

// Lives in its own module; re-exported here so Firebase discovers it from
// index.js (the functions `main`). Required AFTER initializeApp so the Admin
// SDK is ready. Deploy SCOPED — never `--only functions`, which would delete
// the other repo's functions in this shared project:
//   firebase deploy --only functions:refreshDistrictVenues
exports.refreshDistrictVenues =
  require("./refreshDistrictVenues").refreshDistrictVenues;

// ==============================
//  SHARED CONFIG
// ==============================

const PAYSTACK_API = "https://api.paystack.co";

// BarHop's platform fee (percent) taken from split payments routed to a
// venue's subaccount (future ticket sales). Adjust before going live.
const PLATFORM_FEE_PERCENT = 5;

// Server-side tier x interval -> plan allowlist: the client never sends
// a raw Paystack Plan code, so callers cannot subscribe to arbitrary
// plans. Amounts are in ZAR cents; Paystack requires an amount on
// initialize even though the plan's own amount overrides it.
// Annual plans price 10 months for 12 ("2 months free").
const TIER_PLANS = {
  starter: {
    monthly: {planCode: "PLN_eumlxpc74xnlxtb", amountCents: 49700},
    annual: {planCode: "PLN_hiyzfesa3aqomwm", amountCents: 497000},
  },
  pro: {
    monthly: {planCode: "PLN_f1l5n9fcm5mtxjd", amountCents: 149700},
    annual: {planCode: "PLN_o8lbkmqx0qjmmpf", amountCents: 1497000},
  },
  enterprise: {
    monthly: {planCode: "PLN_l4uxhbneb1hexu3", amountCents: 349700},
    annual: {planCode: "PLN_v582c5klvrmb91n", amountCents: 3497000},
  },
};

// Origins allowed to receive post-checkout redirects.
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://barhop-creator-webapp-ee9a8.web.app",
  "https://barhop-creator-webapp-ee9a8.firebaseapp.com",
];
const DEFAULT_APP_URL = "https://barhop-creator-webapp-ee9a8.web.app";

/**
 * Resolves the app URL to redirect back to, falling back to the
 * production URL when the client-supplied origin is not allowlisted.
 * @param {string} origin Origin reported by the client.
 * @return {string} A safe base URL for redirects.
 */
function resolveAppUrl(origin) {
  return ALLOWED_ORIGINS.includes(origin) ? origin : DEFAULT_APP_URL;
}

/**
 * Calls the Paystack API and returns the parsed JSON body. Throws an
 * HttpsError carrying Paystack's own message (e.g. "Could not resolve
 * account name") so the frontend can show something actionable.
 * @param {string} secret Paystack secret key.
 * @param {string} path API path, e.g. "/subaccount".
 * @param {Object} payload JSON body to POST.
 * @return {Promise<Object>} Parsed Paystack response body.
 */
async function paystackPost(secret, path, payload) {
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let body = null;
  try {
    body = await response.json();
  } catch (err) {
    body = null;
  }

  if (!response.ok || !body || body.status === false) {
    const message = (body && body.message) ||
      `Paystack API error (HTTP ${response.status}).`;
    console.error(`Paystack ${path} error:`, message);
    throw new HttpsError("failed-precondition", message);
  }

  return body;
}

/**
 * Calls the Paystack API with a GET request and returns the parsed
 * JSON body. Mirrors paystackPost: throws an HttpsError carrying
 * Paystack's own message on failure.
 * @param {string} secret Paystack secret key.
 * @param {string} path API path, e.g. "/customer/CUS_x".
 * @return {Promise<Object>} Parsed Paystack response body.
 */
async function paystackGet(secret, path) {
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    method: "GET",
    headers: {"Authorization": `Bearer ${secret}`},
  });

  let body = null;
  try {
    body = await response.json();
  } catch (err) {
    body = null;
  }

  if (!response.ok || !body || body.status === false) {
    const message = (body && body.message) ||
      `Paystack API error (HTTP ${response.status}).`;
    console.error(`Paystack ${path} error:`, message);
    throw new HttpsError("failed-precondition", message);
  }

  return body;
}

// ==============================
//  PAYSTACK SUBACCOUNT (KYB / OWNERSHIP VERIFICATION)
// ==============================

// Creates a Paystack Subaccount for the venue owner, linking their SA
// bank account to the BarHop platform. Paystack resolves the account
// against the bank synchronously — if creation succeeds the details are
// verified, so we mark the owner VERIFIED immediately (there is no
// later webhook for subaccount verification).
exports.createPaystackSubaccount = onCall(
    {secrets: ["PAYSTACK_SECRET_KEY"]},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
      }

      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecret) {
        throw new HttpsError(
            "internal", "Paystack secret key is missing in Firebase.");
      }

      const {businessName, settlementBank, accountNumber} =
        request.data || {};
      if (!businessName || !settlementBank || !accountNumber) {
        throw new HttpsError(
            "invalid-argument",
            "Missing business name, bank, or account number.");
      }

      const ownerId = request.auth.uid;
      const db = admin.firestore();
      const userRef = db.collection("users").doc(ownerId);

      // A subaccount already on file means this owner is verified;
      // don't create duplicates on Paystack.
      const userDoc = await userRef.get();
      if (userDoc.exists && userDoc.data().paystackSubaccountId) {
        return {
          success: true,
          subaccountCode: userDoc.data().paystackSubaccountId,
        };
      }

      const body = await paystackPost(paystackSecret, "/subaccount", {
        business_name: businessName,
        settlement_bank: settlementBank,
        account_number: accountNumber,
        percentage_charge: PLATFORM_FEE_PERCENT,
        description: `BarHop Venue: ${businessName}`,
        // ownerId (User.uid, which Venue.ownerId points to) rides on the
        // subaccount so webhook events can be traced back to our user.
        metadata: {ownerId},
      });

      const subaccountCode = body.data.subaccount_code;

      try {
        await userRef.set({
          paystackSubaccountId: subaccountCode,
          verificationStatus: "VERIFIED",
          detailsSubmitted: true,
          payoutsEnabled: true,
        }, {merge: true});

        // Mirror the outcome onto every venue this owner has listed
        // (verified gates the manual publish toggle on Preview).
        const venuesSnapshot = await db.collection("venues")
            .where("ownerId", "==", ownerId).get();
        const batch = db.batch();
        venuesSnapshot.forEach((doc) => {
          batch.update(doc.ref, {verified: true});
        });
        await batch.commit();
      } catch (error) {
        console.error("Firestore update after subaccount failed:", error);
        throw new HttpsError("internal", error.message);
      }

      return {success: true, subaccountCode};
    });

// ==============================
//  PAYSTACK SUBSCRIPTION CHECKOUT
// ==============================

exports.initializePaystackSubscription = onCall(
    {secrets: ["PAYSTACK_SECRET_KEY"]},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
      }

      const {tier, interval, venueId, origin} = request.data || {};
      const plan = TIER_PLANS[tier] && TIER_PLANS[tier][interval];
      if (!plan) {
        throw new HttpsError("invalid-argument", "Unknown subscription plan.");
      }

      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecret) {
        throw new HttpsError(
            "internal", "Paystack secret key is missing in Firebase.");
      }

      // Billing email always comes from the verified auth token, never
      // from the client payload.
      const email = request.auth.token.email;
      if (!email) {
        throw new HttpsError(
            "failed-precondition",
            "Your account has no email address for billing.");
      }

      const appUrl = resolveAppUrl(origin);
      const ownerId = request.auth.uid;

      // The webhook publishes the venue named in metadata, so callers
      // may only checkout against a venue they own.
      if (venueId) {
        const venueDoc = await admin.firestore()
            .collection("venues").doc(venueId).get();
        if (!venueDoc.exists || venueDoc.data().ownerId !== ownerId) {
          throw new HttpsError(
              "permission-denied", "You do not own this venue.");
        }
      }

      // ownerId + venueId + tierLevel ride on the transaction so the
      // webhook can fulfil the resulting charge.success event.
      const body = await paystackPost(
          paystackSecret, "/transaction/initialize", {
            email: email,
            amount: plan.amountCents,
            plan: plan.planCode,
            callback_url: `${appUrl}/plans?checkout=success`,
            metadata: {ownerId, venueId: venueId || null, tierLevel: tier,
              interval},
          });

      return {success: true, url: body.data.authorization_url};
    });

// ==============================
//  PAYSTACK SELF-SERVE BILLING PORTAL
// ==============================

// Subscription statuses the portal can still surface/act on, in
// preference order when a customer has more than one on file.
const MANAGEABLE_SUB_STATUSES = ["active", "attention", "non-renewing"];

/**
 * Reads the caller's stored Paystack customer code (written by the
 * webhook on the first successful charge), or null when the user has
 * never subscribed.
 * @param {string} uid Firebase auth uid.
 * @return {Promise<?string>} Paystack customer code.
 */
async function getCustomerCode(uid) {
  const userDoc = await admin.firestore().collection("users").doc(uid).get();
  if (!userDoc.exists) return null;
  return userDoc.data().paystackCustomerCode || null;
}

/**
 * Finds the caller's BarHop subscription: fetches the Paystack customer,
 * keeps only subscriptions on known TIER_PLANS plan codes, prefers the
 * one that is still running, and returns its full detail (email token,
 * card authorization, next payment date). Everything keys off the
 * server-stored customer code — clients never supply identifiers, so
 * they can only ever manage their own subscription.
 * @param {string} secret Paystack secret key.
 * @param {string} customerCode Paystack customer code.
 * @return {Promise<{customerId: ?number, subscription: ?Object}>}
 *   Customer id (for transaction lookups) and subscription detail.
 */
async function findSubscription(secret, customerCode) {
  const customerBody = await paystackGet(secret, `/customer/${customerCode}`);
  const customer = customerBody.data || {};
  const subs = customer.subscriptions || [];

  const statusRank = (sub) => {
    const index = MANAGEABLE_SUB_STATUSES.indexOf(sub.status);
    return index === -1 ? MANAGEABLE_SUB_STATUSES.length : index;
  };
  const candidates = subs
      .filter((sub) => {
        const planCode = (sub.plan && sub.plan.plan_code) ||
          sub.plan_code || null;
        // Unknown plan codes belong to other products — skip them, but
        // keep entries whose embedded plan is missing entirely.
        return planCode === null || tierFromPlanCode(planCode) !== null;
      })
      .sort((a, b) => statusRank(a) - statusRank(b));

  const match = candidates[0];
  if (!match || statusRank(match) === MANAGEABLE_SUB_STATUSES.length) {
    return {customerId: customer.id || null, subscription: null};
  }

  const detailBody = await paystackGet(
      secret, `/subscription/${match.subscription_code}`);
  return {customerId: customer.id || null, subscription: detailBody.data};
}

// Aggregates everything the billing portal renders: subscription
// status, plan, card on file, next charge, and recent charge history.
exports.getBillingOverview = onCall(
    {secrets: ["PAYSTACK_SECRET_KEY"]},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
      }
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecret) {
        throw new HttpsError(
            "internal", "Paystack secret key is missing in Firebase.");
      }

      const customerCode = await getCustomerCode(request.auth.uid);
      if (!customerCode) {
        return {subscription: null, transactions: []};
      }

      const {customerId, subscription} =
        await findSubscription(paystackSecret, customerCode);

      let subscriptionPayload = null;
      if (subscription) {
        const plan = subscription.plan || {};
        const card = subscription.authorization || null;
        subscriptionPayload = {
          status: subscription.status,
          tier: tierFromPlanCode(plan.plan_code),
          planName: plan.name || "BarHop Subscription",
          interval: plan.interval || null,
          amountCents: subscription.amount || plan.amount || 0,
          currency: plan.currency || "ZAR",
          nextPaymentDate: subscription.next_payment_date || null,
          card: card ? {
            brand: card.brand || card.card_type || "card",
            last4: card.last4 || "",
            expMonth: card.exp_month || "",
            expYear: card.exp_year || "",
          } : null,
        };
      }

      let transactions = [];
      if (customerId) {
        const txBody = await paystackGet(
            paystackSecret,
            `/transaction?customer=${customerId}&perPage=12`);
        transactions = (txBody.data || [])
            .filter((tx) => tx.status !== "abandoned")
            .map((tx) => ({
              reference: tx.reference,
              amountCents: tx.amount,
              currency: tx.currency || "ZAR",
              paidAt: tx.paid_at || tx.transaction_date || null,
              status: tx.status,
              description: (tx.plan && tx.plan.name) ||
                (tx.plan_object && tx.plan_object.name) ||
                "Subscription payment",
            }));
      }

      return {subscription: subscriptionPayload, transactions};
    });

// Generates a short-lived link to Paystack's hosted subscription
// management page, where the customer updates the card on file.
exports.getSubscriptionManageLink = onCall(
    {secrets: ["PAYSTACK_SECRET_KEY"]},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
      }
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecret) {
        throw new HttpsError(
            "internal", "Paystack secret key is missing in Firebase.");
      }

      const customerCode = await getCustomerCode(request.auth.uid);
      if (!customerCode) {
        throw new HttpsError(
            "failed-precondition", "You have no billing profile yet.");
      }
      const {subscription} =
        await findSubscription(paystackSecret, customerCode);
      if (!subscription) {
        throw new HttpsError(
            "failed-precondition",
            "No active subscription found for your account.");
      }

      const linkBody = await paystackGet(
          paystackSecret,
          `/subscription/${subscription.subscription_code}/manage/link`);
      return {link: linkBody.data.link};
    });

// Cancels auto-renewal for the caller's subscription (Paystack
// "disable"). Access continues until the paid period lapses — the
// subscription.disable webhook drops the tier when it actually ends.
exports.cancelPaystackSubscription = onCall(
    {secrets: ["PAYSTACK_SECRET_KEY"]},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
      }
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecret) {
        throw new HttpsError(
            "internal", "Paystack secret key is missing in Firebase.");
      }

      const customerCode = await getCustomerCode(request.auth.uid);
      if (!customerCode) {
        throw new HttpsError(
            "failed-precondition", "You have no billing profile yet.");
      }
      const {subscription} =
        await findSubscription(paystackSecret, customerCode);
      if (!subscription) {
        throw new HttpsError(
            "failed-precondition",
            "No active subscription found for your account.");
      }
      // Already scheduled to end — treat a repeat cancel as success.
      if (subscription.status === "non-renewing") {
        return {success: true, status: "non-renewing"};
      }

      await paystackPost(paystackSecret, "/subscription/disable", {
        code: subscription.subscription_code,
        token: subscription.email_token,
      });
      return {success: true, status: "non-renewing"};
    });

// ==============================
//  PAYSTACK WEBHOOK: SUBSCRIPTION FULFILLMENT
// ==============================

/**
 * Resolves the tier key ("starter" | "pro" | "enterprise") from a
 * Paystack plan code (monthly or annual), or null when unknown.
 * @param {string} planCode Paystack plan code from the event payload.
 * @return {?string} Matching tier key.
 */
function tierFromPlanCode(planCode) {
  for (const tierKey of Object.keys(TIER_PLANS)) {
    const intervals = TIER_PLANS[tierKey];
    for (const intervalKey of Object.keys(intervals)) {
      if (intervals[intervalKey].planCode === planCode) return tierKey;
    }
  }
  return null;
}

/**
 * Finds the owner's user document from a webhook event: prefer the
 * metadata.ownerId stamped at checkout, fall back to the stored
 * Paystack customer code for renewal charges (which drop metadata).
 * @param {FirebaseFirestore.Firestore} db Firestore instance.
 * @param {Object} data Paystack event data object.
 * @return {Promise<?FirebaseFirestore.DocumentReference>} User doc ref.
 */
async function resolveOwnerRef(db, data) {
  const metadataOwnerId = data.metadata && data.metadata.ownerId;
  if (metadataOwnerId) {
    return db.collection("users").doc(metadataOwnerId);
  }

  const customerCode = data.customer && data.customer.customer_code;
  if (!customerCode) return null;

  const snapshot = await db.collection("users")
      .where("paystackCustomerCode", "==", customerCode)
      .limit(1).get();
  return snapshot.empty ? null : snapshot.docs[0].ref;
}

/**
 * Applies a subscription activation/renewal from a Paystack event:
 * updates the owner's user doc, then either publishes the specific
 * venue named in checkout metadata (publish-on-payment) or mirrors the
 * tier to all of the owner's venues (renewal charges arrive without
 * metadata, and must never flip `published` back on for a venue the
 * owner manually unpublished). Idempotent — charge.success and
 * subscription.create both fire for a single signup, in any order.
 * @param {FirebaseFirestore.Firestore} db Firestore instance.
 * @param {Object} data Paystack event data object.
 */
async function applyTierActivation(db, data) {
  const ownerRef = await resolveOwnerRef(db, data);
  const planCode = data.plan && data.plan.plan_code;
  const metadata = data.metadata || {};
  const tier = metadata.tierLevel || metadata.tier ||
    tierFromPlanCode(planCode);
  const customerCode = data.customer && data.customer.customer_code;

  // Only plan charges drive tiers; ignore one-off payments and events
  // we cannot attribute (subscription.create carries no metadata — the
  // paired charge.success completes activation instead).
  if (!ownerRef || !tier || !TIER_PLANS[tier]) return;

  const update = {subscriptionTier: tier};
  if (customerCode) {
    // Remember the customer for renewals, which arrive without our
    // checkout metadata.
    update.paystackCustomerCode = customerCode;
  }
  await ownerRef.set(update, {merge: true});

  const venueId = metadata.venueId;
  if (venueId) {
    const venueRef = db.collection("venues").doc(venueId);
    const venueDoc = await venueRef.get();
    if (venueDoc.exists) {
      await venueRef.update({subscriptionTier: tier, published: true});
      return;
    }
    // Venue deleted between checkout and webhook: fall through to the
    // mirror path rather than erroring (a 500 makes Paystack retry a
    // permanently unfulfillable event forever).
    console.warn(`Venue ${venueId} from checkout metadata not found.`);
  }

  const venuesSnapshot = await db.collection("venues")
      .where("ownerId", "==", ownerRef.id).get();
  const batch = db.batch();
  venuesSnapshot.forEach((doc) => {
    batch.update(doc.ref, {subscriptionTier: tier});
  });
  await batch.commit();
}

// Paystack calls this endpoint (server-to-server) for account events.
// charge.success / subscription.create activate or renew a
// subscription tier; subscription.disable drops the owner back to the
// trial tier.
exports.paystackWebhookHandler = onRequest(
    {secrets: ["PAYSTACK_SECRET_KEY"], cors: false},
    async (req, res) => {
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecret) {
        console.error("Paystack secret key is missing in Firebase.");
        res.status(500).send("Webhook is not configured.");
        return;
      }

      // Paystack signs the raw body with the account's secret key.
      const signature = req.headers["x-paystack-signature"];
      const expected = crypto.createHmac("sha512", paystackSecret)
          .update(req.rawBody).digest("hex");
      if (!signature || signature !== expected) {
        console.error("Paystack webhook signature verification failed.");
        res.status(401).send("Invalid signature.");
        return;
      }

      const event = req.body;
      const eventName = event.event || event.type;
      const db = admin.firestore();

      try {
        if (eventName === "charge.success" ||
            eventName === "subscription.create") {
          await applyTierActivation(db, event.data || {});
        } else if (eventName === "subscription.not_renew") {
          // Portal cancellation: the subscription stays paid up until
          // the period lapses. Paystack sends subscription.disable when
          // it actually ends — that is when the tier drops.
        } else if (eventName === "subscription.disable") {
          const data = event.data || {};
          const ownerRef = await resolveOwnerRef(db, data);

          if (ownerRef) {
            await ownerRef.set(
                {subscriptionTier: "trial"}, {merge: true});

            // `published` is intentionally left alone here; whether a
            // lapsed subscription auto-unpublishes the venue card is a
            // future product decision (grace periods, dunning).
            const venuesSnapshot = await db.collection("venues")
                .where("ownerId", "==", ownerRef.id).get();
            const batch = db.batch();
            venuesSnapshot.forEach((doc) => {
              batch.update(doc.ref, {subscriptionTier: "trial"});
            });
            await batch.commit();
          }
        }

        res.json({received: true});
      } catch (error) {
        // Non-2xx makes Paystack retry the event later, so fail loudly
        // on Firestore errors instead of acknowledging a dropped update.
        console.error("Paystack webhook handling error:", error);
        res.status(500).send("Webhook handler failed.");
      }
    });

// ==============================
//  FOURSQUARE PLACE LOOKUP (owner venue ownership confirmation)
// ==============================

// Same host + version as functions/refreshDistrictVenues.js, so the
// fsq_place_id captured here shares the namespace the scheduled district
// refresh writes onto stubs — that is what lets the consumer app dedupe an
// owner's real card against its bare Foursquare stub
// (src/services/venueService.ts). KEEP THESE TWO IN SYNC with that file.
const FSQ_SEARCH_URL = "https://places-api.foursquare.com/places/search";
const FSQ_API_VERSION = "2025-06-17";

// Proxied place search used by venue creation to CONFIRM the venue is a real
// Foursquare place and capture its fsq_place_id (→ venues/{id}.placeId).
// Server-side so the Foursquare key never reaches the browser bundle — a
// REACT_APP_* key would ship to every visitor. Requests only Pro (default)
// fields; no `fields` param, so it stays on the free/Pro tier.
exports.searchFoursquarePlaces = onCall(
    {secrets: ["FOURSQUARE_API_KEY"]},
    async (request) => {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
      }

      const apiKey = process.env.FOURSQUARE_API_KEY;
      if (!apiKey) {
        throw new HttpsError(
            "internal", "Foursquare API key is missing in Firebase.");
      }

      const {query, near, ll} = request.data || {};
      if (!query || !String(query).trim()) {
        throw new HttpsError(
            "invalid-argument", "A venue name to search for is required.");
      }

      const params = new URLSearchParams({
        query: String(query).trim(),
        limit: "10",
      });
      // Explicit coordinates win; otherwise search "near" a place name,
      // defaulting to Johannesburg so a bare venue name still resolves.
      if (ll && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(ll)) {
        params.set("ll", ll);
      } else {
        params.set(
            "near", (near && String(near).trim()) || "Johannesburg, ZA");
      }

      let response;
      try {
        response = await fetch(`${FSQ_SEARCH_URL}?${params}`, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "X-Places-Api-Version": FSQ_API_VERSION,
            "accept": "application/json",
          },
        });
      } catch (err) {
        throw new HttpsError("unavailable", "Could not reach Foursquare.");
      }

      if (!response.ok) {
        console.error(`Foursquare search error (HTTP ${response.status}).`);
        throw new HttpsError(
            "failed-precondition", "Foursquare place search failed.");
      }

      const body = await response.json();
      const results = (body.results || [])
          .map((place) => {
            const geo = (place.geocodes && place.geocodes.main) || {};
            const loc = place.location || {};
            return {
              placeId: place.fsq_place_id,
              name: place.name || "",
              address: loc.formatted_address || loc.address || "",
              latitude:
                place.latitude != null ? place.latitude : geo.latitude,
              longitude:
                place.longitude != null ? place.longitude : geo.longitude,
              categories: (place.categories || [])
                  .map((c) => c.name)
                  .filter(Boolean),
            };
          })
          .filter((p) => p.placeId);

      // Track the billed search call for the admin console (best-effort).
      await recordFoursquareUsage(admin.firestore(), "search", 1)
          .catch(() => {});

      return {results};
    });

// ==============================
//  ADMIN CONSOLE
// ==============================

// Allowlisted admin accounts. The client mirrors this to gate the /admin route
// (src/config/admin.js), but THIS server-side check is the real control: every
// admin callable verifies the caller's token email against it.
const ADMIN_EMAILS = ["kiransoodyall03@gmail.com"];

/**
 * Throws unless the caller is a signed-in, allowlisted admin.
 * @param {Object} request The callable request.
 */
function assertAdmin(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }
  const email = request.auth.token.email;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    throw new HttpsError("permission-denied", "Admins only.");
  }
}

// Revenue & subscriptions for the admin console, pulled live from Paystack:
// MRR from active subscriptions, per-tier active counts, this month's
// transaction volume, and the most recent successful charges. (Venue / owner /
// usage figures are read live with Firestore listeners, not here.)
exports.getAdminRevenue = onCall(
    {secrets: ["PAYSTACK_SECRET_KEY"]},
    async (request) => {
      assertAdmin(request);
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) {
        throw new HttpsError(
            "internal", "Paystack secret key is missing in Firebase.");
      }

      // Active subscriptions → MRR (monthly-equivalent) + per-tier counts.
      const subsBody = await paystackGet(secret, "/subscription?perPage=100");
      const activeStatuses = ["active", "non-renewing", "attention"];
      const byTier = {starter: 0, pro: 0, enterprise: 0};
      let mrrCents = 0;
      let activeSubscriptions = 0;
      (subsBody.data || []).forEach((sub) => {
        if (!activeStatuses.includes(sub.status)) return;
        const plan = sub.plan || {};
        const tier = tierFromPlanCode(plan.plan_code || sub.plan_code);
        if (!tier) return;
        activeSubscriptions += 1;
        if (byTier[tier] !== undefined) byTier[tier] += 1;
        const amount = sub.amount || plan.amount || 0;
        const interval = plan.interval || "monthly";
        mrrCents += /year|annual/i.test(interval) ? amount / 12 : amount;
      });

      // This month's successful transaction volume.
      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const totalsBody = await paystackGet(
          secret, `/transaction/totals?from=${monthStart.toISOString()}`);
      const totals = totalsBody.data || {};

      // Most recent successful charges.
      const txBody = await paystackGet(secret, "/transaction?perPage=10");
      const recentTransactions = (txBody.data || [])
          .filter((tx) => tx.status === "success")
          .map((tx) => ({
            reference: tx.reference,
            amountCents: tx.amount,
            currency: tx.currency || "ZAR",
            paidAt: tx.paid_at || tx.transaction_date || null,
            email: (tx.customer && tx.customer.email) || "",
            plan: (tx.plan && tx.plan.name) ||
              (tx.plan_object && tx.plan_object.name) || "",
          }));

      return {
        generatedAt: new Date().toISOString(),
        mrrCents: Math.round(mrrCents),
        activeSubscriptions,
        byTier,
        thisMonth: {
          volumeCents: totals.total_volume || 0,
          count: totals.total_transactions || 0,
        },
        recentTransactions,
      };
    });
