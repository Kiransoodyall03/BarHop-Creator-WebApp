// One-off: seed the hand-curated district registry that the
// refreshDistrictVenues scheduled function reads.
//
// Needs credentials for the project (the Firebase CLI login is NOT enough).
// Simplest is a service-account key — Firebase Console → Project settings →
// Service accounts → Generate new private key — then, from the repo root:
//
//   export GOOGLE_APPLICATION_CREDENTIALS="/c/path/to/serviceAccountKey.json"
//   node functions/scripts/seedDistricts.js
//
// (Or `gcloud auth application-default login` if you have gcloud installed.)
// The project id is set explicitly below, so only credentials are required.
//
// Idempotent (merge): re-running updates values in place without duplicating
// docs. Not shipped with the deployed functions (see firebase.json
// functions.ignore). ⚠️ Sanity-check the coordinates/radii below before running
// — a wrong center silently pulls the wrong venues into that district's deck.

const admin = require("firebase-admin");

// Explicit project id so the script never fails on env auto-detection; the
// service-account key (or ADC) still supplies the credentials.
const projectId =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  "barhop-creator-webapp-ee9a8";

admin.initializeApp({projectId});

const DISTRICTS = [
  {id: "braamfontein", name: "Braamfontein",
    center: {latitude: -26.1929, longitude: 28.0305}, radiusM: 800},
  {id: "maboneng", name: "Maboneng",
    center: {latitude: -26.2044, longitude: 28.0575}, radiusM: 700},
  {id: "newtown", name: "Newtown",
    center: {latitude: -26.2028, longitude: 28.0342}, radiusM: 700},
  {id: "melville", name: "Melville",
    center: {latitude: -26.1755, longitude: 27.9985}, radiusM: 800},
  {id: "rosebank", name: "Rosebank",
    center: {latitude: -26.1440, longitude: 28.0416}, radiusM: 900},
  {id: "sandton", name: "Sandton Central",
    center: {latitude: -26.1076, longitude: 28.0567}, radiusM: 1000},
  {id: "parkhurst", name: "Parkhurst",
    center: {latitude: -26.1360, longitude: 28.0130}, radiusM: 600},
  {id: "greenside", name: "Greenside",
    center: {latitude: -26.1512, longitude: 28.0088}, radiusM: 700},
  {id: "norwood", name: "Norwood",
    center: {latitude: -26.1580, longitude: 28.0790}, radiusM: 700},
  {id: "fourways", name: "Fourways",
    center: {latitude: -26.0170, longitude: 28.0110}, radiusM: 1200},
  {id: "soweto-vilakazi", name: "Soweto (Vilakazi St)",
    center: {latitude: -26.2340, longitude: 27.9070}, radiusM: 1000},
];

/**
 * Writes each district to districts/{id} with active: true, merging so a
 * re-run updates in place rather than duplicating.
 * @return {Promise<void>}
 */
async function seed() {
  const db = admin.firestore();
  const batch = db.batch();
  for (const d of DISTRICTS) {
    const {id, ...data} = d;
    batch.set(
        db.collection("districts").doc(id),
        {...data, active: true},
        {merge: true});
  }
  await batch.commit();
  console.log(`Seeded ${DISTRICTS.length} districts.`);
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
