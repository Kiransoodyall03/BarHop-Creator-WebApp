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
import '../styles/Dashboard.css';

// --- Pro Sub-Components ---

const MetricCard = ({ title, value, trend, positive }) => (
  <div className="metric-card">
    <h3 className="metric-title">{title}</h3>
    <p className="metric-value">{value}</p>
    <span className={`metric-trend ${positive ? 'positive' : 'negative'}`}>
      {positive ? '↑' : '↓'} {trend}
    </span>
  </div>
);

const FunnelStep = ({ label, value, percentage, color }) => (
  <div className="funnel-step">
    <div className="funnel-labels">
      <span className="funnel-label">{label}</span>
      <span className="funnel-value" style={{ color }}>
        {value}
      </span>
    </div>
    <div className="funnel-track">
      <div
        className="funnel-fill"
        style={{ width: `${percentage || 0}%`, backgroundColor: color }}
      />
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- UI States ---

  if (loading) {
    return (
      <div className="dashboard-layout">
        <main className="dashboard-main center-content">
          <div className="spinner"></div>
          <p className="loading-text">Loading marketing analytics...</p>
        </main>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="dashboard-layout">
        <main className="dashboard-main center-content">
          <div className="empty-state-container">
            <div className="empty-state-icon">🔥</div>
            <h2>No Venue Card Created</h2>
            <p>
              Build your Tinder-style custom venue card to start getting
              discovered by local groups.
            </p>
            <Link to="/venue/create" className="btn-primary">
              + Create Venue Card
            </Link>
          </div>
        </main>
      </div>
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
  // Default to an empty 7-day array if no data exists to keep the UI looking good
  const weeklyData = analyticsLogs.slice(-7);
  const maxSwipes = Math.max(
    ...weeklyData.map((d) => (d.swipedRight || 0) + (d.swipedLeft || 0)),
    1
  );

  return (
    <main className="dashboard-main">
      {/* Header Area */}
      <header className="dashboard-header">
        <div className="header-info">
          <h1 className="header-title">{activeVenue.name}</h1>
          <div className="header-status-pill">
            <span
              className={`status-dot ${activeVenue.published ? 'live' : 'draft'}`}
            ></span>
            {activeVenue.published ? 'Live on App' : 'Draft Mode'}
          </div>
        </div>
        <div className="header-actions">
          <Link
            to={`/venue/preview/${activeVenue.id}`}
            className="btn-secondary"
          >
            Live Preview
          </Link>
          <Link to={`/venue/edit/${activeVenue.id}`} className="btn-primary">
            Optimize Card
          </Link>
        </div>
      </header>

      {/* Top-Level KPIs (Live) */}
      <div className="metrics-grid">
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
      <div className="dashboard-content-grid">
        {/* Left Column: Funnel & Chart */}
        <div className="analytics-column">
          {/* Live Conversion Funnel */}
          <div className="data-panel">
            <div className="panel-header">
              <h2>Discovery Funnel</h2>
              <span className="panel-subtitle">Last 30 Days</span>
            </div>
            <div className="funnel-container">
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
          <div className="data-panel">
            <div className="panel-header">
              <h2>Swipe Activity (7 Days)</h2>
            </div>
            {weeklyData.length > 0 ? (
              <div className="bar-chart-container">
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
                      className="chart-bar-wrapper"
                      title={`${totalSwipes} swipes`}
                    >
                      <div
                        className="chart-bar highlight"
                        style={{ height: `${heightPct}%` }}
                      ></div>
                      <span className="chart-label">{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{ padding: '2rem', textAlign: 'center', color: '#666' }}
              >
                Awaiting first swipe data...
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Card Preview */}
        <div className="preview-column">
          <div className="data-panel preview-panel">
            <div className="panel-header">
              <h2>Active Consumer View</h2>
            </div>
            <p className="preview-helper-text">
              This is exactly how your venue appears to users swiping in your
              area.
            </p>
            <div className="preview-scale-wrapper">
              <VenueCardPreview venueData={activeVenue} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
