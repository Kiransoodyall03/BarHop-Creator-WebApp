import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Fetches revenue & subscription figures from Paystack through the admin-gated
 * callable (rejects non-admins server-side). Venue / owner / district / usage
 * data is read LIVE with Firestore listeners in the page, not through this —
 * Paystack is the only source that can't be a realtime listener.
 *
 * @return {Promise<Object>} MRR, active subs, this-month volume, recent charges.
 */
export async function getAdminRevenue() {
  const callable = httpsCallable(getFunctions(), 'getAdminRevenue');
  const { data } = await callable();
  return data;
}
