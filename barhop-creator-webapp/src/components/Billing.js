import React, { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { CheckIcon } from '@heroicons/react/24/outline';
import PricingMatrix from './PricingMatrix';
import {
  BrandSpinner,
  Chip,
  chipClasses,
  PANEL,
  PanelTitle,
  SegmentedRule,
  brandButton,
} from './ui/Brand';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { TIER_ORDER } from '../hooks/useSubscription';
import { PLANS } from '../data/plans';
import { SUPPORT_EMAIL } from '../data/platform';
import {
  cancelSubscription,
  getBillingOverview,
  getSubscriptionManageLink,
} from '../firebase/subscriptionService';

const SUBSCRIPTION_STATUS_BADGES = {
  active: { label: 'Active', tone: 'success' },
  'non-renewing': {
    label: 'Cancelled — active until period end',
    tone: 'warn',
  },
  attention: { label: 'Payment issue — update your card', tone: 'danger' },
};

const TX_STATUS_TONES = {
  success: 'success',
  failed: 'danger',
};

const formatAmount = (amountCents, currency = 'ZAR') => {
  const whole = Math.round((amountCents || 0) / 100);
  const prefix = currency === 'ZAR' || !currency ? 'R' : `${currency} `;
  return `${prefix}${whole.toLocaleString('en-US')}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const fieldLabel =
  'font-mono text-xs font-bold uppercase tracking-wider text-white/50';

// Escape hatch for anything the self-serve portal can't do yet
// (downgrades, refunds, disputes). Pre-filled with full account context
// to keep tickets actionable within ECTA dispute timelines.
function buildSupportHref({ user, venue, tier }) {
  const tradingName =
    user?.businessProfile?.tradingName || venue?.name || 'BarHop Venue';
  const subject = `[Billing Request] Action Required - ${tradingName}`;
  const body =
    `User ID: ${user?.uid || 'N/A'} | ` +
    `Venue ID: ${venue?.id || 'N/A'} | ` +
    `Current Plan: ${tier || 'trial'} | ` +
    `Customer Code: ${user?.paystackCustomerCode || 'N/A'}. ` +
    'Please describe your request (e.g., Update Credit Card, Cancel ' +
    'Subscription, Request Past Invoice): ';
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

function CancelModal({ busy, onKeep, onConfirm }) {
  return (
    <div
      data-testid="cancel-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-brand-ink p-8 shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
        <h3 className="font-display text-xl font-bold text-white">
          Cancel your subscription?
        </h3>
        <p className="mt-3 font-mono text-sm text-white/70">
          Auto-renewal stops immediately and you won&apos;t be charged again.
          You keep full access until the end of the period you&apos;ve already
          paid for — after that your venue drops to the free trial tier and
          premium features lock.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            data-testid="cancel-modal-keep"
            onClick={onKeep}
            className={brandButton('outline')}
          >
            Keep Subscription
          </button>
          <button
            type="button"
            data-testid="cancel-modal-confirm"
            onClick={onConfirm}
            disabled={busy}
            className={brandButton('danger')}
          >
            {busy ? 'Cancelling…' : 'Cancel Subscription'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubscriptionDetails({
  subscription,
  portalBusy,
  onUpdateCard,
  onRequestCancel,
}) {
  const badge =
    SUBSCRIPTION_STATUS_BADGES[subscription.status] ||
    SUBSCRIPTION_STATUS_BADGES.active;
  const isNonRenewing = subscription.status === 'non-renewing';
  const card = subscription.card;

  return (
    <div className="mt-6 flex flex-col gap-6">
      <SegmentedRule variant="cool" />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className={fieldLabel}>Status</p>
          <p className="mt-2">
            <span
              data-testid="subscription-status"
              className={chipClasses(badge.tone)}
            >
              {badge.label}
            </span>
          </p>
        </div>
        <div>
          <p className={fieldLabel}>
            {isNonRenewing ? 'Access Until' : 'Next Payment'}
          </p>
          <p
            data-testid="subscription-next-payment"
            className="mt-2 font-mono text-sm text-white/85"
          >
            {formatDate(subscription.nextPaymentDate)}
            {!isNonRenewing && (
              <span className="text-white/50">
                {' '}
                ·{' '}
                {formatAmount(subscription.amountCents, subscription.currency)}
                {subscription.interval === 'annually' ? '/yr' : '/mo'}
              </span>
            )}
          </p>
        </div>
        <div>
          <p className={fieldLabel}>Payment Method</p>
          <p
            data-testid="card-on-file"
            className="mt-2 font-mono text-sm text-white/85"
          >
            {card
              ? `${card.brand} •••• ${card.last4} · exp ${card.expMonth}/${card.expYear}`
              : 'No card on file'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          data-testid="update-card-button"
          onClick={onUpdateCard}
          disabled={portalBusy !== null}
          className={brandButton('primary', 'sm')}
        >
          {portalBusy === 'link' ? 'Opening…' : 'Update Payment Card'}
        </button>
        {!isNonRenewing && (
          <button
            type="button"
            data-testid="cancel-subscription-button"
            onClick={onRequestCancel}
            disabled={portalBusy !== null}
            className={brandButton('danger', 'sm')}
          >
            Cancel Subscription
          </button>
        )}
      </div>
      <p className="-mt-3 font-mono text-xs text-white/50">
        Card updates open Paystack&apos;s secure hosted page — BarHop never sees
        or stores your card number.
      </p>
    </div>
  );
}

function BillingHistory({ transactions }) {
  return (
    <section className={PANEL} data-testid="billing-history">
      <PanelTitle title="Billing History" />
      {transactions.length === 0 ? (
        <p className="mt-4 font-mono text-sm text-white/50">
          No charges yet — your payments will appear here.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {transactions.map((tx) => (
            <li
              key={tx.reference}
              data-testid={`billing-tx-${tx.reference}`}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 py-3 font-mono text-sm last:border-b-0"
            >
              <div className="flex min-w-0 flex-col">
                <span className="font-bold text-white">{tx.description}</span>
                <span className="text-xs text-white/50">
                  {formatDate(tx.paidAt)} · Ref {tx.reference}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-white/85">
                  {formatAmount(tx.amountCents, tx.currency)}
                </span>
                <span
                  className={chipClasses(
                    TX_STATUS_TONES[tx.status] || 'neutral',
                    'capitalize'
                  )}
                >
                  {tx.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Billing() {
  const { currentUser } = useAuth();
  const { activeVenue } = useOutletContext() || {};
  const { showError, showSuccess } = useError();

  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewFailed, setOverviewFailed] = useState(false);
  const [portalBusy, setPortalBusy] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const currentTier = activeVenue && activeVenue.subscriptionTier;
  const hasActivePlan = TIER_ORDER.includes(currentTier);
  const plan = hasActivePlan ? PLANS.find((p) => p.key === currentTier) : null;
  // The webhook stores the customer code on first payment; without one
  // there is nothing to look up on Paystack.
  const hasBillingProfile = Boolean(
    currentUser && currentUser.paystackCustomerCode
  );

  const fetchOverview = useCallback(async () => {
    if (!hasBillingProfile) return;
    try {
      setLoadingOverview(true);
      setOverviewFailed(false);
      const data = await getBillingOverview();
      setOverview(data);
    } catch (error) {
      console.error('Error loading billing overview:', error);
      setOverviewFailed(true);
    } finally {
      setLoadingOverview(false);
    }
  }, [hasBillingProfile]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOverview();
  }, [fetchOverview]);

  const handleUpdateCard = async () => {
    setPortalBusy('link');
    try {
      const { link } = await getSubscriptionManageLink();
      window.open(link, '_blank', 'noopener');
    } catch (error) {
      showError(
        error.message || 'Could not open the card update page. Try again.'
      );
    } finally {
      setPortalBusy(null);
    }
  };

  const handleConfirmCancel = async () => {
    setPortalBusy('cancel');
    try {
      await cancelSubscription();
      setShowCancelModal(false);
      showSuccess(
        'Auto-renewal cancelled — you keep access until the end of your paid period.'
      );
      await fetchOverview();
    } catch (error) {
      showError(
        error.message || 'Could not cancel the subscription. Try again.'
      );
    } finally {
      setPortalBusy(null);
    }
  };

  const supportHref = buildSupportHref({
    user: currentUser,
    venue: activeVenue,
    tier: currentTier,
  });

  const subscription = overview && overview.subscription;

  return (
    <div className="flex flex-col gap-8">
      <section className={PANEL} data-testid="billing-current-plan">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/50">
              Current Plan
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold text-white">
                {plan ? `${plan.name} Plan` : 'Free Trial'}
              </h2>
              {plan ? (
                <Chip tone="success" data-testid="billing-active-badge">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                  Active
                </Chip>
              ) : (
                <Chip tone="warn">Not Subscribed</Chip>
              )}
            </div>
            <p className="mt-1 font-mono text-sm text-white/60">
              {plan
                ? plan.tagline
                : 'Pick a plan below to publish your venue card and unlock the platform.'}
            </p>
          </div>

          <a
            data-testid="manage-billing-link"
            href={supportHref}
            className={brandButton('outline', 'sm')}
          >
            Email Billing Support
          </a>
        </div>

        {plan && (
          <div className="mt-6 flex flex-col gap-5">
            <SegmentedRule variant="cool" />
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                Unlocked with your plan
              </h3>
              <ul className="mt-3 grid gap-2.5 font-mono text-sm text-white/70 sm:grid-cols-2">
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
          </div>
        )}

        {hasBillingProfile && loadingOverview && (
          <div
            data-testid="subscription-loading"
            className="mt-6 flex items-center gap-3 font-mono text-sm text-white/50"
          >
            <BrandSpinner className="h-5 w-5" />
            Loading your subscription…
          </div>
        )}

        {hasBillingProfile && !loadingOverview && overviewFailed && (
          <p className="mt-6 font-mono text-sm text-white/70">
            Couldn&apos;t load your subscription details.{' '}
            <button
              type="button"
              data-testid="billing-retry"
              onClick={fetchOverview}
              className="font-bold text-brand-orange hover:underline"
            >
              Retry
            </button>
          </p>
        )}

        {!loadingOverview && subscription && (
          <SubscriptionDetails
            subscription={subscription}
            portalBusy={portalBusy}
            onUpdateCard={handleUpdateCard}
            onRequestCancel={() => setShowCancelModal(true)}
          />
        )}

        {hasBillingProfile &&
          !loadingOverview &&
          !overviewFailed &&
          overview &&
          !subscription &&
          hasActivePlan && (
            <p className="mt-6 font-mono text-sm text-white/50">
              We couldn&apos;t find a manageable subscription for your account —{' '}
              <a
                href={supportHref}
                className="font-bold text-brand-orange hover:underline"
              >
                email billing support
              </a>{' '}
              and we&apos;ll sort it out.
            </p>
          )}
      </section>

      {overview &&
        overview.transactions &&
        overview.transactions.length > 0 && (
          <BillingHistory transactions={overview.transactions} />
        )}

      <section>
        <h2 className="mb-2 font-display text-xl font-bold text-white">
          {hasActivePlan ? 'Change Plan' : 'Choose Your Plan'}
        </h2>
        {!activeVenue && (
          <p className="mb-6 font-mono text-sm text-white/60">
            <Link
              to="/venue/create"
              className="font-bold text-brand-orange hover:underline"
            >
              Create your venue card
            </Link>{' '}
            first — your plan activates and publishes it the moment payment
            clears.
          </p>
        )}
        <PricingMatrix
          venue={activeVenue}
          currentTier={hasActivePlan ? currentTier : null}
        />
      </section>

      {showCancelModal && (
        <CancelModal
          busy={portalBusy === 'cancel'}
          onKeep={() => setShowCancelModal(false)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  );
}

export default Billing;
