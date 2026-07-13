import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
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
import EmptyState from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { buttonClasses } from '../components/ui/Button';

const dataPanelClass =
  'rounded-2xl border border-edge bg-surface-raised p-7 shadow-card';

// --- Pro Sub-Components ---

const MetricCard = ({ title, value, trend, positive }) => (
  <div className="rounded-2xl border border-edge bg-surface-raised p-6 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-edge-strong hover:shadow-card-hover motion-reduce:transform-none">
    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-content-faint">
      {title}
    </h3>
    <p className="mb-2 font-display text-4xl font-bold leading-none text-content">
      {value}
    </p>
    <span
      className={`flex items-center gap-1 text-sm font-medium ${
        positive ? 'text-success' : 'text-danger'
      }`}
    >
      {positive ? (
        <ArrowTrendingUpIcon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ArrowTrendingDownIcon className="h-4 w-4" aria-hidden="true" />
      )}{' '}
      {trend}
    </span>
  </div>
);

// Complete literal class strings per step (never template-built) so the
// Tailwind purge keeps them.
const FunnelStep = ({ label, value, percentage, colorClass }) => (
  <div className="flex flex-col gap-2">
    <div className="flex justify-between text-sm font-medium">
      <span className="text-content-muted">{label}</span>
      <span className={`font-bold ${colorClass.text}`}>{value}</span>
    </div>
    <div className="h-2 overflow-hidden rounded bg-content/5">
      <div
        className={`h-full rounded transition-all duration-1000 ease-out ${colorClass.bar}`}
        style={{ width: `${percentage || 0}%` }}
      />
    </div>
  </div>
);

const FUNNEL_COLORS = {
  impressions: { bar: 'bg-content-faint', text: 'text-content-muted' },
  likes: { bar: 'bg-primary', text: 'text-primary' },
  expansions: { bar: 'bg-secondary', text: 'text-secondary' },
  matches: { bar: 'bg-success', text: 'text-success' },
};

// --- EXTRACTED: DashboardContent Component ---
// This is now defined OUTSIDE the Dashboard component to prevent re-creation on every render.
const DashboardContent = ({ activeVenue, summary, weeklyData, impressions, likeRate, matchRate, maxSwipes }) => (
  <main className="flex h-screen flex-1 flex-col gap-8 overflow-y-auto bg-surface px-12 py-10 max-md:h-auto max-md:overflow-visible max-md:p-6">
    {/* Header Area */}
    <header className="flex items-center justify-between border-b border-edge pb-6 max-md:flex-col max-md:items-start max-md:gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-bold tracking-tight text-content">
          {activeVenue.name}
        </h1>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-content/5 px-3 py-1 text-sm text-content-muted">
          <span
            className={`h-2 w-2 rounded-full ${
              activeVenue.published
                ? 'bg-success shadow-[0_0_8px_rgb(45_212_191_/_0.5)]'
                : 'bg-secondary'
            }`}
          ></span>
          {activeVenue.published ? 'Live on App' : 'Draft Mode'}
        </div>
      </div>
      <div className="flex gap-4 max-md:w-full">
        <Link
          to={`/venue/preview/${activeVenue.id}`}
          className={buttonClasses('secondary', 'md', 'max-md:flex-1')}
        >
          Live Preview
        </Link>
        <Link
          to={`/venue/edit/${activeVenue.id}`}
          className={buttonClasses('primary', 'md', 'max-md:flex-1')}
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
                <h2 className="text-xl font-semibold text-content">
                  Discovery Funnel
                </h2>
                <span className="text-sm text-content-faint">Last 30 Days</span>
              </div>
              <div className="flex flex-col gap-5">
                <FunnelStep
                  label="Card Impressions (Views)"
                  value={summary.impressions.toLocaleString()}
                  percentage={summary.impressions > 0 ? 100 : 0}
                  colorClass={FUNNEL_COLORS.impressions}
                />
                <FunnelStep
                  label="Swiped Right (Likes)"
                  value={summary.swipedRight.toLocaleString()}
                  percentage={(summary.swipedRight / impressions) * 100}
                  colorClass={FUNNEL_COLORS.likes}
                />
                <FunnelStep
                  label="Profile Expanded (Menu/Hours)"
                  value={summary.clickThroughs.toLocaleString()}
                  percentage={(summary.clickThroughs / impressions) * 100}
                  colorClass={FUNNEL_COLORS.expansions}
                />
                <FunnelStep
                  label="Group Matches (Ready to visit)"
                  value={summary.matchRate.toLocaleString()}
                  percentage={(summary.matchRate / impressions) * 100}
                  colorClass={FUNNEL_COLORS.matches}
                />
              </div>
            </div>

            {/* 7-Day Live Activity Chart */}
            <div className={dataPanelClass}>
              <div className="mb-6 flex items-baseline justify-between">
                <h2 className="text-xl font-semibold text-content">
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
                          className="w-full max-w-[40px] rounded-t-md bg-primary transition-all hover:bg-primary-hover"
                          style={{ height: `${heightPct}%` }}
                        ></div>
                        <span className="text-xs font-medium text-content-faint">
                          {dayLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-content-faint">
                  Awaiting first swipe data...
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Card Preview */}
          <div>
            <div className={`${dataPanelClass} flex h-full flex-col items-center`}>
              <div className="mb-6 flex items-baseline justify-between">
                <h2 className="text-xl font-semibold text-content">
                  Active Consumer View
                </h2>
              </div>
              <p className="mb-6 text-center text-sm text-content-faint">
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
      <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-surface p-12">
        <Spinner />
        <p className="text-sm text-content-muted">Loading dashboard...</p>
      </main>
    );
  }

  if (venues.length === 0) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center bg-surface p-12">
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

  // Pass the calculated data as props to the extracted component
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
