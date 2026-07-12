import { useMemo } from 'react';

// Paid tiers in ascending order. Rank position drives every access
// decision: a tier unlocks a feature when its rank >= the feature's
// minimum tier rank. 'trial', null, undefined and unknown values rank
// -1 and unlock nothing.
export const TIER_ORDER = ['starter', 'pro', 'enterprise'];

export const TIER_LABELS = {
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const tierRank = (tier) =>
  TIER_ORDER.indexOf(typeof tier === 'string' ? tier.toLowerCase() : tier);

// True when currentTier meets or exceeds requiredTier. Case-insensitive
// ('Pro' and 'pro' both work); an unknown requiredTier locks the gate.
export const hasTierAccess = (currentTier, requiredTier) => {
  const requiredRank = tierRank(requiredTier);
  if (requiredRank === -1) return false;
  return tierRank(currentTier) >= requiredRank;
};

// Minimum tier per feature flag. The cumulative hierarchy (enterprise ⊇
// pro ⊇ starter) falls out of the rank comparison — never hand-write
// per-tier flag sets.
export const FEATURE_MIN_TIER = {
  canPublish: 'starter',
  basicAnalytics: 'starter',
  digitalGuestlist: 'starter',
  customBorders: 'pro',
  videoUploads: 'pro',
  vipReservations: 'pro',
  whatsappAutomation: 'pro',
  staffPayouts: 'enterprise',
  advancedAnalytics: 'enterprise',
  posSync: 'enterprise',
};

// Central gating hook: pass venue.subscriptionTier, get boolean access
// flags for every gated feature (plus the normalized tier itself).
export const useSubscription = (subscriptionTier) => {
  return useMemo(() => {
    const tier =
      typeof subscriptionTier === 'string'
        ? subscriptionTier.toLowerCase()
        : null;
    const flags = {};
    for (const [feature, minTier] of Object.entries(FEATURE_MIN_TIER)) {
      flags[feature] = hasTierAccess(tier, minTier);
    }
    return { tier, ...flags };
  }, [subscriptionTier]);
};
