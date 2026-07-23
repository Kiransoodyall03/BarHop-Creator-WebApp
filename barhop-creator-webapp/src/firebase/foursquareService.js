import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Searches Foursquare for a venue through the server-side proxy so the API key
 * never reaches the browser. Each candidate carries the Foursquare
 * `fsq_place_id`, which venue creation stores on `venues/{id}.placeId` to
 * confirm ownership and to let the consumer app dedupe the owner's card against
 * its auto-generated district stub (both sides share this ID namespace).
 *
 * @param {{query: string, near?: string, ll?: string}} args Search terms:
 *   `query` is the venue name; `near` is a locality (suburb/city); `ll` is an
 *   optional "lat,lng" bias.
 * @return {Promise<Array<Object>>} Candidate places (placeId, name, address,
 *   latitude, longitude, categories).
 */
export async function searchFoursquarePlaces({ query, near, ll }) {
  const callable = httpsCallable(getFunctions(), 'searchFoursquarePlaces');
  const { data } = await callable({ query, near, ll });
  return (data && data.results) || [];
}
