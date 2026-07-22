// Adapter from a Firestore venue doc to VenueCardPreview's prop shape.
// The two differ (`venue.name` vs `venueData.title`), so passing a raw
// venue straight in silently renders the "Venue Title" placeholder.
// Every caller of VenueCardPreview should map through here.
//
// Deliberately kept out of VenueCardPreview.js: several test suites
// jest.mock that module with a default-export-only factory, which would
// strip a named export off it and break unrelated pages at runtime.
export function toPreviewData(venue) {
  if (!venue) return null;

  return {
    title: venue.name,
    address: venue.address,
    phone: venue.phone || '',
    website: venue.website || '',
    category: venue.category || '', // Primary (legacy) category
    categories:
      venue.categories && venue.categories.length > 0
        ? venue.categories
        : venue.category
          ? [venue.category]
          : [],
    images: venue.images || [],
    video: venue.video || null,
    description: venue.description || '',
    socialLinks: venue.socialLinks || {
      instagram: '',
      facebook: '',
      tiktok: '',
    },
    hours: venue.hours || null,
    cardBorderStyle: venue.cardBorderStyle,
  };
}
