import React, { useState } from 'react';
import { useError } from '../context/ErrorContext';
import { initializeSubscription } from '../firebase/subscriptionService';
// Rank position in TIER_ORDER drives the Current Plan / Downgrade /
// Upgrade Now states when an existing subscriber views the matrix.
import { TIER_ORDER } from '../hooks/useSubscription';
import { PLANS } from '../data/plans';
import { SUPPORT_EMAIL } from '../data/platform';

function BillingToggle({ billingInterval, onChange }) {
  const isAnnual = billingInterval === 'annual';
  return (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-surface-card p-1">
      <button
        type="button"
        data-testid="billing-toggle-annual"
        aria-pressed={isAnnual}
        onClick={() => onChange('annual')}
        className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
          isAnnual ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'
        }`}
      >
        Annual
        <span className="rounded-full bg-neon-violet px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-glow-violet">
          2 Months Free
        </span>
      </button>
      <button
        type="button"
        data-testid="billing-toggle-monthly"
        aria-pressed={!isAnnual}
        onClick={() => onChange('monthly')}
        className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
          !isAnnual ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'
        }`}
      >
        Monthly
      </button>
    </div>
  );
}

function PricingCard({
  plan,
  billingInterval,
  currentTier,
  isLoading,
  isDisabled,
  onSelect,
}) {
  const isAnnual = billingInterval === 'annual';
  const currentRank = TIER_ORDER.indexOf(currentTier);
  const planRank = TIER_ORDER.indexOf(plan.key);
  const isCurrent = currentRank !== -1 && planRank === currentRank;
  // Downgrades are not self-serve: Paystack has no proration, so a
  // lower-tier checkout would open a second, overlapping subscription.
  const isDowngrade = currentRank !== -1 && planRank < currentRank;

  let ctaLabel = `Choose ${plan.name}`;
  if (isLoading) {
    ctaLabel = 'Redirecting…';
  } else if (isCurrent) {
    ctaLabel = 'Current Plan';
  } else if (isDowngrade) {
    ctaLabel = 'Downgrade';
  } else if (currentRank !== -1) {
    ctaLabel = 'Upgrade Now';
  }

  return (
    <div
      data-testid={`plan-card-${plan.key}`}
      className={`relative flex flex-col rounded-2xl border bg-surface-card p-8 transition ${
        plan.highlight
          ? 'border-neon-violet/60 ring-1 ring-neon-violet shadow-glow-violet lg:z-10 lg:-translate-y-3 lg:scale-105'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-neon-violet px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
          Most Popular
        </span>
      )}

      <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
      <p className="mt-1 text-sm text-gray-400">{plan.tagline}</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-5xl font-semibold tracking-tight text-white">
          {isAnnual ? plan.priceAnnualPerMonth : plan.priceMonthly}
        </span>
        <span className="text-sm text-gray-400">/mo</span>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {isAnnual
          ? `Billed annually · ${plan.priceAnnualTotal}/yr`
          : 'Billed monthly'}
      </p>

      <ul className="mt-8 flex-1 space-y-3 text-sm text-gray-300">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span
              className={plan.highlight ? 'text-neon-violet' : 'text-accent'}
            >
              ✦
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        type="button"
        data-testid={`plan-cta-${plan.key}`}
        onClick={() => onSelect(plan.key)}
        disabled={isDisabled || isCurrent || isDowngrade}
        className={`mt-8 w-full rounded-lg py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          plan.highlight
            ? 'bg-neon-violet text-white hover:shadow-glow-violet'
            : 'bg-accent text-black hover:bg-accent-dim hover:shadow-glow-amber'
        }`}
      >
        {ctaLabel}
      </button>
    </div>
  );
}

// The 3-tier checkout matrix (annual-default toggle + cards + footnote).
// `venue` is the venue the subscription activates/publishes (CTAs are
// disabled without one); `currentTier` (a paid tier key or null) turns
// the matrix into upgrade mode: current plan disabled, lower tiers shown
// as non-self-serve downgrades, higher tiers as "Upgrade Now".
function PricingMatrix({ venue, currentTier = null }) {
  const [billingInterval, setBillingInterval] = useState('annual');
  const [loadingTier, setLoadingTier] = useState(null);
  const { showError } = useError();

  const handleSelect = async (tierKey) => {
    if (!venue) return;
    setLoadingTier(tierKey);
    try {
      const { url } = await initializeSubscription({
        tier: tierKey,
        interval: billingInterval,
        venueId: venue.id,
      });
      window.location.href = url;
    } catch (err) {
      showError(err.message || 'Could not start checkout. Please try again.');
      setLoadingTier(null);
    }
  };

  return (
    <div>
      <div className="mb-10 text-center">
        <BillingToggle
          billingInterval={billingInterval}
          onChange={setBillingInterval}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 pt-4 lg:grid-cols-3 lg:items-center">
        {PLANS.map((plan) => (
          <PricingCard
            key={plan.key}
            plan={plan}
            billingInterval={billingInterval}
            currentTier={currentTier}
            isLoading={loadingTier === plan.key}
            isDisabled={loadingTier !== null || !venue}
            onSelect={handleSelect}
          />
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-gray-500">
        Prices in ZAR. Cancel anytime. Payments secured by Paystack.
        {currentTier && (
          <>
            {' '}
            Downgrades aren&apos;t self-serve yet —{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=BarHop%20Downgrade%20Request`}
              className="text-accent hover:underline"
            >
              email support
            </a>{' '}
            and we&apos;ll switch you over.
          </>
        )}
      </p>
    </div>
  );
}

export default PricingMatrix;
