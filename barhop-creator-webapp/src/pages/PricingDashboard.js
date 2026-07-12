import React, { useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import PricingMatrix from '../components/PricingMatrix';
import { TIER_ORDER } from '../hooks/useSubscription';
import { PLANS } from '../data/plans';

function ActiveSubscriptionView({ tier, onUpgrade }) {
  const plan = PLANS.find((p) => p.key === tier);
  if (!plan) return null;
  const isTopTier = tier === TIER_ORDER[TIER_ORDER.length - 1];

  return (
    <section
      data-testid="active-subscription-view"
      className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-surface-card p-8 lg:p-10"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold text-white">{plan.name} Plan</h2>
        <span
          data-testid="active-badge"
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Active
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-400">{plan.tagline}</p>

      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Unlocked with your plan
        </h3>
        <ul className="mt-4 grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="text-emerald-400">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row">
        <button
          type="button"
          data-testid="upgrade-plan-button"
          onClick={onUpgrade}
          className="rounded-lg bg-accent px-6 py-3 font-semibold text-black transition hover:bg-accent-dim hover:shadow-glow-amber"
        >
          {isTopTier ? 'View All Plans' : 'Upgrade Plan'}
        </button>
        <Link
          data-testid="manage-billing-button"
          to="/settings?tab=billing"
          className="rounded-lg border border-white/15 px-6 py-3 text-center font-semibold text-gray-200 transition hover:border-accent/60 hover:text-accent"
        >
          Manage Billing
        </Link>
      </div>
      <p className="mt-4 text-xs text-gray-500">
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
    <main className="relative min-h-screen flex-1 overflow-hidden bg-surface-deep px-6 py-12 text-gray-100 lg:px-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-neon-violet/10 via-accent/5 to-transparent" />

      <div className="relative mx-auto max-w-6xl">
        {hasActivePlan && isUpgradeMode && (
          <button
            type="button"
            data-testid="back-to-dashboard-button"
            onClick={() => setIsUpgradeMode(false)}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-400 transition hover:text-accent"
          >
            ← Back to Dashboard
          </button>
        )}

        <header className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Plans &amp; Billing
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
            {showPricingMatrix ? (
              <>
                Own the night.{' '}
                <span className="bg-gradient-to-r from-accent to-neon-violet bg-clip-text text-transparent">
                  Grow your venue.
                </span>
              </>
            ) : (
              <>
                Your subscription is{' '}
                <span className="bg-gradient-to-r from-accent to-neon-violet bg-clip-text text-transparent">
                  live.
                </span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            {showPricingMatrix
              ? 'Pick the plan that matches your ambition. Upgrade or cancel anytime — billing is handled securely by Paystack.'
              : 'Manage your plan below. Upgrades take effect immediately after checkout.'}
          </p>
        </header>

        {checkoutState === 'success' && (
          <div className="mb-10 rounded-xl border border-accent/40 bg-accent/10 px-5 py-4 text-sm text-accent">
            🎉 Subscription activated — welcome to the night shift. Your new
            plan will be reflected on your account shortly.
          </div>
        )}
        {checkoutState === 'cancelled' && (
          <div className="mb-10 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-gray-300">
            Checkout cancelled — no charge was made.
          </div>
        )}

        {!activeVenue && (
          <div
            data-testid="no-venue-notice"
            className="mb-10 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-gray-300"
          >
            Create your venue card first — your plan activates and publishes it
            the moment payment clears.{' '}
            <Link to="/venue/create" className="text-accent hover:underline">
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
