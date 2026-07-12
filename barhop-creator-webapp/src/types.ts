// types.ts

// Represents Firestore Timestamps
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

// B2B SaaS subscription tiers ('trial' is seeded on venue creation)
export type SubscriptionTier = 'trial' | 'starter' | 'pro' | 'enterprise';

// Paystack subscription billing intervals (annual = 10 months' price,
// i.e. "2 months free")
export type BillingInterval = 'monthly' | 'annual';

// Business verification states (Paystack subaccount validation is
// synchronous, so PENDING_DOCUMENTS is a legacy/transitional state)
export type VerificationStatus = 'UNVERIFIED' | 'PENDING_DOCUMENTS' | 'VERIFIED';

// Regulatory & compliance anchor stored on users/{uid}.businessProfile.
// Seeded by the registration wizard (which still writes the legacy field
// names) and completed/maintained via Settings → Business Profile. Used
// for support, billing, tax invoicing (SARS), and statutory compliance
// (POPIA/PAIA information officer, FICA verification, ECTA disclosures).
export interface BusinessProfile {
  tradingName: string;
  registeredLegalName: string; // The CIPC registered entity name
  cipcRegistrationNumber?: string; // Strict format: YYYY/NNNNNN/NN (^\d{4}/\d{6}/\d{2}$)
  sarsVatNumber?: string; // Exactly 10 digits starting with '4' (^4\d{9}$)
  informationOfficerName: string; // Mandatory under POPIA and PAIA
  informationOfficerEmail: string;
  informationOfficerPhone: string;
  ficaVerified: boolean; // Default false; set only by backend webhooks on ID + address verification

  // Legacy field names written by the registration wizard before the
  // compliance overhaul — read with fallbacks, superseded by the fields
  // above once the owner saves the Settings form.
  registeredName?: string; // → registeredLegalName
  registrationNumber?: string; // → cipcRegistrationNumber
  vatNumber?: string; // → sarsVatNumber

  category: string; // e.g., 'Nightclub'
  yearEstablished: number;
  locationsCount: string; // '1' | '2-5' | '6+'
  capacity: string; // e.g., '150-400' (optional)
  phone: string;
  email: string;
  website: string;
  instagram: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
}

export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL: string | null;
  provider: string; // e.g., 'email'
  emailVerified: boolean;
  phone?: string; // Owner's mobile, from the registration wizard
  businessRole?: string; // Owner's role at the business, e.g. 'Owner'
  businessProfile?: BusinessProfile;
  paystackSubaccountId?: string; // Paystack Subaccount for venue payouts
  paystackCustomerCode?: string; // Paystack Customer for subscription billing
  createdAt: FirestoreTimestamp | Date;
  updatedAt: FirestoreTimestamp | Date;

  // Paystack compliance fields (set by createPaystackSubaccount)
  verificationStatus: VerificationStatus;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
}

export interface DailyHours {
  open: string; // e.g., "06:00"
  close: string; // e.g., "21:00"
  closed: boolean;
}

export interface OperatingHours {
  monday: DailyHours;
  tuesday: DailyHours;
  wednesday: DailyHours;
  thursday: DailyHours;
  friday: DailyHours;
  saturday: DailyHours;
  sunday: DailyHours;
}

export interface VenueDraft {
  ownerId: string;
  name: string;
  address: string;
  description: string;
  categories: string[]; // e.g., ["bar", "wine bar", "cocktail bar"]
  images: string[];
  hours: OperatingHours;
  status: string; // e.g., "draft"
  currentStep: number;
  createdAt: FirestoreTimestamp | Date;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  tiktok: string;
}

export interface Venue {
  placeId: string;
  ownerId: string;
  name: string;
  address: string;
  description: string;
  category: string; // Primary category (first of categories); kept for consumer-app compatibility
  categories?: string[]; // Up to 3 categories shown as chips on the swipe card
  tagline: string;
  images: string[]; // URLs from Firebase Storage
  video: string | null;
  hours: OperatingHours;
  offers: any[]; 
  phone: string;
  website: string;
  socialLinks: SocialLinks;
  useCustomCard: boolean;
  published: boolean;
  subscriptionTier?: SubscriptionTier;
  cardBorderStyle?: 'default' | 'neon-glow' | 'gold-trim'; // Pro+: premium swipe-card border
  whatsappIntegrationActive?: boolean; // Pro+: 2-way WhatsApp CRM messaging
  posIntegrationType?: 'pilot' | 'gaap' | 'none'; // Enterprise: POS revenue sync
  createdAt: FirestoreTimestamp | Date;
  updatedAt: FirestoreTimestamp | Date;

  // Mirrored from the owner's Paystack verification outcome by
  // createPaystackSubaccount; gates the manual publish toggle on Preview.
  verified: boolean;
}