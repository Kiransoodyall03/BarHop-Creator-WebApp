import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { getAdminRevenue } from '../firebase/adminService';
import { logout } from '../firebase/authService';
import { useError } from '../context/ErrorContext';
import { Spinner } from '../components/ui/Spinner';
import { Input } from '../components/ui/Field';
import { buttonClasses } from '../components/ui/Button';

const FOURSQUARE_FREE_CALLS = 500;
const CURRENT_MONTH = new Date().toISOString().slice(0, 7); // YYYY-MM

const cardClass = 'rounded-2xl border border-edge bg-surface-raised p-6';

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
    <div className={cardClass}>
      <p className="text-sm font-medium uppercase tracking-wider text-content-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-4xl font-bold text-content">
        {value}
      </p>
      {hint && <p className="mt-1 text-sm text-content-faint">{hint}</p>}
    </div>
  );
}

function TierPill({ tier }) {
  const styles = {
    trial: 'bg-content/10 text-content-muted',
    starter: 'bg-brand-blue/15 text-brand-blue',
    pro: 'bg-primary/15 text-primary',
    enterprise: 'bg-brand-green/15 text-brand-green',
  };
  const label = tier || 'trial';
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        styles[label] || styles.trial
      }`}
    >
      {label}
    </span>
  );
}

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

      <div className={cardClass}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold text-content">
            Foursquare API Usage
          </h2>
          <span className="text-sm text-content-faint">{CURRENT_MONTH}</span>
        </div>
        <p className="mt-2 text-3xl font-bold text-content">
          {fmtNum(usage.total)}
          <span className="text-base font-normal text-content-faint">
            {' '}
            / {fmtNum(FOURSQUARE_FREE_CALLS)} free calls
          </span>
        </p>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-content/10">
          <div
            className={`h-full rounded-full ${
              over ? 'bg-danger' : 'bg-primary'
            }`}
            style={{ width: `${usagePct}%` }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-content-muted">
          <span>Scheduled refresh: {fmtNum(usage.refresh)}</span>
          <span>Owner lookups: {fmtNum(usage.search)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <h2 className="font-display text-xl font-bold text-content">
            Venues by Tier
          </h2>
          <ul className="mt-4 flex flex-col">
            {['trial', 'starter', 'pro', 'enterprise'].map((tier) => (
              <li
                key={tier}
                className="flex items-center justify-between border-b border-edge py-2.5 text-sm capitalize last:border-0"
              >
                <span className="text-content-muted">{tier}</span>
                <span className="font-semibold text-content">
                  {fmtNum(stats.byTier[tier])}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={cardClass}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-content">
              District Cache
            </h2>
            <span className="text-sm text-content-faint">
              Index: {fmtTs(indexUpdatedAt)}
            </span>
          </div>
          {districtCache.length === 0 ? (
            <p className="mt-4 text-sm text-content-faint">
              No district snapshots yet — seed districts and run the refresh.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-content-faint">
                    <th className="pb-2 font-medium">District</th>
                    <th className="pb-2 text-right font-medium">Venues</th>
                    <th className="pb-2 text-right font-medium">Refreshed</th>
                  </tr>
                </thead>
                <tbody>
                  {districtCache.map((d) => (
                    <tr key={d.id} className="border-t border-edge">
                      <td className="py-2 text-content">{d.name}</td>
                      <td className="py-2 text-right text-content-muted">
                        {fmtNum(d.venueCount)}
                      </td>
                      <td className="py-2 text-right text-content-muted">
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
      [v.name, v.address, v.placeId, v.ownerId, v.id]
        .some((f) => (f || '').toLowerCase().includes(q))
    );
  }, [venues, q]);

  const filteredOwners = useMemo(() => {
    if (!q) return users;
    return users.filter((u) =>
      [u.email, u.displayName, u.firstName, u.lastName]
        .some((f) => (f || '').toLowerCase().includes(q))
    );
  }, [users, q]);

  const rows = mode === 'venues' ? filteredVenues : filteredOwners;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-edge p-1">
          {['venues', 'owners'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
                mode === m
                  ? 'bg-primary text-on-primary'
                  : 'text-content-muted hover:text-content'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="relative min-w-[16rem] flex-1">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-faint"
            aria-hidden="true"
          />
          <Input
            type="search"
            className="pl-9"
            placeholder={`Search ${mode}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="text-sm text-content-faint">
          {rows.length} {mode}
        </span>
      </div>

      <div className={`${cardClass} overflow-x-auto`}>
        {mode === 'venues' ? (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-content-faint">
                <th className="pb-3 font-medium">Venue</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Tier</th>
                <th className="pb-3 font-medium">Foursquare</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className="border-t border-edge align-top">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-content">
                      {v.name || '(unnamed)'}
                    </p>
                    <p className="text-xs text-content-faint">{v.address}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        v.published
                          ? 'text-brand-green'
                          : 'text-content-faint'
                      }
                    >
                      {v.published ? 'Live' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <TierPill tier={v.subscriptionTier} />
                  </td>
                  <td className="py-3 font-mono text-xs text-content-muted">
                    {v.placeId ? v.placeId : '— none —'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-content-faint">
                    No matching venues.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-content-faint">
                <th className="pb-3 font-medium">Owner</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Tier</th>
                <th className="pb-3 font-medium">Verification</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-edge">
                  <td className="py-3 pr-4 text-content">
                    {u.displayName ||
                      `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
                      '(no name)'}
                  </td>
                  <td className="py-3 pr-4 text-content-muted">{u.email}</td>
                  <td className="py-3 pr-4">
                    <TierPill tier={u.subscriptionTier} />
                  </td>
                  <td className="py-3 text-content-muted">
                    {u.verificationStatus || 'UNVERIFIED'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-content-faint">
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
        <Spinner />
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
        <div className={cardClass}>
          <h2 className="font-display text-xl font-bold text-content">
            Active Subscriptions by Tier
          </h2>
          <ul className="mt-4 flex flex-col">
            {['starter', 'pro', 'enterprise'].map((tier) => (
              <li
                key={tier}
                className="flex items-center justify-between border-b border-edge py-2.5 text-sm capitalize last:border-0"
              >
                <span className="text-content-muted">{tier}</span>
                <span className="font-semibold text-content">
                  {fmtNum(data.byTier[tier])}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${cardClass} overflow-x-auto`}>
          <h2 className="font-display text-xl font-bold text-content">
            Recent Charges
          </h2>
          {data.recentTransactions.length === 0 ? (
            <p className="mt-4 text-sm text-content-faint">
              No successful charges yet.
            </p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <tbody>
                {data.recentTransactions.map((tx) => (
                  <tr key={tx.reference} className="border-t border-edge">
                    <td className="py-2 pr-4 text-content">{tx.email}</td>
                    <td className="py-2 pr-4 text-content-faint">
                      {fmtTs(tx.paidAt)}
                    </td>
                    <td className="py-2 text-right font-semibold text-content">
                      {rand(tx.amountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="text-xs text-content-faint">
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
    <div className="min-h-screen bg-surface px-6 py-8 lg:px-12">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-content">
              Admin Console
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-content-faint">
              <span className="h-2 w-2 rounded-full bg-brand-green" />
              Live
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={buttonClasses('secondary', 'sm')}
          >
            <ArrowRightOnRectangleIcon
              className="h-4 w-4"
              aria-hidden="true"
            />
            Log Out
          </button>
        </header>

        <div className="flex gap-1 border-b border-edge">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                tab === t
                  ? 'border-primary text-content'
                  : 'border-transparent text-content-muted hover:text-content'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {!ready && tab !== 'Revenue' ? (
          <div className="flex items-center justify-center py-24">
            <Spinner />
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
      </div>
    </div>
  );
}

export default AdminDashboard;
