import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';

function Landing() {
  return (
    <div className="landing">
      {/* Background glow */}
      <div className="landing__glow" />

      {/* Navbar */}
      <nav className="landing__nav">
        <span className="landing__logo">BarHop</span>
        <div className="landing__nav-links">
          <Link to="/login" className="btn btn--ghost">Log In</Link>
          <Link to="/register" className="btn btn--primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="landing__hero">
        <p className="landing__eyebrow">Bar & Venue Creator Platform</p>
        <h1 className="landing__headline">
          Your Bar.<br />
          <span>Your Rules.</span>
        </h1>
        <p className="landing__sub">
          List your venue, manage events, and connect with nightlife lovers
          in your city — all in one place.
        </p>
        <div className="landing__cta">
          <Link to="/register" className="btn btn--primary btn--large">
            Create Your Venue
          </Link>
          <Link to="/login" className="btn btn--ghost btn--large">
            Sign In
          </Link>
        </div>
      </main>

      {/* Features strip */}
      <section className="landing__features">
        <div className="feature">
          <div className="feature__icon">🍺</div>
          <p className="feature__title">Venue Listings</p>
          <p className="feature__desc">Showcase your bar with photos, menus, and hours.</p>
        </div>
        <div className="feature">
          <div className="feature__icon">🎟️</div>
          <p className="feature__title">Event Management</p>
          <p className="feature__desc">Create and promote events that fill your seats.</p>
        </div>
        <div className="feature">
          <div className="feature__icon">📍</div>
          <p className="feature__title">Local Discovery</p>
          <p className="feature__desc">Get discovered by bar-hoppers in your neighbourhood.</p>
        </div>
      </section>
    </div>
  );
}

export default Landing;