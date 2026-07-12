import { httpsCallable } from 'firebase/functions';
import { functions } from './config';

// Starts a Paystack checkout for a subscription plan.
// tier: 'starter' | 'pro' | 'enterprise'
// interval: 'monthly' | 'annual'
// venueId: the venue to activate & publish once payment clears.
// Resolves to { success, url } where url is the Paystack-hosted payment
// page to redirect the browser to. The plan code and billing email are
// resolved server-side; the client never sends either.
export const initializeSubscription = async ({ tier, interval, venueId }) => {
  const initializePaystackSubscription = httpsCallable(
    functions,
    'initializePaystackSubscription'
  );
  const response = await initializePaystackSubscription({
    tier,
    interval,
    venueId: venueId || null,
    origin: window.location.origin,
  });
  return response.data;
};

// Self-serve billing portal. All three callables resolve the caller's
// subscription server-side from their stored Paystack customer code —
// nothing identifying is sent from the client.

// Resolves to { subscription | null, transactions: [] } — status, plan,
// card on file, next charge, and recent charge history.
export const getBillingOverview = async () => {
  const callable = httpsCallable(functions, 'getBillingOverview');
  const response = await callable();
  return response.data;
};

// Resolves to { link } — Paystack's hosted page for updating the card
// on file for the active subscription.
export const getSubscriptionManageLink = async () => {
  const callable = httpsCallable(functions, 'getSubscriptionManageLink');
  const response = await callable();
  return response.data;
};

// Stops auto-renewal; access continues until the paid period ends.
// Resolves to { success, status: 'non-renewing' }.
export const cancelSubscription = async () => {
  const callable = httpsCallable(functions, 'cancelPaystackSubscription');
  const response = await callable();
  return response.data;
};
