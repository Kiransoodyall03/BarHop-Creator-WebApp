const functions = require("firebase-functions/v2/https");
const admin     = require("firebase-admin");
const fetch     = require("node-fetch");

admin.initializeApp();

// ==============================
//  FOURSQUARE VENUE SEARCH
//  Proxies Foursquare Places API to avoid CORS
// ==============================

exports.foursquareSearch = functions.onCall(async (request) => {
  // Must be logged in
  if (!request.auth) {
    throw new functions.HttpsError(
      "unauthenticated",
      "You must be logged in to search for venues."
    );
  }

  const { query, location } = request.data;

  if (!query || !location) {
    throw new functions.HttpsError(
      "invalid-argument",
      "query and location are required."
    );
  }

  // Read from process.env (functions/.env file)
  const apiKey = process.env.FOURSQUARE_API_KEY;

  if (!apiKey) {
    throw new functions.HttpsError(
      "internal",
      "Foursquare API key not configured."
    );
  }

  const params = new URLSearchParams({
    query,
    near:       location,
    categories: "13000,13003,13065,13029,13031",
    limit:      "10",
    fields:     "fsq_id,name,location,tel,website,hours,categories,photos,rating",
  });

  const response = await fetch(
    `https://api.foursquare.com/v3/places/search?${params}`,
    {
      headers: {
        Authorization: apiKey,
        Accept:        "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new functions.HttpsError(
      "internal",
      `Foursquare API error: ${response.status}`
    );
  }

  const json = await response.json();

  const venues = (json.results || []).map((place) => ({
    fsqId:    place.fsq_id,
    name:     place.name,
    address:  place.location?.formatted_address ?? "",
    city:     place.location?.locality          ?? "",
    phone:    place.tel                         ?? "",
    website:  place.website                     ?? "",
    category: place.categories?.[0]?.name       ?? "Venue",
    photoUrl: place.photos?.[0]
      ? `${place.photos[0].prefix}300x300${place.photos[0].suffix}`
      : null,
    rating:   place.rating ?? null,
    hours:    place.hours?.display ?? "",
  }));

  return { venues };
});