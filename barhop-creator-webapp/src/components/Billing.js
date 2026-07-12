import React, { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import PricingMatrix from './PricingMatrix';
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

const chipBase =
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider';

const SUBSCRIPTION_STATUS_BADGES = {
  active: {
    label: 'Active',
    className: `${chipBase} border-emerald-500/30 bg-emerald-500/10 text-emerald-400`,
  },
  'non-renewing': {
    label: 'Cancelled — active until period end',
    className: `${chipBase} border-accent/30 bg-accent/10 text-accent`,
  },
  attention: {
    label: 'Payment issue — update your card',
    className: `${chipBase} border-red-400/40 bg-red-400/10 text-red-300`,
  },
};

const TX_STATUS_CLASSES = {
  success: 'bg-emerald-500/15 text-emerald-400',
  failed: 'bg-red-400/15 text-red-300',
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
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-card p-8">
        <h3 className="text-xl font-semibold text-white">
          Cancel your subscription?
        </h3>
        <p className="mt-3 text-sm text-gray-400">
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
            className="rounded-lg border border-white/15 px-5 py-2.5 font-semibold text-gray-200 transition hover:border-accent/60 hover:text-accent"
          >
            Keep Subscription
          </button>
          <button
            type="button"
            data-testid="cancel-modal-confirm"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-500/90 px-5 py-2.5 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="mt-6 border-t border-white/10 pt-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Status
          </p>
          <p className="mt-2">
            <span data-testid="subscription-status" className={badge.className}>
              {badge.label}
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {isNonRenewing ? 'Access Until' : 'Next Payment'}
          </p>
          <p
            data-testid="subscription-next-payment"
            className="mt-2 text-sm text-gray-200"
          >
            {formatDate(subscription.nextPaymentDate)}
            {!isNonRenewing && (
              <span className="text-gray-500">
                {' '}
                ·{' '}
                {formatAmount(subscription.amountCents, subscription.currency)}
                {subscription.interval === 'annually' ? '/yr' : '/mo'}
              </span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Payment Method
          </p>
          <p data-testid="card-on-file" className="mt-2 text-sm text-gray-200">
            {card
              ? `${card.brand} •••• ${card.last4} · exp ${card.expMonth}/${card.expYear}`
              : 'No card on file'}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          data-testid="update-card-button"
          onClick={onUpdateCard}
          disabled={portalBusy !== null}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-accent-dim hover:shadow-glow-amber disabled:cursor-not-allowed disabled:opacity-50"
        >
          {portalBusy === 'link' ? 'Opening…' : 'Update Payment Card'}
        </button>
        {!isNonRenewing && (
          <button
            type="button"
            data-testid="cancel-subscription-button"
            onClick={onRequestCancel}
            disabled={portalBusy !== null}
            className="rounded-lg border border-red-400/40 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:border-red-400 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel Subscription
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Card updates open Paystack&apos;s secure hosted page — BarHop never sees
        or stores your card number.
      </p>
    </div>
  );
}

function BillingHistory({ transactions }) {
  return (
    <section
      data-testid="billing-history"
      className="rounded-2xl border border-white/10 bg-surface-card/80 p-8 backdrop-blur"
    >
      <h3 className="text-lg font-semibold text-white">Billing History</h3>
      {transactions.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          No charges yet — your payments will appear here.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {transactions.map((tx) => (
            <li
              key={tx.reference}
              data-testid={`billing-tx-${tx.reference}`}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 py-3 text-sm last:border-b-0"
            >
              <div className="flex min-w-0 flex-col">
                <span className="font-medium text-gray-200">
                  {tx.description}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(tx.paidAt)} · Ref {tx.reference}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-gray-200">
                  {formatAmount(tx.amountCents, tx.currency)}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    TX_STATUS_CLASSES[tx.status] || 'bg-white/10 text-gray-300'
                  }`}
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
      <section
        data-testid="billing-current-plan"
        className="rounded-2xl border border-white/10 bg-surface-card/80 p-8 backdrop-blur"
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Current Plan
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-semibold text-white">
                {plan ? `${plan.name} Plan` : 'Free Trial'}
              </h3>
              {plan ? (
                <span
                  data-testid="billing-active-badge"
                  className={`${chipBase} border-emerald-500/30 bg-emerald-500/10 text-emerald-400`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              ) : (
                <span
                  className={`${chipBase} border-accent/30 bg-accent/10 text-accent`}
                >
                  Not Subscribed
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-400">
              {plan
                ? plan.tagline
                : 'Pick a plan below to publish your venue card and unlock the platform.'}
            </p>
          </div>

          <a
            data-testid="manage-billing-link"
            href={supportHref}
            className="rounded-lg border border-white/15 px-5 py-2.5 text-center text-sm font-semibold text-gray-200 transition hover:border-accent/60 hover:text-accent"
          >
            Email Billing Support
          </a>
        </div>

        {plan && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Unlocked with your plan
            </h4>
            <ul className="mt-3 grid gap-2.5 text-sm text-gray-300 sm:grid-cols-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="text-emerald-400">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasBillingProfile && loadingOverview && (
          <div
            data-testid="subscription-loading"
            className="mt-6 flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-gray-500"
          >
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
            Loading your subscription…
          </div>
        )}

        {hasBillingProfile && !loadingOverview && overviewFailed && (
          <div className="mt-6 border-t border-white/10 pt-6 text-sm text-gray-400">
            Couldn&apos;t load your subscription details.{' '}
            <button
              type="button"
              data-testid="billing-retry"
              onClick={fetchOverview}
              className="font-semibold text-accent hover:underline"
            >
              Retry
            </button>
          </div>
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
            <p className="mt-6 border-t border-white/10 pt-6 text-sm text-gray-500">
              We couldn&apos;t find a manageable subscription for your account —{' '}
              <a href={supportHref} className="text-accent hover:underline">
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
        <h3 className="mb-2 text-lg font-semibold text-white">
          {hasActivePlan ? 'Change Plan' : 'Choose Your Plan'}
        </h3>
        {!activeVenue && (
          <p className="mb-6 text-sm text-gray-400">
            <Link to="/venue/create" className="text-accent hover:underline">
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
