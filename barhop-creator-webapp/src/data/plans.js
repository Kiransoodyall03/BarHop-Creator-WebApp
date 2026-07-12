// The 3-tier subscription matrix. Display strings only — the Paystack
// plan codes and amounts live server-side in functions/index.js
// (TIER_PLANS); tier gating logic lives in hooks/useSubscription.js.
export const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    tagline: 'Get your venue on the map.',
    priceMonthly: 'R497',
    priceAnnualPerMonth: 'R414',
    priceAnnualTotal: 'R4,970',
    features: [
      'Basic Venue Card (3 HD Images)',
      'Standard Swipe Injection',
      'Basic Marketing Analytics',
      'Unlimited Staff Logins',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    tagline: 'Turn foot traffic into regulars.',
    highlight: true,
    priceMonthly: 'R1,497',
    priceAnnualPerMonth: 'R1,248',
    priceAnnualTotal: 'R14,970',
    features: [
      'Premium Venue Card (7s Video)',
      'Standout Swipe Priority',
      'VIP Reservations & Guestlists',
      'Deposit Capture via Paystack',
      'Match-to-Visit Analytics',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    tagline: 'The full nightlife command center.',
    priceMonthly: 'R3,497',
    priceAnnualPerMonth: 'R2,914',
    priceAnnualTotal: 'R34,970',
    features: [
      'Everything in Pro',
      'Staff Payout Automation',
      'Deep Demographic Heatmaps',
      'Full Revenue & RevPASH Analytics',
      'Multi-Venue Group Linking',
    ],
  },
];
