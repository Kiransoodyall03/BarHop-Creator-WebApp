import React from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: '🍾',
    title: 'VIP Table Management',
    desc: 'Automate minimum spends, bottle service reservations, and real-time floor mapping.',
  },
  {
    icon: '📊',
    title: 'Revenue Analytics',
    desc: 'Track per-head spend, peak hours, and entertainer ROI from a single dashboard.',
  },
  {
    icon: '⚙️',
    title: 'Staff Operations',
    desc: 'Streamline payouts, manage shift schedules, and eliminate operational bottlenecks.',
  },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-deep text-gray-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-neon-violet/10 via-accent/5 to-transparent" />

      {/* Navbar */}
      <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-3xl tracking-wider text-white">
          BarHop
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-accent/60 hover:text-accent"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:bg-accent-dim hover:shadow-glow-amber"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-16 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          Enterprise Venue Management
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          The All-In-One Operations System for <br />
          <span className="bg-gradient-to-r from-accent to-neon-violet bg-clip-text text-transparent">
            High-Volume Nightclubs & Restaurants
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400">
          Automate VIP table bookings, streamline entertainer payouts, and
          eliminate third-party per-cover fees to increase venue profitability.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/demo"
            className="rounded-lg bg-accent px-6 py-3 font-semibold text-black transition hover:bg-accent-dim hover:shadow-glow-amber"
          >
            Book a Demo
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-white/15 px-6 py-3 font-semibold text-gray-200 transition hover:border-accent/60 hover:text-accent"
          >
            Start 14-Day Free Trial
          </Link>
        </div>

        {/* High-Fidelity Product Visual */}
        <div className="relative mt-16 w-full">
          <img
            src="/assets/dashboard-preview.png"
            alt="BarHop Dashboard Interface showing table management and revenue analytics"
            className="w-full rounded-2xl border border-white/10 shadow-glow-violet"
          />
        </div>
      </main>

      {/* B2B Features strip */}
      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-24 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-white/10 bg-surface-card p-8 transition hover:border-white/20"
          >
            <div className="text-3xl">{feature.icon}</div>
            <p className="mt-4 font-semibold text-white">{feature.title}</p>
            <p className="mt-2 text-sm text-gray-400">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Landing;
