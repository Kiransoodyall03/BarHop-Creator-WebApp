import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { hasTierAccess, TIER_LABELS } from '../hooks/useSubscription';

// Psychological upsell wrapper: locked features stay visible (FOMO /
// preview effect) but can't be used. Reads the active venue's tier from
// the DashboardLayout outlet context.
//
// variant="overlay" (default): children blurred + inert behind a
//   centered padlock card with an Upgrade Now CTA.
// variant="compact": children fully visible with working hover states,
//   but clicks are captured; a lock chip + slim upgrade line show why.
function FeatureLocked({
  children,
  requiredTier,
  featureName,
  description,
  variant = 'overlay',
}) {
  const { activeVenue } = useOutletContext() || {};
  const currentTier = activeVenue && activeVenue.subscriptionTier;

  if (hasTierAccess(currentTier, requiredTier)) {
    return children;
  }

  const tierKey =
    typeof requiredTier === 'string' ? requiredTier.toLowerCase() : '';
  const tierLabel = TIER_LABELS[tierKey] || requiredTier;
  const roiText =
    description ||
    `Upgrade to ${tierLabel} to unlock ${featureName} and turn foot traffic into revenue.`;

  if (variant === 'compact') {
    return (
      <div data-testid="feature-locked-compact" className="relative">
        <span className="absolute -top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-surface-overlay px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
          <LockClosedIcon className="h-3 w-3" />
          {tierLabel} feature
        </span>
        {/* Clicks are captured so options stay hoverable but never select. */}
        <div
          onClickCapture={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {children}
        </div>
        <p className="mt-3 text-xs text-content-faint">
          Unlock {featureName} —{' '}
          <Link
            to="/plans"
            data-testid="feature-locked-upgrade"
            className="font-semibold text-primary hover:underline"
          >
            Upgrade Now
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* inert kills focus/tab; pointer-events-none + the z-10 overlay
          make the blurred content unreachable by mouse. */}
      <div
        data-testid="feature-locked-content"
        aria-hidden="true"
        inert
        className="pointer-events-none select-none opacity-40 blur-[8px]"
      >
        {children}
      </div>

      <div
        data-testid="feature-locked-overlay"
        className="absolute inset-0 z-10 flex items-center justify-center bg-surface/40 p-6"
      >
        <div className="w-full max-w-md rounded-2xl border border-primary/30 bg-surface-overlay/95 p-8 text-center shadow-glow-primary">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <LockClosedIcon className="h-6 w-6 text-primary" />
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold text-content">
            Unlock {featureName}
          </h2>
          <p className="mt-2 text-sm text-content-muted">{roiText}</p>
          <Link
            to="/plans"
            data-testid="feature-locked-upgrade"
            className="mt-6 inline-block rounded-lg bg-primary px-8 py-3 font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover hover:shadow-glow-primary"
          >
            Upgrade Now
          </Link>
          <p className="mt-4 text-xs uppercase tracking-wider text-content-faint">
            Included in the {tierLabel} plan
          </p>
        </div>
      </div>
    </div>
  );
}

export default FeatureLocked;
