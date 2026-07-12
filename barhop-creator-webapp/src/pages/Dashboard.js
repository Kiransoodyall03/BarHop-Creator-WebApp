import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { getVenuesByOwner } from '../firebase/venueService';
import {
  getVenueAnalytics,
  aggregateAnalyticsSummary,
} from '../firebase/analyticsService';
import VenueCardPreview from '../components/VenueCardPreview';

const btnPrimaryClass =
  'inline-block rounded-lg bg-accent px-5 py-2.5 text-center font-semibold text-black transition hover:bg-accent-dim hover:shadow-glow-amber';
const btnSecondaryClass =
  'inline-block rounded-lg border border-white/15 px-5 py-2.5 text-center font-semibold text-gray-200 transition hover:border-accent/60 hover:text-accent';
const dataPanelClass = 'rounded-xl border border-white/10 bg-surface p-7';

// --- Pro Sub-Components ---

const MetricCard = ({ title, value, trend, positive }) => (
  <div className="rounded-xl border border-white/10 bg-surface p-6 transition hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl">
    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
      {title}
    </h3>
    <p className="mb-2 text-4xl font-bold leading-none text-white">{value}</p>
    <span
      className={`flex items-center gap-1 text-sm font-medium ${
        positive ? 'text-emerald-500' : 'text-red-500'
      }`}
    >
      {positive ? '↑' : '↓'} {trend}
    </span>
  </div>
);

const FunnelStep = ({ label, value, percentage, color }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between text-sm font-medium">
      <span className="text-gray-400">{label}</span>
      <span className="font-bold" style={{ color }}>
        {value}
      </span>
    </div>
    <div className="h-2 overflow-hidden rounded bg-white/5">
      <div
        className="h-full rounded transition-all duration-1000 ease-out"
        style={{ width: `${percentage || 0}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

// --- 🔴 EXTRACTED: DashboardContent Component ---
// This is now defined OUTSIDE the Dashboard component to prevent re-creation on every render.
const DashboardContent = ({ activeVenue, summary, weeklyData, impressions, likeRate, matchRate, maxSwipes }) => (
  <main className="flex h-screen flex-1 flex-col gap-8 overflow-y-auto bg-surface-deep px-12 py-10 text-gray-200 max-md:h-auto max-md:overflow-visible max-md:p-6">
    {/* Header Area */}
    <header className="flex items-center justify-between border-b border-white/10 pb-6 max-md:flex-col max-md:items-start max-md:gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          {activeVenue.name}
        </h1>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm text-gray-400">
          <span
            className={`h-2 w-2 rounded-full ${
              activeVenue.published
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                : 'bg-accent'
            }`}
          ></span>
          {activeVenue.published ? 'Live on App' : 'Draft Mode'}
        </div>
      </div>
      <div className="flex gap-4 max-md:w-full">
        <Link
          to={`/venue/preview/${activeVenue.id}`}
          className={`${btnSecondaryClass} max-md:flex-1`}
        >
          Live Preview
        </Link>
        <Link
          to={`/venue/edit/${activeVenue.id}`}
          className={`${btnPrimaryClass} max-md:flex-1`}
        >
          Optimize Card
        </Link>
      </div>
    </header>

    {/* Main Dashboard Wrapper */}
    <div className="relative flex flex-1 flex-col">
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

        {/* Main Analytics Content Area */}
        <div className="mt-6 grid grid-cols-[1.5fr_1fr] gap-6 max-xl:grid-cols-1">
          {/* Left Column: Funnel & Chart */}
          <div className="flex flex-col gap-6">
            {/* Live Conversion Funnel */}
            <div className={dataPanelClass}>
              <div className="mb-6 flex items-baseline justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Discovery Funnel
                </h2>
                <span className="text-sm text-gray-500">Last 30 Days</span>
              </div>
              <div className="flex flex-col gap-5">
                <FunnelStep
                  label="Card Impressions (Views)"
                  value={summary.impressions.toLocaleString()}
                  percentage={summary.impressions > 0 ? 100 : 0}
                  color="#555"
                />
                <FunnelStep
                  label="Swiped Right (Likes)"
                  value={summary.swipedRight.toLocaleString()}
                  percentage={(summary.swipedRight / impressions) * 100}
                  color="#f5a623"
                />
                <FunnelStep
                  label="Profile Expanded (Menu/Hours)"
                  value={summary.clickThroughs.toLocaleString()}
                  percentage={(summary.clickThroughs / impressions) * 100}
                  color="#3b82f6"
                />
                <FunnelStep
                  label="Group Matches (Ready to visit)"
                  value={summary.matchRate.toLocaleString()}
                  percentage={(summary.matchRate / impressions) * 100}
                  color="#10b981"
                />
              </div>
            </div>

            {/* 7-Day Live Activity Chart */}
            <div className={dataPanelClass}>
              <div className="mb-6 flex items-baseline justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Swipe Activity (7 Days)
                </h2>
              </div>
              {weeklyData.length > 0 ? (
                <div className="flex h-56 items-end justify-between gap-3 pt-8">
                  {weeklyData.map((log, index) => {
                    const totalSwipes =
                      (log.swipedRight || 0) + (log.swipedLeft || 0);
                    const heightPct = Math.max(
                      (totalSwipes / maxSwipes) * 100,
                      5
                    );
                    const dayLabel = log.date.toLocaleDateString('en-US', {
                      weekday: 'short',
                    });

                    return (
                      <div
                        key={log.id || index}
                        className="relative flex h-full flex-1 flex-col items-center justify-end gap-3"
                        title={`${totalSwipes} swipes`}
                      >
                        <div
                          className="w-full max-w-[40px] rounded-t-md bg-accent transition-all hover:bg-accent-dim"
                          style={{ height: `${heightPct}%` }}
                        ></div>
                        <span className="text-xs font-medium text-gray-500">
                          {dayLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Awaiting first swipe data...
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Card Preview */}
          <div>
            <div className={`${dataPanelClass} flex h-full flex-col items-center`}>
              <div className="mb-6 flex items-baseline justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Active Consumer View
                </h2>
              </div>
              <p className="mb-6 text-center text-sm text-gray-500">
                This is exactly how your venue appears to users swiping in
                your area.
              </p>
              <div className="flex w-full origin-top scale-90 justify-center">
                <VenueCardPreview venueData={activeVenue} />
              </div>
            </div>
          </div>
        </div>
      </div>
  </main>
);

// --- Main Dashboard Component ---

function Dashboard() {
  const { currentUser } = useAuth();
  const { showError } = useError();

  const [venues, setVenues] = useState([]);
  const [analyticsLogs, setAnalyticsLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Dashboard Data (Venues + Analytics)
  const fetchDashboardData = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      // Fetch user's venue
      const userVenues = await getVenuesByOwner(currentUser.uid);
      setVenues(userVenues);

      // If they have a venue, fetch its live analytics
      if (userVenues.length > 0) {
        const activeVenueId = userVenues[0].id;
        // Fetch the last 30 days of data
        const logs = await getVenueAnalytics(activeVenueId, 30);
        setAnalyticsLogs(logs);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Failed to load your marketing data.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showError]);

  useEffect(() => {
      const loadDashboard = async () => {
        await fetchDashboardData();
      };
      
      loadDashboard();
    }, [fetchDashboardData]);
  // --- UI States ---

  if (loading) {
    return (
      <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-surface-deep p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-accent"></div>
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </main>
    );
  }

  if (venues.length === 0) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-surface-deep p-12">
        <div className="max-w-md rounded-2xl border border-dashed border-white/20 bg-surface p-12 text-center">
          <div className="mb-4 text-6xl">🔥</div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            No Venue Card Created
          </h2>
          <p className="mb-8 leading-relaxed text-gray-500">
            Build your Tinder-style custom venue card to start getting
            discovered by local groups.
          </p>
          <Link to="/venue/create" className={btnPrimaryClass}>
            + Create Venue Card
          </Link>
        </div>
      </main>
    );
  }

  const activeVenue = venues[0];

  // --- Process LIVE Analytics Data ---
  const summary = aggregateAnalyticsSummary(analyticsLogs);

  // Safe calculations to prevent dividing by zero
  const impressions = summary.impressions || 1; // Prevent NaN
  const likeRate = ((summary.swipedRight / impressions) * 100).toFixed(1);
  const matchRate = ((summary.matchRate / impressions) * 100).toFixed(1);

  // Process 7-day chart data from the live logs
  const weeklyData = analyticsLogs.slice(-7);
  const maxSwipes = Math.max(
    ...weeklyData.map((d) => (d.swipedRight || 0) + (d.swipedLeft || 0)),
    1
  );

  // 🔴 Pass the calculated data as props to the extracted component
  const contentProps = {
    activeVenue,
    summary,
    weeklyData,
    impressions,
    likeRate,
    matchRate,
    maxSwipes
  };

  return <DashboardContent {...contentProps} />;
}

export default Dashboard;