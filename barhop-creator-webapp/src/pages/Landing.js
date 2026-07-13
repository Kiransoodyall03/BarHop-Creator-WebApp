import React from 'react';
import { Link } from 'react-router-dom';
import {
  TicketIcon,
  ChartBarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { buttonClasses } from '../components/ui/Button';

const FEATURES = [
  {
    Icon: TicketIcon,
    title: 'VIP Table Management',
    desc: 'Automate minimum spends, bottle service reservations, and real-time floor mapping.',
  },
  {
    Icon: ChartBarIcon,
    title: 'Revenue Analytics',
    desc: 'Track per-head spend, peak hours, and entertainer ROI from a single dashboard.',
  },
  {
    Icon: UsersIcon,
    title: 'Staff Operations',
    desc: 'Streamline payouts, manage shift schedules, and eliminate operational bottlenecks.',
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-96" />

      {/* Navbar */}
      <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-3xl font-bold tracking-tight text-content">
          BarHop
        </span>
        <div className="flex items-center gap-3">
          <Link to="/login" className={buttonClasses('secondary', 'sm')}>
            Log In
          </Link>
          <Link to="/register" className={buttonClasses('primary', 'sm')}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-16 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Enterprise Venue Management
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-content sm:text-5xl">
          The All-In-One Operations System for <br />
          <span className="text-gradient-sunset">
            High-Volume Nightclubs & Restaurants
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-content-muted">
          Automate VIP table bookings, streamline entertainer payouts, and
          eliminate third-party per-cover fees to increase venue profitability.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/demo" className={buttonClasses('primary', 'lg')}>
            Book a Demo
          </Link>
          <Link to="/register" className={buttonClasses('secondary', 'lg')}>
            Start 14-Day Free Trial
          </Link>
        </div>

        {/* High-Fidelity Product Visual */}
        <div className="relative mt-16 w-full">
          <img
            src="/assets/dashboard-preview.png"
            alt="BarHop Dashboard Interface showing table management and revenue analytics"
            className="w-full rounded-2xl border border-edge shadow-glow-primary"
          />
        </div>
      </main>

      {/* B2B Features strip */}
      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-24 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-edge bg-surface-raised p-8 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-edge-strong hover:shadow-card-hover motion-reduce:transform-none"
          >
            <feature.Icon
              className="h-8 w-8 text-primary"
              aria-hidden="true"
            />
            <p className="mt-4 font-semibold text-content">{feature.title}</p>
            <p className="mt-2 text-sm text-content-muted">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Landing;
