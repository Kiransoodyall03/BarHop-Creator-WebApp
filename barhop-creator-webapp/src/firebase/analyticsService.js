import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';

const db = getFirestore();

/**
 * Fetches the most recent daily analytics logs for a specific venue.
 * @param {string} venueId - The ID of the venue
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} - Array of daily analytics objects
 */
export async function getVenueAnalytics(venueId, days = 30) {
  try {
    const analyticsRef = collection(db, `venues/${venueId}/analytics`);

    // Fetch the most recent logs, ordered by date descending
    const q = query(analyticsRef, orderBy('date', 'desc'), limit(days));

    const snapshot = await getDocs(q);

    const logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate() || new Date(),
    }));

    // Sort ascending for chronological charts (oldest to newest)
    return logs.reverse();
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return []; // Return empty array if collection doesn't exist yet
  }
}

/**
 * Helper function to aggregate daily logs into a single summary object
 * for the dashboard Conversion Funnel.
 */
export function aggregateAnalyticsSummary(logs) {
  const summary = {
    impressions: 0,
    swipedRight: 0,
    swipedLeft: 0,
    clickThroughs: 0,
    matchRate: 0, // Group Matches
  };

  logs.forEach((log) => {
    // Estimating impressions as the sum of all swipes (assuming 1 swipe = 1 view)
    summary.impressions += (log.swipedRight || 0) + (log.swipedLeft || 0);
    summary.swipedRight += log.swipedRight || 0;
    summary.swipedLeft += log.swipedLeft || 0;
    summary.clickThroughs += log.clickThroughs || 0;
    summary.matchRate += log.matchRate || 0;
  });

  return summary;
}
