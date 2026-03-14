// ==============================
//  BARHOP TYPES
//  src/types.ts
// ==============================

// ----------------------------
//  AUTH
// ----------------------------

export type AuthProvider  = "email" | "google";

// ----------------------------
//  USER
//  Stored in Firestore: users/{uid}
//  Access via: const { currentUser } = useAuth()
//
//  currentUser.uid
//  currentUser.email
//  currentUser.firstName
//  currentUser.venueId
//  currentUser.onboardingComplete
// ----------------------------

export interface User {
  // Firebase Auth
  uid:              string;
  email:            string | null;
  displayName:      string | null;
  photoURL:         string | null;
  emailVerified:    boolean;

  // Profile
  firstName:        string;
  lastName:         string;
  provider:         AuthProvider;

  // Onboarding state
  venueId:              string | null;  // linked Google Places ID
  verified:             boolean;        // passed Google Business check
  onboardingComplete:   boolean;        // completed venue selection

  // Timestamps
  createdAt:        Date | null;
  updatedAt:        Date | null;
}

// ----------------------------
//  VENUE
//  Stored in Firestore: venues/{placeId}
//  Access via: useVenue() hook
//
//  venue.name
//  venue.category
//  venue.images
//  venue.offers
//  venue.useCustomCard
// ----------------------------

export interface Venue {
  placeId:        string;           // Google Places ID
  ownerId:        string;           // uid of the owner
  name:           string;
  address:        string;
  phone:          string;
  website:        string;
  category:       VenueCategory;
  description:    string;
  tagline:        string;
  images:         string[];         // Firebase Storage URLs
  offers:         string[];         // e.g. ["2-for-1 cocktails until 9pm"]
  hours:          VenueHours;
  socialLinks:    SocialLinks;
  useCustomCard:  boolean;          // true = override Google Places data
  published:      boolean;
  createdAt:      Date | null;
  updatedAt:      Date | null;
}

export type VenueCategory =
  | "bar"
  | "club"
  | "restaurant"
  | "karaoke"
  | "lounge"
  | "rooftop"
  | "sports bar"
  | "other";

// ----------------------------
//  VENUE HOURS
//  venue.hours.friday.open   → "18:00"
//  venue.hours.friday.close  → "02:00"
//  venue.hours.monday.closed → true
// ----------------------------

export interface VenueHours {
  monday:     DayHours;
  tuesday:    DayHours;
  wednesday:  DayHours;
  thursday:   DayHours;
  friday:     DayHours;
  saturday:   DayHours;
  sunday:     DayHours;
}

export interface DayHours {
  open:   string;   // 24hr format "18:00"
  close:  string;   // 24hr format "02:00"
  closed: boolean;
}

// ----------------------------
//  SOCIAL LINKS
//  venue.socialLinks.instagram → "https://instagram.com/barhop"
// ----------------------------

export interface SocialLinks {
  instagram:  string;
  facebook:   string;
  tiktok:     string;
}

// ----------------------------
//  ANALYTICS
//  Stored in Firestore: analytics/{placeId}
//  Access via: useAnalytics() hook
//
//  analytics.swipedRight
//  analytics.clickThroughs
// ----------------------------

export interface Analytics {
  placeId:        string;
  swipedRight:    number;
  swipedLeft:     number;
  clickThroughs:  number;
  lastUpdated:    Date | null;
}

// ----------------------------
//  CONTEXT
// ----------------------------

export interface AuthContextType {
  currentUser:  User | null;
  loading:      boolean;
}