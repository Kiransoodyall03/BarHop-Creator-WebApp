/* eslint-disable max-len */
// ─────────────────────────────────────────────────────────────────────────────
// refreshDistrictVenues — the ONLY thing in this project that calls Foursquare.
//
// Scheduled once per curated district per day; the result is fanned out through
// Firestore so every consumer-app user in a district reads ONE shared document
// instead of calling Foursquare themselves. Cost scales with DISTRICT COUNT,
// never user count (20 districts × 30 days = 600 calls/month ≈ $1.50; the first
// 500 Pro calls are free, so ≤16 districts is free outright).
//
// Deploy SCOPED — both this repo and the consumer-app repo deploy functions to
// the same Firebase project, and an unscoped `--only functions` DELETES every
// function this repo doesn't locally define:
//     firebase deploy --only functions:refreshDistrictVenues
//
// Pricing guardrail: request Foursquare Pro (default) fields ONLY. Never add a
// `fields` param naming a premium field (photos/tips/hours/rating) — that
// reprices EVERY call from $15 to $18.75 CPM with no free allowance. Stubs
// intentionally carry no images and no hours; media arrives when an owner
// claims the venue in the Creator webapp, which is the incentive to claim it.
// ─────────────────────────────────────────────────────────────────────────────

const {onSchedule} = require("firebase-functions/v2/scheduler");
const {defineSecret} = require("firebase-functions/params");
const {logger} = require("firebase-functions/v2");
const admin = require("firebase-admin");

// Same secret name the owner-side Foursquare proxy uses — one key, one
// namespace, so owner venues and stubs carry matching fsq_place_ids.
const FOURSQUARE_API_KEY = defineSecret("FOURSQUARE_API_KEY");

const PLACES_SEARCH_URL = "https://places-api.foursquare.com/places/search";
const PLACES_API_VERSION = "2025-06-17";

// Default Foursquare category filter used when a district doc does not set its
// own `categoryIds`. ⚠️ The NEW places-api host uses INTEGER taxonomy IDs — the
// legacy 24-char hex IDs (e.g. 4d4b7105d754a06376d81259, "Nightlife Spot") are
// NOT valid here. These are BEST-EFFORT — Bar (13003) + Night Club (10032) —
// and MUST be confirmed with one live test call before the deck is trusted
// (see the deploy notes): wrong IDs silently return coffee shops, not bars. The
// first-run log below prints sample venue names so a mismatch is obvious.
// Override per district via districts/{id}.categoryIds.
const NIGHTLIFE_CATEGORY_IDS = ["13003", "10032"];

// Hard ceiling on calls per run: a district registry that grows by accident
// must not silently escalate the bill — skip the tail and log loudly.
const MAX_DISTRICTS_PER_RUN = 40;

// Keep each snapshot comfortably inside Firestore's 1 MiB document limit.
const MAX_VENUES_PER_DISTRICT = 60;

// > the 24h refresh cadence, so a single skipped run doesn't expire the cache.
const SNAPSHOT_TTL_HOURS = 36;

exports.refreshDistrictVenues = onSchedule(
    {
      // Daily, not hourly. Venue EXISTENCE changes over weeks, and every
      // fast-moving field (hours/ratings/photos) is premium and deliberately
      // not fetched — a faster cadence would multiply cost while changing
      // nothing. onSchedule auto-creates the Cloud Scheduler job on deploy.
      schedule: "every day 04:00",
      timeZone: "Africa/Johannesburg",
      secrets: [FOURSQUARE_API_KEY],
      retryCount: 1,
    },
    async () => {
      const db = admin.firestore();

      const districtsSnap = await db
          .collection("districts")
          .where("active", "==", true)
          .get();

      if (districtsSnap.empty) {
        logger.warn(
            "refreshDistrictVenues: no active districts configured; nothing to do");
        return;
      }

      const districts = districtsSnap.docs.map((d) => ({id: d.id, ...d.data()}));
      if (districts.length > MAX_DISTRICTS_PER_RUN) {
        logger.error(
            `refreshDistrictVenues: ${districts.length} active districts exceeds ` +
            `the ${MAX_DISTRICTS_PER_RUN} ceiling — truncating. Raise the ceiling ` +
            "deliberately if this growth is intended.");
      }
      const batch = districts.slice(0, MAX_DISTRICTS_PER_RUN);

      const apiKey = FOURSQUARE_API_KEY.value();
      const now = admin.firestore.Timestamp.now();
      const expiresAt = admin.firestore.Timestamp.fromMillis(
          now.toMillis() + SNAPSHOT_TTL_HOURS * 60 * 60 * 1000);

      let succeeded = 0;

      // Sequential on purpose: a handful of districts a day needs no
      // concurrency, and serial calls stay well clear of Foursquare's limits.
      for (const district of batch) {
        try {
          const venues = await searchDistrict(district, apiKey);

          await db.collection("districtVenues").doc(district.id).set({
            districtId: district.id,
            name: district.name,
            center: district.center,
            radiusM: district.radiusM,
            venues,
            source: "foursquare",
            fetchedAt: now,
            expiresAt,
          });

          succeeded += 1;
          // First-run verification aid: printing a few venue NAMES makes a
          // wrong category filter (e.g. coffee shops instead of bars) obvious
          // in the logs without opening Firestore.
          const sampleNames = venues.slice(0, 5).map((v) => v.name).join(", ");
          logger.info(
              `refreshDistrictVenues: ${district.id} → ${venues.length} venues` +
              (sampleNames ? ` (${sampleNames})` : ""));
        } catch (error) {
          // One bad district must not abort the rest — a stale snapshot for the
          // others beats no snapshot.
          logger.error(`refreshDistrictVenues: ${district.id} failed`, error);
        }
      }

      // Rewrite the client-facing index LAST, from the districts that exist, so
      // locating a user costs a single read no matter how many districts there
      // are.
      await db.collection("districtIndex").doc("current").set({
        districts: batch.map((d) => ({
          id: d.id,
          name: d.name,
          center: d.center,
          radiusM: d.radiusM,
        })),
        updatedAt: now,
      });

      logger.info(
          `refreshDistrictVenues: ${succeeded}/${batch.length} districts ` +
          `refreshed (${succeeded} Foursquare Pro calls billed)`);
    });

/**
 * Runs one Pro-tier Place Search for a district. Default fields only — adding
 * a `fields` param naming a premium field reprices the call (see header).
 * @param {Object} district District config doc (center, radiusM, categoryIds?).
 * @param {string} apiKey Foursquare service key.
 * @return {Promise<Array<Object>>} StubVenues found in the district.
 */
async function searchDistrict(district, apiKey) {
  const params = new URLSearchParams({
    ll: `${district.center.latitude},${district.center.longitude}`,
    radius: String(district.radiusM),
    // Foursquare caps `limit` at 50.
    limit: String(Math.min(MAX_VENUES_PER_DISTRICT, 50)),
    fsq_category_ids: (district.categoryIds ?? NIGHTLIFE_CATEGORY_IDS).join(","),
    // NO `fields` param — naming a premium field reprices Pro → Premium.
  });

  const response = await fetch(`${PLACES_SEARCH_URL}?${params}`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "X-Places-Api-Version": PLACES_API_VERSION,
      "accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Foursquare ${response.status}: ${await response.text()}`);
  }

  const body = await response.json();
  return (body.results ?? [])
      .map(toStubVenue)
      .filter((v) => v !== null)
      .slice(0, MAX_VENUES_PER_DISTRICT);
}

/**
 * Converts a Foursquare place into the mobile app's StubVenue shape.
 *
 * placeId is the Foursquare `fsq_place_id` — and ONLY that. The consumer app
 * dedupes stubs against owner-created venues on this exact key
 * (src/services/venueService.ts) and its type declares it as fsq_place_id
 * (src/types.ts). Falling back to the legacy v3 `fsq_id` would emit a
 * different-namespace ID that could never match an owner venue, so a place
 * missing fsq_place_id is dropped rather than mis-keyed.
 * @param {Object} place One Foursquare Place Search result.
 * @return {?Object} StubVenue, or null when it lacks an id or coordinates.
 */
function toStubVenue(place) {
  const placeId = place.fsq_place_id;
  const latitude = place.latitude ?? place.geocodes?.main?.latitude;
  const longitude = place.longitude ?? place.geocodes?.main?.longitude;

  // Coordinates are non-negotiable: without them the venue can't be distance
  // filtered or mapped, and the app's resolver falls back to a dummy pin.
  if (!placeId ||
      typeof latitude !== "number" ||
      typeof longitude !== "number") {
    return null;
  }

  const categories = normalizeCategories(place.categories);

  return {
    placeId,
    name: place.name ?? "Unnamed venue",
    address: place.location?.formatted_address ??
      place.location?.address ?? "",
    category: categories[0] ?? "bar",
    categories: categories.length ? categories : undefined,
    latitude,
    longitude,
  };
}

// Foursquare's taxonomy → the app's VENUE_CATEGORIES vocabulary. Load-bearing
// for the deck's genre filter, not cosmetic: applyProFilters is lenient only
// toward venues with NO tags, so an unmapped "Nightclub" tag is judged against
// the user's "club" chip and silently dropped. Keep this in sync with the app.
const CATEGORY_ALIASES = {
  "bar": "bar",
  "beer bar": "bar",
  "beer garden": "bar",
  "sports bar": "bar",
  "dive bar": "bar",
  "hotel bar": "bar",
  "karaoke bar": "bar",
  "nightclub": "club",
  "night club": "club",
  "discotheque": "club",
  "club": "club",
  "lounge": "lounge",
  "hookah lounge": "lounge",
  "pub": "pub",
  "gastropub": "pub",
  "irish pub": "pub",
  "cocktail bar": "cocktail bar",
  "speakeasy": "cocktail bar",
  "whisky bar": "cocktail bar",
  "wine bar": "wine bar",
  "winery": "wine bar",
  "rooftop bar": "rooftop",
  "rooftop": "rooftop",
  "music venue": "live music",
  "jazz club": "live music",
  "rock club": "live music",
  "live music venue": "live music",
};

// Longest alias first: plain "bar" is a substring of "cocktail bar", so naive
// key order would bucket every cocktail bar as a generic bar.
const ALIASES_BY_SPECIFICITY = Object.entries(CATEGORY_ALIASES)
    .sort((a, b) => b[0].length - a[0].length);

/**
 * Folds Foursquare's category labels into the app's canonical vocabulary,
 * de-duped and capped at three. Returns [] when nothing maps — an untagged
 * venue then keeps applyProFilters' lenient path instead of being excluded by
 * a vocabulary mismatch it had no say in.
 * @param {Array<Object>} rawCategories Foursquare place.categories.
 * @return {Array<string>} Canonical app categories (at most 3).
 */
function normalizeCategories(rawCategories) {
  const mapped = new Set();
  for (const entry of rawCategories ?? []) {
    const name = entry?.name?.trim().toLowerCase();
    if (!name) continue;

    const exact = CATEGORY_ALIASES[name];
    if (exact) {
      mapped.add(exact);
      continue;
    }
    // Fall back to a substring hit so unseen labels ("Cocktail Bar & Grill")
    // still land in the right bucket.
    for (const [alias, canonical] of ALIASES_BY_SPECIFICITY) {
      if (name.includes(alias)) {
        mapped.add(canonical);
        break;
      }
    }
  }
  return [...mapped].slice(0, 3);
}
