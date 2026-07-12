import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItemClass = (active) =>
  `block rounded-md px-4 py-3 font-medium transition ${
    active
      ? 'bg-accent/10 text-accent'
      : 'text-gray-400 hover:bg-accent/10 hover:text-accent'
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
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-white/10 bg-surface p-6 max-md:relative max-md:h-auto max-md:w-full max-md:border-b max-md:border-r-0">
      <div className="mb-12 text-2xl font-bold tracking-wide text-white">
        BarHop{' '}
        <span className="align-top text-[0.8em] text-accent">Creator</span>
      </div>
      <nav className="flex flex-col gap-2">
        <Link to="/dashboard" className={navItemClass(isActive('/dashboard'))}>
          📊 Marketing Overview
        </Link>

        {/* If they have a venue, show Edit and Preview. If not, show Create. */}
        {activeVenue ? (
          <>
            <Link
              to={`/venue/edit/${activeVenue.id}`}
              className={navItemClass(isEditActive)}
            >
              ⚙️ Optimize Card
            </Link>
            <Link
              to={`/venue/preview/${activeVenue.id}`}
              className={navItemClass(isPreviewActive)}
            >
              📱 Live Preview
            </Link>
            <Link
              to="/reservations"
              className={navItemClass(isActive('/reservations'))}
            >
              🍾 VIP Reservations
            </Link>
            <Link
              to="/settings"
              className={navItemClass(isActive('/settings'))}
            >
              🔒 Settings & Compliance
            </Link>
          </>
        ) : (
          <Link to="/venue/create" className={navItemClass(isEditActive)}>
            ✨ Create Venue Card
          </Link>
        )}

        <Link to="/plans" className={navItemClass(isActive('/plans'))}>
          💳 Plans & Billing
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
