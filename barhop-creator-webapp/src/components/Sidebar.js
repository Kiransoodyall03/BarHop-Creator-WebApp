import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChartBarSquareIcon,
  PencilSquareIcon,
  DevicePhoneMobileIcon,
  TicketIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

const navItemClass = (active) =>
  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
    active
      ? 'bg-primary/10 text-primary'
      : 'text-content-muted hover:bg-primary/10 hover:text-primary'
  }`;

function Sidebar({ activeVenue }) {
  const location = useLocation();

  // Helpers to check if a link is active
  const isActive = (path) => location.pathname === path;
  const isEditActive =
    location.pathname.includes('/venue/edit') ||
    location.pathname.includes('/venue/create');
  const isPreviewActive = location.pathname.includes('/venue/preview');

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-edge bg-surface-raised p-6 max-md:relative max-md:h-auto max-md:w-full max-md:border-b max-md:border-r-0">
      <div className="mb-12 font-display text-2xl font-bold tracking-tight text-content">
        BarHop{' '}
        <span className="align-top text-[0.8em] text-primary">Creator</span>
      </div>
      <nav className="flex flex-col gap-2">
        <Link to="/dashboard" className={navItemClass(isActive('/dashboard'))}>
          <ChartBarSquareIcon className="h-5 w-5" aria-hidden="true" />
          Marketing Overview
        </Link>

        {/* If they have a venue, show Edit and Preview. If not, show Create. */}
        {activeVenue ? (
          <>
            <Link
              to={`/venue/edit/${activeVenue.id}`}
              className={navItemClass(isEditActive)}
            >
              <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
              Optimize Card
            </Link>
            <Link
              to={`/venue/preview/${activeVenue.id}`}
              className={navItemClass(isPreviewActive)}
            >
              <DevicePhoneMobileIcon className="h-5 w-5" aria-hidden="true" />
              Live Preview
            </Link>
            <Link
              to="/reservations"
              className={navItemClass(isActive('/reservations'))}
            >
              <TicketIcon className="h-5 w-5" aria-hidden="true" />
              VIP Reservations
            </Link>
            <Link
              to="/settings"
              className={navItemClass(isActive('/settings'))}
            >
              <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
              Settings & Compliance
            </Link>
          </>
        ) : (
          <Link to="/venue/create" className={navItemClass(isEditActive)}>
            <SparklesIcon className="h-5 w-5" aria-hidden="true" />
            Create Venue Card
          </Link>
        )}

        <Link to="/plans" className={navItemClass(isActive('/plans'))}>
          <CreditCardIcon className="h-5 w-5" aria-hidden="true" />
          Plans & Billing
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
