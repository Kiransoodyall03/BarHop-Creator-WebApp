const admin = require("firebase-admin");

/**
 * Records Foursquare API usage into a per-month counter document
 * (apiUsage/foursquare_YYYY-MM) so the admin console can track spend against
 * the free tier. Best-effort: callers should not let a usage-write failure
 * fail their main work.
 * @param {FirebaseFirestore.Firestore} db Firestore instance.
 * @param {string} type Call bucket — "refresh" or "search".
 * @param {number} count Number of API calls to add.
 * @return {Promise<void>}
 */
async function recordFoursquareUsage(db, type, count) {
  if (!count) return;
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  await db.collection("apiUsage").doc(`foursquare_${month}`).set({
    provider: "foursquare",
    month,
    [`${type}Calls`]: admin.firestore.FieldValue.increment(count),
    totalCalls: admin.firestore.FieldValue.increment(count),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});
}

module.exports = {recordFoursquareUsage};
