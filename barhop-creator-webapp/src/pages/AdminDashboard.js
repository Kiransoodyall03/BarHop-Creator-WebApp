import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { getFirestore, collection, doc, onSnapshot } from 'firebase/firestore';
import { getAdminRevenue } from '../firebase/adminService';
import { logout } from '../firebase/authService';
import { useError } from '../context/ErrorContext';
import {
  BrandInput,
  BrandSpinner,
  chipClasses,
  PageHeading,
  PageShell,
  PANEL,
  PANEL_HOVER,
  PanelTitle,
  RING_SETS,
  SegmentedRule,
  brandButton,
} from '../components/ui/Brand';

const FOURSQUARE_FREE_CALLS = 500;
const CURRENT_MONTH = new Date().toISOString().slice(0, 7); // YYYY-MM

const fmtNum = (n) => (n ?? 0).toLocaleString();

const fmtTs = (t) => {
  if (!t) return '—';
  const d = t.toDate ? t.toDate() : new Date(t);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

const rand = (cents) =>
  `R${Math.round((cents || 0) / 100).toLocaleString('en-ZA')}`;

// --- Shared presentational pieces ---

function StatCard({ label, value, hint }) {
  return (
    <div className={`${PANEL} ${PANEL_HOVER}`}>
      <p className="font-mono text-xs font-bold uppercase tracking-wider text-white/50">
        {label}
      </p>
      <p className="mt-3 font-mono text-4xl font-bold leading-none text-white">
        {value}
      </p>
      {hint && <p className="mt-2 font-mono text-xs text-white/50">{hint}</p>}
    </div>
  );
}

function TierPill({ tier }) {
  const tones = {
    trial: 'neutral',
    starter: 'cool',
    pro: 'danger',
    enterprise: 'success',
  };
  const label = tier || 'trial';
  return (
    <span className={chipClasses(tones[label] || 'neutral', 'capitalize')}>
      {label}
    </span>
  );
}

// Table styling is shared by every directory/report table on this page.
const TH = 'pb-3 font-mono text-xs font-bold uppercase tracking-wider text-white/45';
const TR = 'border-t border-white/10';
const TD = 'py-3 pr-4 font-mono text-sm text-white/85';
const TD_MUTED = 'py-3 pr-4 font-mono text-sm text-white/55';

// --- Overview tab ---

function OverviewTab({ stats, usage, districtCache, indexUpdatedAt }) {
  const usagePct = Math.min((usage.total / FOURSQUARE_FREE_CALLS) * 100, 100);
  const over = usage.total > FOURSQUARE_FREE_CALLS;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
        <StatCard
          label="Live Venues"
          value={fmtNum(stats.live)}
          hint={`${fmtNum(stats.total)} total`}
        />
        <StatCard
          label="Subscribed"
          value={fmtNum(stats.subscribed)}
          hint="Paid tiers"
        />
        <StatCard label="Owners" value={fmtNum(stats.owners)} />
        <StatCard
          label="Active Districts"
          value={fmtNum(stats.activeDistricts)}
          hint={`${fmtNum(stats.totalDistricts)} configured`}
        />
        <StatCard
          label="Venues Linked"
          value={fmtNum(stats.withPlaceId)}
          hint="Carry a Foursquare ID"
        />
      </div>

      <div className={PANEL}>
        <PanelTitle
          title="Foursquare API Usage"
          actions={
            <span className="font-mono text-sm text-white/50">
              {CURRENT_MONTH}
            </span>
          }
        />
        <p className="mt-4 font-mono text-3xl font-bold text-white">
          {fmtNum(usage.total)}
          <span className="text-base font-normal text-white/50">
            {' '}
            / {fmtNum(FOURSQUARE_FREE_CALLS)} free calls
          </span>
        </p>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full ${
              over ? 'bg-brand-pink' : 'bg-brand-cool'
            }`}
            style={{ width: `${usagePct}%` }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 font-mono text-sm text-white/60">
          <span>Scheduled refresh: {fmtNum(usage.refresh)}</span>
          <span>Owner lookups: {fmtNum(usage.search)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={PANEL}>
          <PanelTitle title="Venues by Tier" />
          <ul className="mt-4 flex flex-col">
            {['trial', 'starter', 'pro', 'enterprise'].map((tier) => (
              <li
                key={tier}
                className="flex items-center justify-between border-b border-white/10 py-2.5 font-mono text-sm capitalize last:border-0"
              >
                <span className="text-white/60">{tier}</span>
                <span className="font-bold text-white">
                  {fmtNum(stats.byTier[tier])}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={PANEL}>
          <PanelTitle
            title="District Cache"
            actions={
              <span className="font-mono text-sm text-white/50">
                Index: {fmtTs(indexUpdatedAt)}
              </span>
            }
          />
          {districtCache.length === 0 ? (
            <p className="mt-4 font-mono text-sm text-white/50">
              No district snapshots yet — seed districts and run the refresh.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className={TH}>District</th>
                    <th className={`${TH} text-right`}>Venues</th>
                    <th className={`${TH} text-right`}>Refreshed</th>
                  </tr>
                </thead>
                <tbody>
                  {districtCache.map((d) => (
                    <tr key={d.id} className={TR}>
                      <td className={TD}>{d.name}</td>
                      <td className={`${TD_MUTED} text-right`}>
                        {fmtNum(d.venueCount)}
                      </td>
                      <td className={`${TD_MUTED} text-right`}>
                        {fmtTs(d.fetchedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Venues & Owners tab (searchable) ---

function DirectoryTab({ venues, users }) {
  const [mode, setMode] = useState('venues');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const filteredVenues = useMemo(() => {
    if (!q) return venues;
    return venues.filter((v) =>
      [v.name, v.address, v.placeId, v.ownerId, v.id].some((f) =>
        (f || '').toLowerCase().includes(q)
      )
    );
  }, [venues, q]);

  const filteredOwners = useMemo(() => {
    if (!q) return users;
    return users.filter((u) =>
      [u.email, u.displayName, u.firstName, u.lastName].some((f) =>
        (f || '').toLowerCase().includes(q)
      )
    );
  }, [users, q]);

  const rows = mode === 'venues' ? filteredVenues : filteredOwners;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-white/20 bg-white/[0.06] p-1">
          {['venues', 'owners'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-4 py-1.5 font-display text-sm font-bold capitalize transition ${
                mode === m
                  ? 'bg-brand-warm text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="relative min-w-[16rem] flex-1">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
            aria-hidden="true"
          />
          <BrandInput
            type="search"
            className="pl-9"
            placeholder={`Search ${mode}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="font-mono text-sm text-white/50">
          {rows.length} {mode}
        </span>
      </div>

      <div className={`${PANEL} overflow-x-auto`}>
        {mode === 'venues' ? (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className={TH}>Venue</th>
                <th className={TH}>Status</th>
                <th className={TH}>Tier</th>
                <th className={TH}>Foursquare</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className={`${TR} align-top`}>
                  <td className={TD}>
                    <p className="font-bold text-white">
                      {v.name || '(unnamed)'}
                    </p>
                    <p className="text-xs text-white/50">{v.address}</p>
                  </td>
                  <td className={TD}>
                    <span
                      className={
                        v.published ? 'text-brand-green' : 'text-white/50'
                      }
                    >
                      {v.published ? 'Live' : 'Draft'}
                    </span>
                  </td>
                  <td className={TD}>
                    <TierPill tier={v.subscriptionTier} />
                  </td>
                  <td className={`${TD_MUTED} text-xs`}>
                    {v.placeId ? v.placeId : '— none —'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center font-mono text-sm text-white/50"
                  >
                    No matching venues.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className={TH}>Owner</th>
                <th className={TH}>Email</th>
                <th className={TH}>Tier</th>
                <th className={TH}>Verification</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className={TR}>
                  <td className={TD}>
                    {u.displayName ||
                      `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
                      '(no name)'}
                  </td>
                  <td className={TD_MUTED}>{u.email}</td>
                  <td className={TD}>
                    <TierPill tier={u.subscriptionTier} />
                  </td>
                  <td className={TD_MUTED}>
                    {u.verificationStatus || 'UNVERIFIED'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center font-mono text-sm text-white/50"
                  >
                    No matching owners.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// --- Revenue tab (Paystack, on-demand) ---

function RevenueTab() {
  const { showError } = useError();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const result = await getAdminRevenue();
        if (alive) setData(result);
      } catch (error) {
        showError('Failed to load Paystack revenue figures.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [showError]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <BrandSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
        <StatCard
          label="MRR"
          value={rand(data.mrrCents)}
          hint="Monthly recurring (est.)"
        />
        <StatCard
          label="Active Subscriptions"
          value={fmtNum(data.activeSubscriptions)}
        />
        <StatCard
          label="Revenue This Month"
          value={rand(data.thisMonth.volumeCents)}
          hint={`${fmtNum(data.thisMonth.count)} transactions`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={PANEL}>
          <PanelTitle title="Active Subscriptions by Tier" />
          <ul className="mt-4 flex flex-col">
            {['starter', 'pro', 'enterprise'].map((tier) => (
              <li
                key={tier}
                className="flex items-center justify-between border-b border-white/10 py-2.5 font-mono text-sm capitalize last:border-0"
              >
                <span className="text-white/60">{tier}</span>
                <span className="font-bold text-white">
                  {fmtNum(data.byTier[tier])}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${PANEL} overflow-x-auto`}>
          <PanelTitle title="Recent Charges" />
          {data.recentTransactions.length === 0 ? (
            <p className="mt-4 font-mono text-sm text-white/50">
              No successful charges yet.
            </p>
          ) : (
            <table className="mt-4 w-full text-left">
              <tbody>
                {data.recentTransactions.map((tx) => (
                  <tr key={tx.reference} className={TR}>
                    <td className={TD}>{tx.email}</td>
                    <td className={TD_MUTED}>{fmtTs(tx.paidAt)}</td>
                    <td className={`${TD} text-right font-bold`}>
                      {rand(tx.amountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="font-mono text-xs text-white/50">
        Paystack figures as of {fmtTs(data.generatedAt)}. Reopen this tab to
        refresh.
      </p>
    </div>
  );
}

// --- Page shell ---

const TABS = ['Overview', 'Venues & Owners', 'Revenue'];

function AdminDashboard() {
  const navigate = useNavigate();
  const { showError } = useError();
  const [tab, setTab] = useState('Overview');

  const [venues, setVenues] = useState([]);
  const [users, setUsers] = useState([]);
  const [districtDocs, setDistrictDocs] = useState([]);
  const [cacheDocs, setCacheDocs] = useState([]);
  const [indexDoc, setIndexDoc] = useState(null);
  const [usageDoc, setUsageDoc] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const db = getFirestore();
    const onErr = () =>
      showError('Live admin data failed to load. Check admin access.');
    const map = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const unsubs = [
      onSnapshot(
        collection(db, 'venues'),
        (s) => {
          setVenues(map(s));
          setReady(true);
        },
        onErr
      ),
      onSnapshot(collection(db, 'users'), (s) => setUsers(map(s)), onErr),
      onSnapshot(
        collection(db, 'districts'),
        (s) => setDistrictDocs(map(s)),
        onErr
      ),
      onSnapshot(
        collection(db, 'districtVenues'),
        (s) => setCacheDocs(map(s)),
        onErr
      ),
      onSnapshot(
        doc(db, 'districtIndex', 'current'),
        (d) => setIndexDoc(d.exists() ? d.data() : null),
        onErr
      ),
      onSnapshot(
        doc(db, 'apiUsage', `foursquare_${CURRENT_MONTH}`),
        (d) => setUsageDoc(d.exists() ? d.data() : null),
        onErr
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [showError]);

  const stats = useMemo(() => {
    const byTier = { trial: 0, starter: 0, pro: 0, enterprise: 0 };
    let live = 0;
    let withPlaceId = 0;
    venues.forEach((v) => {
      if (v.published === true) live += 1;
      if (v.placeId) withPlaceId += 1;
      const t = v.subscriptionTier || 'trial';
      if (byTier[t] !== undefined) byTier[t] += 1;
    });
    return {
      total: venues.length,
      live,
      withPlaceId,
      byTier,
      subscribed: byTier.starter + byTier.pro + byTier.enterprise,
      owners: users.length,
      totalDistricts: districtDocs.length,
      activeDistricts: districtDocs.filter((d) => d.active === true).length,
    };
  }, [venues, users, districtDocs]);

  const districtCache = useMemo(
    () =>
      cacheDocs
        .map((d) => ({
          id: d.id,
          name: d.name || d.id,
          venueCount: Array.isArray(d.venues) ? d.venues.length : 0,
          fetchedAt: d.fetchedAt,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [cacheDocs]
  );

  const usage = {
    total: usageDoc?.totalCalls || 0,
    refresh: usageDoc?.refreshCalls || 0,
    search: usageDoc?.searchCalls || 0,
  };

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [navigate]);

  return (
    // Standalone route — the admin console renders outside DashboardLayout,
    // so this shell owns the page's <main>.
    <PageShell as="main" rings={RING_SETS.panel} width="max-w-[1400px]">
      <PageHeading
        eyebrow="Internal"
        title="Admin Console"
        description="Live platform telemetry: venue and owner directories, Foursquare quota, and Paystack revenue."
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 font-mono text-sm text-white/60">
              <span className="h-2 w-2 rounded-full bg-brand-green" />
              Live
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className={brandButton('outline', 'sm')}
            >
              <ArrowRightOnRectangleIcon
                className="h-4 w-4"
                aria-hidden="true"
              />
              Log Out
            </button>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2.5 font-mono text-sm transition ${
                tab === t
                  ? 'bg-white/10 font-bold text-white'
                  : 'text-white/55 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <SegmentedRule variant="cool" />
      </div>

      {!ready && tab !== 'Revenue' ? (
        <div className="flex items-center justify-center py-24">
          <BrandSpinner />
        </div>
      ) : (
        <>
          {tab === 'Overview' && (
            <OverviewTab
              stats={stats}
              usage={usage}
              districtCache={districtCache}
              indexUpdatedAt={indexDoc?.updatedAt}
            />
          )}
          {tab === 'Venues & Owners' && (
            <DirectoryTab venues={venues} users={users} />
          )}
          {tab === 'Revenue' && <RevenueTab />}
        </>
      )}
    </PageShell>
  );
}

export default AdminDashboard;
