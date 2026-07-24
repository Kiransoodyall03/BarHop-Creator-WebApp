import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useError } from '../context/ErrorContext';
import { initializeSubscription } from '../firebase/subscriptionService';
// Rank position in TIER_ORDER drives the Current Plan / Downgrade /
// Upgrade Now states when an existing subscriber views the matrix.
import { TIER_ORDER } from '../hooks/useSubscription';
import { PLANS } from '../data/plans';
import { SUPPORT_EMAIL } from '../data/platform';
import { brandButton } from './ui/Brand';

function BillingToggle({ billingInterval, onChange }) {
  const isAnnual = billingInterval === 'annual';
  const tab = (active) =>
    `flex items-center gap-2 rounded-full px-5 py-2 font-display text-sm font-bold transition ${
      active
        ? 'bg-brand-warm text-white'
        : 'text-white/60 hover:text-white'
    }`;

  return (
    <div className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.06] p-1">
      <button
        type="button"
        data-testid="billing-toggle-annual"
        aria-pressed={isAnnual}
        onClick={() => onChange('annual')}
        className={tab(isAnnual)}
      >
        Annual
        <span className="rounded-full bg-brand-cool px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
          2 Months Free
        </span>
      </button>
      <button
        type="button"
        data-testid="billing-toggle-monthly"
        aria-pressed={!isAnnual}
        onClick={() => onChange('monthly')}
        className={tab(!isAnnual)}
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
      className={`relative flex flex-col rounded-2xl border bg-white/[0.04] p-8 backdrop-blur-sm transition ${
        plan.highlight
          ? 'border-brand-orange/60 shadow-[0_20px_45px_rgba(0,0,0,0.35)] lg:z-10 lg:-translate-y-3 lg:scale-105'
          : 'border-white/10 hover:border-white/25'
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-warm px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white">
          Most Popular
        </span>
      )}

      <h2 className="font-display text-xl font-bold text-white">{plan.name}</h2>
      <p className="mt-1 font-mono text-sm text-white/60">{plan.tagline}</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-5xl font-bold tracking-tight text-white">
          {isAnnual ? plan.priceAnnualPerMonth : plan.priceMonthly}
        </span>
        <span className="font-mono text-sm text-white/60">/mo</span>
      </div>
      <p className="mt-1 font-mono text-xs text-white/50">
        {isAnnual
          ? `Billed annually · ${plan.priceAnnualTotal}/yr`
          : 'Billed monthly'}
      </p>

      <ul className="mt-8 flex-1 space-y-3 font-mono text-sm text-white/70">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <SparklesIcon
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                plan.highlight ? 'text-brand-orange' : 'text-brand-blue'
              }`}
              aria-hidden="true"
            />
            {feature}
          </li>
        ))}
      </ul>

      <button
        type="button"
        data-testid={`plan-cta-${plan.key}`}
        onClick={() => onSelect(plan.key)}
        disabled={isDisabled || isCurrent || isDowngrade}
        className={brandButton(
          plan.highlight ? 'primary' : 'cool',
          'lg',
          'mt-8 w-full'
        )}
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

      <p className="mt-10 text-center font-mono text-xs text-white/50">
        Prices in ZAR. Cancel anytime. Payments secured by Paystack.
        {currentTier && (
          <>
            {' '}
            Downgrades aren&apos;t self-serve yet —{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=BarHop%20Downgrade%20Request`}
              className="font-bold text-brand-orange hover:underline"
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
