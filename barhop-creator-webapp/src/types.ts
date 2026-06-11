// ==============================
//  BARHOP OS B2B TYPES
//  src/types.ts
// ==============================

// ----------------------------
//  AUTH & USER
// ----------------------------
export type AuthProvider  = "email" | "google";

export interface User {
  uid:              string;
  email:            string | null;
  displayName:      string | null;
  photoURL:         string | null;
  emailVerified:    boolean;
  firstName:        string;
  lastName:         string;
  provider:         AuthProvider;
  
  // B2B Onboarding state
  venueId:          string | null;  // Linked primary venue
  verified:         boolean;        // Passed business verification
  onboardingComplete: boolean;      
  createdAt:        Date | null;
  updatedAt:        Date | null;
}

// ----------------------------
//  VENUE (Operations Core)
// ----------------------------
export interface Venue {
  id:               string;           // Firestore Document ID
  placeId:          string;           // Google Places ID
  ownerId:          string;           // uid of the owner
  name:             string;
  address:          string;
  phone:            string;
  website:          string;
  category:         VenueCategory;
  description:      string;
  images:           string[];         // Firebase Storage URLs
  hours:            VenueHours;
  socialLinks:      SocialLinks;
  
  // B2B Status Flags
  subscriptionTier: "trial" | "pro" | "enterprise";
  published:        boolean;
  createdAt:        Date | null;
  updatedAt:        Date | null;
}

export type VenueCategory = "bar" | "club" | "restaurant" | "lounge" | "rooftop" | "sports bar";

export interface VenueHours {
  monday:    DayHours;
  tuesday:   DayHours;
  wednesday: DayHours;
  thursday:  DayHours;
  friday:    DayHours;
  saturday:  DayHours;
  sunday:    DayHours;
}

export interface DayHours {
  open:   string;   // 24hr format "18:00"
  close:  string;   // 24hr format "02:00"
  closed: boolean;
}

export interface SocialLinks {
  instagram:  string;
  facebook:   string;
  tiktok:     string;
}

// ----------------------------
//  VIP RESERVATIONS (New B2B Table)
//  Stored in Firestore: venues/{venueId}/reservations/{resId}
// ----------------------------
export type ReservationStatus = "Pending" | "Confirmed" | "Arrived" | "No-Show" | "Cancelled";

export interface Reservation {
  id:               string;
  venueId:          string;
  guestName:        string;
  guestPhone:       string;
  partySize:        number;
  tableNumber:      string;
  minimumSpend:     number;
  status:           ReservationStatus;
  reservationDate:  Date | null;      // The night of the booking
  createdAt:        Date | null;
}

// ----------------------------
//  STAFF & PAYOUTS (New B2B Table)
//  Stored in Firestore: venues/{venueId}/staff/{staffId}
// ----------------------------
export type StaffRole = "Manager" | "Bartender" | "Server" | "Security" | "Entertainer";

export interface StaffMember {
  id:               string;
  venueId:          string;
  name:             string;
  role:             StaffRole;
  baseRate:         number;           // Hourly rate or flat fee
  pendingPayout:    number;           // Unpaid wages/tips for the current period
  status:           "Active" | "Inactive";
}

// ----------------------------
//  REVENUE ANALYTICS (Revised for SaaS)
//  Stored in Firestore: venues/{venueId}/analytics/{dateString}
// ----------------------------
export interface RevenueAnalytics {
  id:               string;           // e.g., "2023-10-27"
  venueId:          string;
  date:             Date | null;
  totalRevenue:     number;
  vipTableSpend:    number;
  guestlistCount:   number;
  walkInCount:      number;
  lastUpdated:      Date | null;
}