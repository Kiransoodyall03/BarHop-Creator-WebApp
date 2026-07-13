import React, { useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import PricingMatrix from '../components/PricingMatrix';
import { buttonClasses } from '../components/ui/Button';
import { TIER_ORDER } from '../hooks/useSubscription';
import { PLANS } from '../data/plans';

function ActiveSubscriptionView({ tier, onUpgrade }) {
  const plan = PLANS.find((p) => p.key === tier);
  if (!plan) return null;
  const isTopTier = tier === TIER_ORDER[TIER_ORDER.length - 1];

  return (
    <section
      data-testid="active-subscription-view"
      className="mx-auto max-w-3xl rounded-2xl border border-edge bg-surface-raised p-8 shadow-card lg:p-10"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-semibold text-content">
          {plan.name} Plan
        </h2>
        <span
          data-testid="active-badge"
          className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-success"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Active
        </span>
      </div>
      <p className="mt-1 text-sm text-content-muted">{plan.tagline}</p>

      <div className="mt-8 border-t border-edge pt-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-content-faint">
          Unlocked with your plan
        </h3>
        <ul className="mt-4 grid gap-3 text-sm text-content-muted sm:grid-cols-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckIcon
                className="mt-0.5 h-4 w-4 shrink-0 text-success"
                aria-hidden="true"
              />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-edge pt-6 sm:flex-row">
        <button
          type="button"
          data-testid="upgrade-plan-button"
          onClick={onUpgrade}
          className={buttonClasses('primary', 'lg')}
        >
          {isTopTier ? 'View All Plans' : 'Upgrade Plan'}
        </button>
        <Link
          data-testid="manage-billing-button"
          to="/settings?tab=billing"
          className={buttonClasses('secondary', 'lg')}
        >
          Manage Billing
        </Link>
      </div>
      <p className="mt-4 text-xs text-content-faint">
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
    <main className="relative min-h-screen flex-1 overflow-hidden bg-surface px-6 py-12 lg:px-12">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-80" />

      <div className="relative mx-auto max-w-6xl">
        {hasActivePlan && isUpgradeMode && (
          <button
            type="button"
            data-testid="back-to-dashboard-button"
            onClick={() => setIsUpgradeMode(false)}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-content-muted transition-colors hover:text-primary"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Back to Dashboard
          </button>
        )}

        <header className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Plans &amp; Billing
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-content">
            {showPricingMatrix ? (
              <>
                Own the night.{' '}
                <span className="text-gradient-sunset">Grow your venue.</span>
              </>
            ) : (
              <>
                Your subscription is{' '}
                <span className="text-gradient-sunset">live.</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-content-muted">
            {showPricingMatrix
              ? 'Pick the plan that matches your ambition. Upgrade or cancel anytime — billing is handled securely by Paystack.'
              : 'Manage your plan below. Upgrades take effect immediately after checkout.'}
          </p>
        </header>

        {checkoutState === 'success' && (
          <div className="mb-10 flex items-start gap-3 rounded-xl border border-success/40 bg-success/10 px-5 py-4 text-sm text-success">
            <SparklesIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>
              Subscription activated — welcome to the night shift. Your new
              plan will be reflected on your account shortly.
            </span>
          </div>
        )}
        {checkoutState === 'cancelled' && (
          <div className="mb-10 rounded-xl border border-edge bg-content/5 px-5 py-4 text-sm text-content-muted">
            Checkout cancelled — no charge was made.
          </div>
        )}

        {!activeVenue && (
          <div
            data-testid="no-venue-notice"
            className="mb-10 rounded-xl border border-edge bg-content/5 px-5 py-4 text-sm text-content-muted"
          >
            Create your venue card first — your plan activates and publishes it
            the moment payment clears.{' '}
            <Link to="/venue/create" className="text-primary hover:underline">
              Create your venue
            </Link>
          </div>
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
      </div>
    </main>
  );
}

export default PricingDashboard;
