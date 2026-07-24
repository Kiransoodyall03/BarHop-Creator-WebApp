import React, { useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import PricingMatrix from '../components/PricingMatrix';
import { TIER_ORDER } from '../hooks/useSubscription';
import { PLANS } from '../data/plans';
import {
  Chip,
  GradientText,
  PageHeading,
  PageShell,
  PANEL,
  RING_SETS,
  SegmentedRule,
  brandButton,
} from '../components/ui/Brand';

function ActiveSubscriptionView({ tier, onUpgrade }) {
  const plan = PLANS.find((p) => p.key === tier);
  if (!plan) return null;
  const isTopTier = tier === TIER_ORDER[TIER_ORDER.length - 1];

  return (
    <section
      data-testid="active-subscription-view"
      className={`${PANEL} mx-auto w-full max-w-3xl p-8 lg:p-10`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-bold text-white">
          {plan.name} Plan
        </h2>
        <Chip tone="success" data-testid="active-badge">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
          Active
        </Chip>
      </div>
      <p className="mt-1 font-mono text-sm text-white/60">{plan.tagline}</p>

      <div className="mt-8 flex flex-col gap-6">
        <SegmentedRule variant="cool" />
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/50">
            Unlocked with your plan
          </h3>
          <ul className="mt-4 grid gap-3 font-mono text-sm text-white/70 sm:grid-cols-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <CheckIcon
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-green"
                  aria-hidden="true"
                />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <SegmentedRule variant="cool" />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          data-testid="upgrade-plan-button"
          onClick={onUpgrade}
          className={brandButton('primary', 'lg')}
        >
          {isTopTier ? 'View All Plans' : 'Upgrade Plan'}
        </button>
        <Link
          data-testid="manage-billing-button"
          to="/settings?tab=billing"
          className={brandButton('outline', 'lg')}
        >
          Manage Billing
        </Link>
      </div>
      <p className="mt-4 font-mono text-xs text-white/50">
        Update your card, cancel auto-renewal, or view your billing history in
        the self-serve billing portal.
      </p>
    </section>
  );
}

function PricingDashboard() {
  const [isUpgradeMode, setIsUpgradeMode] = useState(false);
  const [searchParams] = useSearchParams();
  const { activeVenue } = useOutletContext();
  const checkoutState = searchParams.get('checkout');

  // The webhook stamps 'starter' | 'pro' | 'enterprise' onto the venue;
  // 'trial', null or undefined all mean "not subscribed yet".
  const currentTier = activeVenue && activeVenue.subscriptionTier;
  const hasActivePlan = TIER_ORDER.includes(currentTier);
  const showPricingMatrix = !hasActivePlan || isUpgradeMode;

  return (
    <PageShell rings={RING_SETS.column} width="max-w-6xl">
      {hasActivePlan && isUpgradeMode && (
        <button
          type="button"
          data-testid="back-to-dashboard-button"
          onClick={() => setIsUpgradeMode(false)}
          className="-mb-4 inline-flex w-fit items-center gap-2 font-mono text-sm text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back to Dashboard
        </button>
      )}

      <PageHeading
        variant="cool"
        eyebrow="Plans & Billing"
        title={
          showPricingMatrix ? (
            <>
              Own the night.{' '}
              <GradientText variant="warm">Grow your venue.</GradientText>
            </>
          ) : (
            <>
              Your subscription is{' '}
              <GradientText variant="cool">live.</GradientText>
            </>
          )
        }
        description={
          showPricingMatrix
            ? 'Pick the plan that matches your ambition. Upgrade or cancel anytime — billing is handled securely by Paystack.'
            : 'Manage your plan below. Upgrades take effect immediately after checkout.'
        }
      />

      {checkoutState === 'success' && (
        <div
          className={`${PANEL} flex items-start gap-3 border-brand-green/40 font-mono text-sm text-brand-green`}
        >
          <SparklesIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            Subscription activated — welcome to the night shift. Your new plan
            will be reflected on your account shortly.
          </span>
        </div>
      )}
      {checkoutState === 'cancelled' && (
        <p className={`${PANEL} font-mono text-sm text-white/70`}>
          Checkout cancelled — no charge was made.
        </p>
      )}

      {!activeVenue && (
        <p
          data-testid="no-venue-notice"
          className={`${PANEL} font-mono text-sm text-white/70`}
        >
          Create your venue card first — your plan activates and publishes it
          the moment payment clears.{' '}
          <Link
            to="/venue/create"
            className="font-bold text-brand-orange hover:underline"
          >
            Create your venue
          </Link>
        </p>
      )}

      {showPricingMatrix ? (
        <PricingMatrix
          venue={activeVenue}
          currentTier={hasActivePlan ? currentTier : null}
        />
      ) : (
        <ActiveSubscriptionView
          tier={currentTier}
          onUpgrade={() => setIsUpgradeMode(true)}
        />
      )}
    </PageShell>
  );
}

export default PricingDashboard;
