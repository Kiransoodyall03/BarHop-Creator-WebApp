import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';

function Landing() {
  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing__nav">
        <span className="landing__logo">BarHop</span>
        <div className="landing__nav-links">
          <Link to="/login" className="btn btn--ghost">
            Log In
          </Link>
          <Link to="/register" className="btn btn--primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="landing__hero">
        <div className="landing__eyebrow">Enterprise Venue Management</div>
        <h1 className="landing__headline">
          The All-In-One Operations System for <br />
          <span>High-Volume Nightclubs & Restaurants</span>
        </h1>
        <p className="landing__sub">
          Automate VIP table bookings, streamline entertainer payouts, and
          eliminate third-party per-cover fees to increase venue profitability.
        </p>
        <div className="landing__cta">
          <Link to="/demo" className="btn btn--primary btn--large">
            Book a Demo
          </Link>
          <Link to="/register" className="btn btn--ghost btn--large">
            Start 14-Day Free Trial
          </Link>
        </div>

        {/* High-Fidelity Product Visual */}
        <div className="landing__hero-visual">
          <img
            src="/assets/dashboard-preview.png"
            alt="BarHop Dashboard Interface showing table management and revenue analytics"
            className="hero-dashboard-img"
          />
        </div>
      </main>

      {/* B2B Features strip */}
      <section className="landing__features">
        <div className="feature">
          <div className="feature__icon">🍾</div>
          <p className="feature__title">VIP Table Management</p>
          <p className="feature__desc">
            Automate minimum spends, bottle service reservations, and real-time
            floor mapping.
          </p>
        </div>
        <div className="feature">
          <div className="feature__icon">📊</div>
          <p className="feature__title">Revenue Analytics</p>
          <p className="feature__desc">
            Track per-head spend, peak hours, and entertainer ROI from a single
            dashboard.
          </p>
        </div>
        <div className="feature">
          <div className="feature__icon">⚙️</div>
          <p className="feature__title">Staff Operations</p>
          <p className="feature__desc">
            Streamline payouts, manage shift schedules, and eliminate
            operational bottlenecks.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Landing;
