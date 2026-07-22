import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { getVenuesByOwner } from '../firebase/venueService';
import {
  getVenueAnalytics,
  aggregateAnalyticsSummary,
} from '../firebase/analyticsService';
import VenueCardPreview from '../components/VenueCardPreview';
import { toPreviewData } from '../data/venuePreview';
import EmptyState from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { buttonClasses } from '../components/ui/Button';
import { SegmentedRule, OrbitRings, RING } from '../components/ui/Decor';

// Marketing Overview. Fixed dark palette (#262626 canvas, white text)
// taken from the Landing page's dark bands — this page does not follow
// the light/dark theme toggle.

const PANEL =
  'rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm';

// Decorative background circles, drawn with the shared gradient-stroke
// technique. White at the top-left, falling away into the canvas.
const DECOR_RINGS = [
  `${RING} -left-32 top-8 h-[420px] w-[420px] bg-brand-fade`,
  `${RING} left-[22%] -top-16 h-[480px] w-[480px] bg-brand-fade`,
  `${RING} right-[6%] -top-24 h-[520px] w-[520px] bg-brand-fade`,
  `${RING} right-[18%] top-64 h-[440px] w-[440px] bg-brand-fade`,
  `${RING} -right-16 top-[30rem] h-[400px] w-[400px] bg-brand-fade`,
];

const ANALYTICS_WINDOWS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
];

// Alternating bar ramps, matching the comp. Literal strings so Tailwind
// keeps them.
const BAR_RAMPS = [
  'bg-gradient-to-b from-brand-orange to-brand-pink',
  'bg-gradient-to-b from-brand-green to-brand-blue',
];

// --- Sub-components ---

// Outlined dropdown matching the comp. A native <select> under a styled
// shell: keyboard and screen-reader support for free, and no outside-click
// handling to get wrong.
const Dropdown = ({ label, value, onChange, options }) => (
  <label className="relative inline-flex h-11 min-w-[10rem] items-center rounded border border-white/40 px-4 font-mono text-sm text-white transition-colors focus-within:border-brand-pink hover:border-white">
    <span className="pointer-events-none flex-1 truncate">{label}</span>
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="pointer-events-none ml-3 h-4 w-4 shrink-0"
    >
      <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" />
    </svg>
    <select
      value={value}
      onChange={onChange}
      className="absolute inset-0 cursor-pointer opacity-0"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const MetricCard = ({ title, value, trend, positive }) => (
  <div className={`${PANEL} transition-colors hover:border-white/25`}>
    <h3 className="font-mono text-sm text-white/60">{title}</h3>
    <p className="mt-3 font-mono text-4xl font-bold leading-none text-white">
      {value}
    </p>
    <span
      className={`mt-3 flex items-center gap-1.5 font-mono text-xs ${
        positive ? 'text-brand-green' : 'text-brand-pink'
      }`}
    >
      {positive ? (
        <ArrowTrendingUpIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <ArrowTrendingDownIcon
          className="h-4 w-4 shrink-0"
          aria-hidden="true"
        />
      )}
      {trend}
    </span>
  </div>
);

const SwipeActivityChart = ({ weeklyData, maxSwipes, days }) => (
  <div className={`${PANEL} flex flex-col`}>
    <h2 className="font-display text-2xl font-bold text-white">
      Swipe Activity
    </h2>
    <p className="mt-1 font-mono text-sm text-white/60">Over {days} days</p>

    {weeklyData.length > 0 ? (
      <div className="mt-8 flex flex-1 gap-3">
        <span className="self-center whitespace-nowrap font-mono text-xs text-white/60 [writing-mode:vertical-rl] rotate-180">
          Number of Swipes
        </span>

        <div className="flex flex-1 flex-col">
          <div className="flex h-56 items-end gap-4 border-b border-l border-white/30 px-3 pb-px">
            {weeklyData.map((log, index) => {
              const totalSwipes =
                (log.swipedRight || 0) + (log.swipedLeft || 0);
              const heightPct = Math.max((totalSwipes / maxSwipes) * 100, 4);
              const dayLabel = log.date.toLocaleDateString('en-US', {
                weekday: 'short',
              });

              return (
                <div
                  key={log.id || index}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="font-mono text-lg font-bold text-white">
                    {totalSwipes}
                  </span>
                  <div
                    className={`w-full max-w-[48px] rounded-t transition-all duration-500 ${
                      BAR_RAMPS[index % BAR_RAMPS.length]
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${dayLabel}: ${totalSwipes} swipes`}
                  />
                  <span className="font-mono text-xs text-white/60">
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center font-mono text-xs text-white/60">
            Day of the Week
          </p>
        </div>
      </div>
    ) : (
      <p className="flex flex-1 items-center justify-center py-16 font-mono text-sm text-white/50">
        Awaiting first swipe data…
      </p>
    )}
  </div>
);

// Completeness checklist driven entirely off the venue doc — a card that
// scores every row gets shown to more people, so this doubles as the
// nudge toward /venue/edit.
const buildChecklist = (venue) => {
  const hours = venue.hours || {};
  const hoursComplete =
    Object.keys(hours).length > 0 &&
    Object.values(hours).every((day) => day && (day.closed || day.open));
  const socials = venue.socialLinks || {};

  return [
    {
      label: '3 HD images uploaded',
      done: (venue.images || []).length >= 3,
    },
    { label: 'Description written', done: Boolean(venue.description) },
    { label: 'Categories selected', done: (venue.categories || []).length > 0 },
    { label: 'Operating hours set', done: hoursComplete },
    { label: 'Contact number added', done: Boolean(venue.phone) },
    {
      label: 'Socials linked',
      done: Boolean(socials.instagram || socials.facebook || socials.tiktok),
    },
    { label: 'Venue video added', done: Boolean(venue.video) },
  ];
};

const CardChecklist = ({ venue }) => {
  const items = buildChecklist(venue);
  const doneCount = items.filter((item) => item.done).length;

  return (
    <div className={`${PANEL} flex flex-col`}>
      <h2 className="font-display text-2xl font-bold text-white">
        Card Checklist
      </h2>
      <p className="mt-1 font-mono text-sm text-white/60">
        {doneCount} of {items.length} complete
      </p>

      <ul className="mt-6 flex-1 space-y-3">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-start gap-2.5 font-mono text-sm"
          >
            {item.done ? (
              <CheckCircleIcon
                className="mt-px h-5 w-5 shrink-0 text-brand-green"
                aria-hidden="true"
              />
            ) : (
              <XCircleIcon
                className="mt-px h-5 w-5 shrink-0 text-white/35"
                aria-hidden="true"
              />
            )}
            <span className={item.done ? 'text-white/85' : 'text-white/50'}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      {doneCount < items.length && (
        <Link
          to={`/venue/edit/${venue.id}`}
          className="mt-6 rounded-lg bg-brand-warm px-5 py-2.5 text-center font-display text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink"
        >
          Finish your card
        </Link>
      )}
    </div>
  );
};

const CustomerView = ({ venue }) => (
  <div className={`${PANEL} flex flex-col`}>
    <h2 className="font-display text-2xl font-bold text-white">
      Active Customer View
    </h2>
    <p className="mt-1 font-mono text-sm text-white/60">
      Exactly how your venue looks when swiping
    </p>
    <div className="mt-6 flex justify-center">
      <VenueCardPreview venueData={toPreviewData(venue)} />
    </div>
  </div>
);

// --- Main Dashboard Component ---

function Dashboard() {
  const { currentUser } = useAuth();
  const { showError } = useError();

  const [venues, setVenues] = useState([]);
  const [analyticsLogs, setAnalyticsLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  // Both dropdowns. `selectedVenueId` stays null until the owner picks,
  // so the first venue is the default without an extra sync effect.
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [days, setDays] = useState(30);

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      const userVenues = await getVenuesByOwner(currentUser.uid);
      setVenues(userVenues);

      if (userVenues.length > 0) {
        const target =
          userVenues.find((v) => v.id === selectedVenueId) || userVenues[0];
        const logs = await getVenueAnalytics(target.id, days);
        setAnalyticsLogs(logs);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Failed to load your marketing data.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showError, selectedVenueId, days]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- UI States ---

  if (loading) {
    return (
      <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-brand-ink p-12">
        <Spinner />
        <p className="font-mono text-sm text-white/70">Loading dashboard...</p>
      </main>
    );
  }

  if (venues.length === 0) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-brand-ink p-12">
        <EmptyState
          icon={FireIcon}
          title="No Venue Card Created"
          description="Build your Tinder-style custom venue card to start getting discovered by local groups."
          className="max-w-md"
          action={
            <Link to="/venue/create" className={buttonClasses('primary')}>
              + Create Venue Card
            </Link>
          }
        />
      </main>
    );
  }

  const activeVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];

  // --- Process LIVE Analytics Data ---
  const summary = aggregateAnalyticsSummary(analyticsLogs);

  // Safe calculations to prevent dividing by zero
  const impressions = summary.impressions || 1;
  const likeRate = ((summary.swipedRight / impressions) * 100).toFixed(1);
  const matchRate = ((summary.matchRate / impressions) * 100).toFixed(1);

  const weeklyData = analyticsLogs.slice(-7);
  const maxSwipes = Math.max(
    ...weeklyData.map((d) => (d.swipedRight || 0) + (d.swipedLeft || 0)),
    1
  );

  return (
    <main className="relative min-h-screen flex-1 overflow-hidden bg-brand-ink px-6 py-10 text-white lg:px-12">
      <OrbitRings rings={DECOR_RINGS} className="opacity-30" />

      <div className="relative mx-auto flex max-w-[1600px] flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-6">
          <h1 className="font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {activeVenue.name}
          </h1>

          <span
            className={`inline-flex w-fit items-center gap-2.5 rounded-full px-5 py-2 font-mono text-sm font-bold text-white ${
              activeVenue.published ? 'bg-brand-warm' : 'bg-white/10'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                activeVenue.published ? 'bg-brand-green' : 'bg-white/50'
              }`}
            />
            {activeVenue.published ? 'Published' : 'Draft Mode'}
          </span>

          <SegmentedRule variant="warm" />

          <div className="flex flex-wrap gap-4">
            <Dropdown
              label="View Card"
              value={activeVenue.id}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              options={venues.map((v) => ({ value: v.id, label: v.name }))}
            />
            <Dropdown
              label="Filter"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              options={ANALYTICS_WINDOWS}
            />
          </div>
        </header>

        {/* Top-Level KPIs (Live) */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
          <MetricCard
            title="Right Swipes (Likes)"
            value={summary.swipedRight.toLocaleString()}
            trend={`${summary.impressions > 0 ? likeRate : 0}% Conversion`}
            positive={true}
          />
          <MetricCard
            title="Left Swipes (Passes)"
            value={summary.swipedLeft.toLocaleString()}
            trend="Active Discovery"
            positive={false}
          />
          <MetricCard
            title="Profile Expansions"
            value={summary.clickThroughs.toLocaleString()}
            trend="High intent views"
            positive={true}
          />
          <MetricCard
            title="Group Matches"
            value={summary.matchRate.toLocaleString()}
            trend={`${summary.impressions > 0 ? matchRate : 0}% of total views`}
            positive={true}
          />
        </div>

        <SegmentedRule variant="warm" />

        {/* Analytics panels */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr_1fr]">
          <SwipeActivityChart
            weeklyData={weeklyData}
            maxSwipes={maxSwipes}
            days={days}
          />
          <CardChecklist venue={activeVenue} />
          <CustomerView venue={activeVenue} />
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
