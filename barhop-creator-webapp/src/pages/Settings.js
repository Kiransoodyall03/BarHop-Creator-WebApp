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
import { PLATFORM_LEGAL, SUPPORT_EMAIL } from '../data/platform';

const cardClass =
  'rounded-2xl border border-white/10 bg-surface-card/80 p-8 backdrop-blur';
const secondaryButtonClass =
  'rounded-lg border border-white/15 px-5 py-2.5 text-center text-sm font-semibold text-gray-200 transition hover:border-accent/60 hover:text-accent';

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'business', label: 'Business Profile' },
  { key: 'billing', label: 'Billing & Subscriptions' },
  { key: 'legal', label: 'Legal & Compliance' },
];

const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/5 py-3 last:border-b-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </span>
      <span className="text-sm text-gray-200">{value}</span>
    </div>
  );
};

function GeneralTab({ currentUser }) {
  return (
    <div className="flex flex-col gap-6">
      <div className={cardClass} data-testid="account-card">
        <h3 className="mb-2 text-lg font-semibold text-white">Account</h3>
        <InfoRow label="Name" value={currentUser?.displayName} />
        <InfoRow label="Email" value={currentUser?.email} />
        <InfoRow label="Sign-in Method" value={currentUser?.provider} />
        <InfoRow label="Role" value={currentUser?.businessRole} />
      </div>

      {/* Ownership is verified during registration via Paystack, so this
          card is purely informational. */}
      <div className={cardClass} data-testid="verification-verified">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="h-6 w-6 shrink-0 text-emerald-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">
                Business Verified
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Your business banking details were confirmed through Paystack
                when you registered. You can publish your venue and receive
                payouts.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
            Verified ✔️
          </span>
        </div>
      </div>
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
      <section className={cardClass} data-testid="ecta-card">
        <h3 className="text-lg font-semibold text-white">
          ECTA Section 43 Disclosures
        </h3>
        <p className="mt-1 text-sm text-gray-400">
          Statutory e-commerce disclosures for the BarHop platform under the
          Electronic Communications and Transactions Act. Keeping these accurate
          and visible protects both parties from the statutory 14-day
          cancellation penalty.
        </p>
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
      <section className={cardClass} data-testid="popia-card">
        <h3 className="text-lg font-semibold text-white">
          Privacy &amp; Data Protection (POPIA / PAIA)
        </h3>
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
          <p className="mt-3 text-sm text-gray-400" data-testid="popia-missing">
            No Information Officer registered yet — POPIA requires one to handle
            data subject requests.{' '}
            <button
              type="button"
              onClick={onEditProfile}
              className="font-semibold text-accent hover:underline"
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
            className={secondaryButtonClass}
          >
            Download Platform PAIA Manual
          </a>
          <a
            href={deletionRequestHref}
            data-testid="popia-deletion-link"
            className={secondaryButtonClass}
          >
            Execute Data Subject Deletion Request
          </a>
        </div>
      </section>

      {/* Section C — Industry regulations */}
      <section className={cardClass} data-testid="arb-card">
        <h3 className="text-lg font-semibold text-white">
          Advertising &amp; Content Guidelines
        </h3>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-accent" />
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-white">
              ARB Alcohol Advertising Code:
            </span>{' '}
            all custom media promoting alcohol must carry the responsible
            drinking message (&quot;Not for Persons Under the Age of 18&quot;)
            at a minimum of <span className="font-semibold">15%</span> of the
            advertisement&apos;s height. BarHop overlays this automatically on
            uploaded media, but externally produced creative remains your
            responsibility.
          </p>
        </div>

        {isAdultVenue && (
          <div
            data-testid="fpb-warning"
            className="mt-4 flex items-start gap-3 rounded-xl border border-red-400/40 bg-red-400/10 p-4"
          >
            <ShieldExclamationIcon className="h-5 w-5 shrink-0 text-red-400" />
            <div className="text-sm text-gray-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-400/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-red-300">
                FPB X18 Verification Required
              </span>
              <p className="mt-2">
                Your venue is categorised as Adult Entertainment. The Film and
                Publication Board requires a commercial online distributor
                licence before X18-classified promotional media may be
                displayed. Upload your licence via{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                    '[FPB] X18 Distributor Licence Submission'
                  )}`}
                  className="font-semibold text-red-300 underline"
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
      <section className={cardClass} data-testid="fica-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {ficaVerified ? (
              <ShieldCheckIcon className="h-6 w-6 shrink-0 text-emerald-400" />
            ) : (
              <ShieldExclamationIcon className="h-6 w-6 shrink-0 text-accent" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">
                Account Verification (FICA)
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                {ficaVerified
                  ? 'Your identity and address documents are verified. Payouts and financial features are fully enabled.'
                  : 'ID and proof-of-address verification is pending. FICA verification is required before staff payouts and split payments can be enabled.'}
              </p>
            </div>
          </div>
          {ficaVerified ? (
            <span
              data-testid="fica-badge-verified"
              className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400"
            >
              Verified
            </span>
          ) : (
            <span
              data-testid="fica-badge-pending"
              className="shrink-0 rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent"
            >
              Verification Pending — Action Required for Payouts
            </span>
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
    <main className="min-h-screen flex-1 bg-surface-deep px-12 py-10 text-gray-100 max-md:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Settings &amp; Compliance
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Your compliance and verification hub — statutory disclosures (ECTA),
          privacy obligations (POPIA/PAIA), advertising rules (ARB/FPB), and
          FICA verification in one place.
        </p>
      </header>

      <div className="flex gap-8 max-md:flex-col">
        <aside className="w-64 shrink-0 border-r border-white/10 pr-4 max-md:w-full max-md:border-r-0 max-md:pr-0">
          <ul className="m-0 list-none space-y-1 p-0">
            {TABS.map((tab) => (
              <li key={tab.key}>
                <button
                  type="button"
                  data-testid={`settings-tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full rounded-lg px-4 py-3 text-left font-semibold transition ${
                    activeTab === tab.key
                      ? 'bg-accent/10 text-accent'
                      : 'text-gray-500 hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="max-w-4xl flex-1">
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
    </main>
  );
}

export default Settings;
