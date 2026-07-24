import React, { useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import BusinessProfile from '../components/BusinessProfile';
import Billing from '../components/Billing';
import {
  Chip,
  PageHeading,
  PageShell,
  PANEL,
  PanelTitle,
  RING_SETS,
  WELL,
  brandButton,
} from '../components/ui/Brand';
import { PLATFORM_LEGAL, SUPPORT_EMAIL } from '../data/platform';

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'business', label: 'Business Profile' },
  { key: 'billing', label: 'Billing & Subscriptions' },
  { key: 'legal', label: 'Legal & Compliance' },
];

const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/10 py-3 last:border-b-0">
      <span className="font-mono text-xs font-bold uppercase tracking-wider text-white/50">
        {label}
      </span>
      <span className="font-mono text-sm text-white/85">{value}</span>
    </div>
  );
};

function GeneralTab({ currentUser }) {
  return (
    <div className="flex flex-col gap-6">
      <section className={PANEL} data-testid="account-card">
        <PanelTitle title="Account" />
        <div className="mt-4">
          <InfoRow label="Name" value={currentUser?.displayName} />
          <InfoRow label="Email" value={currentUser?.email} />
          <InfoRow label="Sign-in Method" value={currentUser?.provider} />
          <InfoRow label="Role" value={currentUser?.businessRole} />
        </div>
      </section>

      {/* The Appearance / theme card was removed when the last
          token-driven surfaces (Login and Register) moved to the fixed
          brand palette — every page now renders one way, so the control
          had nothing left to switch. */}

      {/* Ownership is verified during registration via Paystack, so this
          card is purely informational. */}
      <section className={PANEL} data-testid="verification-verified">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="h-6 w-6 shrink-0 text-brand-green" />
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Business Verified
              </h2>
              <p className="mt-1 font-mono text-sm text-white/60">
                Your business banking details were confirmed through Paystack
                when you registered. You can publish your venue and receive
                payouts.
              </p>
            </div>
          </div>
          <Chip tone="success" className="shrink-0">
            Verified
          </Chip>
        </div>
      </section>
    </div>
  );
}

function LegalComplianceTab({ profile, venue, onEditProfile }) {
  const venueCategories =
    venue && venue.categories && venue.categories.length > 0
      ? venue.categories
      : venue && venue.category
        ? [venue.category]
        : [];
  const isAdultVenue = venueCategories.includes('adult entertainment');
  const ficaVerified = Boolean(profile?.ficaVerified);
  const officerName = profile?.informationOfficerName;

  const deletionRequestHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    '[POPIA] Data Subject Deletion Request'
  )}&body=${encodeURIComponent(
    'Please permanently delete the personal data held for this account. ' +
      `Trading name: ${profile?.tradingName || 'N/A'}. ` +
      'I understand this action is irreversible once processed.'
  )}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Section A — ECTA */}
      <section className={PANEL} data-testid="ecta-card">
        <PanelTitle
          title="ECTA Section 43 Disclosures"
          subtitle="Statutory e-commerce disclosures for the BarHop platform under the Electronic Communications and Transactions Act. Keeping these accurate and visible protects both parties from the statutory 14-day cancellation penalty."
        />
        <div className="mt-4">
          <InfoRow
            label="Service Provider"
            value={PLATFORM_LEGAL.providerName}
          />
          <InfoRow
            label="Registration Number"
            value={PLATFORM_LEGAL.cipcRegistrationNumber}
          />
          <InfoRow
            label="Physical Address"
            value={PLATFORM_LEGAL.physicalAddress}
          />
          <InfoRow label="Contact Email" value={PLATFORM_LEGAL.contactEmail} />
          <InfoRow
            label="Dispute Resolution"
            value={PLATFORM_LEGAL.disputeResolution}
          />
        </div>
      </section>

      {/* Section B — POPIA / PAIA */}
      <section className={PANEL} data-testid="popia-card">
        <PanelTitle title="Privacy & Data Protection (POPIA / PAIA)" />
        {officerName ? (
          <div className="mt-4">
            <InfoRow
              label="Registered Information Officer"
              value={officerName}
            />
            <InfoRow label="Email" value={profile?.informationOfficerEmail} />
            <InfoRow label="Phone" value={profile?.informationOfficerPhone} />
          </div>
        ) : (
          <p
            className="mt-4 font-mono text-sm text-white/60"
            data-testid="popia-missing"
          >
            No Information Officer registered yet — POPIA requires one to handle
            data subject requests.{' '}
            <button
              type="button"
              onClick={onEditProfile}
              className="font-bold text-brand-orange hover:underline"
            >
              Add one in your Business Profile
            </button>
            .
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={PLATFORM_LEGAL.paiaManualUrl}
            target="_blank"
            rel="noreferrer"
            data-testid="paia-manual-link"
            className={brandButton('outline', 'sm')}
          >
            Download Platform PAIA Manual
          </a>
          <a
            href={deletionRequestHref}
            data-testid="popia-deletion-link"
            className={brandButton('outline', 'sm')}
          >
            Execute Data Subject Deletion Request
          </a>
        </div>
      </section>

      {/* Section C — Industry regulations */}
      <section className={PANEL} data-testid="arb-card">
        <PanelTitle title="Advertising & Content Guidelines" />
        <div
          className={`${WELL} mt-4 flex items-start gap-3 border-brand-orange/40`}
        >
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-brand-orange" />
          <p className="font-mono text-sm text-white/70">
            <span className="font-bold text-white">
              ARB Alcohol Advertising Code:
            </span>{' '}
            all custom media promoting alcohol must carry the responsible
            drinking message (&quot;Not for Persons Under the Age of 18&quot;)
            at a minimum of <span className="font-bold text-white">15%</span> of
            the advertisement&apos;s height. BarHop overlays this automatically
            on uploaded media, but externally produced creative remains your
            responsibility.
          </p>
        </div>

        {isAdultVenue && (
          <div
            data-testid="fpb-warning"
            className={`${WELL} mt-4 flex items-start gap-3 border-brand-pink/50`}
          >
            <ShieldExclamationIcon className="h-5 w-5 shrink-0 text-brand-pink" />
            <div className="font-mono text-sm text-white/70">
              <Chip tone="danger">FPB X18 Verification Required</Chip>
              <p className="mt-2">
                Your venue is categorised as Adult Entertainment. The Film and
                Publication Board requires a commercial online distributor
                licence before X18-classified promotional media may be
                displayed. Upload your licence via{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                    '[FPB] X18 Distributor Licence Submission'
                  )}`}
                  className="font-bold text-brand-pink underline"
                >
                  our compliance desk
                </a>{' '}
                — until verified, video uploads for this venue stay restricted
                to prevent illegal online distribution liability.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Section D — FICA */}
      <section className={PANEL} data-testid="fica-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {ficaVerified ? (
              <ShieldCheckIcon className="h-6 w-6 shrink-0 text-brand-green" />
            ) : (
              <ShieldExclamationIcon className="h-6 w-6 shrink-0 text-brand-orange" />
            )}
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Account Verification (FICA)
              </h2>
              <p className="mt-1 font-mono text-sm text-white/60">
                {ficaVerified
                  ? 'Your identity and address documents are verified. Payouts and financial features are fully enabled.'
                  : 'ID and proof-of-address verification is pending. FICA verification is required before staff payouts and split payments can be enabled.'}
              </p>
            </div>
          </div>
          {ficaVerified ? (
            <Chip
              tone="success"
              className="shrink-0"
              data-testid="fica-badge-verified"
            >
              Verified
            </Chip>
          ) : (
            <Chip
              tone="warn"
              className="shrink-0 text-right"
              data-testid="fica-badge-pending"
            >
              Verification Pending — Action Required for Payouts
            </Chip>
          )}
        </div>
      </section>
    </div>
  );
}

function Settings() {
  const [searchParams] = useSearchParams();
  const initialTab = TABS.some((t) => t.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'general';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { currentUser } = useAuth();
  const { activeVenue } = useOutletContext() || {};

  const profile = currentUser?.businessProfile;

  return (
    <PageShell rings={RING_SETS.panel} width="max-w-[1400px]">
      <PageHeading
        eyebrow="Account"
        title="Settings & Compliance"
        description="Your compliance and verification hub — statutory disclosures (ECTA), privacy obligations (POPIA/PAIA), advertising rules (ARB/FPB), and FICA verification in one place."
      />

      <div className="flex gap-8 max-md:flex-col">
        <aside className="w-64 shrink-0 max-md:w-full">
          <ul className="m-0 flex list-none flex-col gap-1 p-0 max-md:flex-row max-md:flex-wrap">
            {TABS.map((tab) => (
              <li key={tab.key}>
                <button
                  type="button"
                  data-testid={`settings-tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full whitespace-nowrap rounded-lg px-4 py-3 text-left font-mono text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink ${
                    activeTab === tab.key
                      ? 'bg-white/10 font-bold text-white'
                      : 'text-white/55 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="min-w-0 max-w-4xl flex-1">
          {activeTab === 'general' && <GeneralTab currentUser={currentUser} />}
          {activeTab === 'business' && <BusinessProfile />}
          {activeTab === 'billing' && <Billing />}
          {activeTab === 'legal' && (
            <LegalComplianceTab
              profile={profile}
              venue={activeVenue}
              onEditProfile={() => setActiveTab('business')}
            />
          )}
        </section>
      </div>
    </PageShell>
  );
}

export default Settings;
