import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { logout } from '../firebase/authService';
import { Logo } from './ui/Decor';

// The authenticated app's primary navigation. Replaces the old left
// Sidebar. Fixed light palette (white bar, ink text) to match the comp —
// it does not follow the theme toggle.

// `match` decides the active highlight. Routes that share a section
// (create/edit are the same "card" flow) collapse onto one entry.
const LINKS = [
  {
    label: 'Marketing Overview',
    to: '/dashboard',
    match: (p) => p === '/dashboard',
  },
  {
    label: 'Create New Card',
    to: '/venue/create',
    match: (p) => p.includes('/venue/create') || p.includes('/venue/edit'),
  },
  {
    label: 'Preview Card',
    // Needs a venue to link at, so this one is built per-render below.
    to: (venue) => `/venue/preview/${venue.id}`,
    needsVenue: true,
    match: (p) => p.includes('/venue/preview'),
  },
  {
    label: 'Reservation Management',
    to: '/reservations',
    match: (p) => p === '/reservations',
  },
  {
    label: 'Settings and Compliance',
    to: '/settings',
    match: (p) => p === '/settings',
  },
  {
    label: 'Billing and Planning',
    to: '/plans',
    match: (p) => p === '/plans',
  },
];

function TopNav({ activeVenue }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = LINKS.filter((l) => !l.needsVenue || activeVenue).map((l) => ({
    ...l,
    href: typeof l.to === 'function' ? l.to(activeVenue) : l.to,
    active: l.match(location.pathname),
  }));

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
      <nav className="flex h-16 items-stretch">
        <Link
          to="/dashboard"
          className="flex items-center pl-4 pr-3 sm:pl-6"
          aria-label="BarHop dashboard"
        >
          <Logo
            box="h-[24px] w-[86px]"
            art="-left-[4px] -top-[33px] h-[74px] w-[111px]"
          />
        </Link>

        {/* Six links plus the Log Out button don't fit below ~1280px. */}
        <ul className="ml-6 hidden items-stretch xl:flex">
          {links.map((link) => (
            <li key={link.label} className="flex">
              <Link
                to={link.href}
                aria-current={link.active ? 'page' : undefined}
                className={`flex items-center whitespace-nowrap px-4 font-mono text-sm transition-colors hover:text-brand-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-pink ${
                  link.active ? 'text-brand-pink' : 'text-brand-ink'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="topnav-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="flex items-center px-4 text-brand-ink transition-colors hover:text-brand-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-pink xl:hidden"
        >
          {menuOpen ? (
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center whitespace-nowrap bg-brand-warm px-5 font-display text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white sm:px-8 sm:text-lg"
        >
          Log Out
        </button>
      </nav>

      {menuOpen && (
        <ul
          id="topnav-menu"
          className="border-t border-brand-hairline bg-white pb-2 xl:hidden"
        >
          {links.map((link) => (
            <li key={link.label}>
              <Link
                to={link.href}
                onClick={() => setMenuOpen(false)}
                aria-current={link.active ? 'page' : undefined}
                className={`block px-6 py-3 font-mono text-sm transition-colors hover:text-brand-pink ${
                  link.active ? 'text-brand-pink' : 'text-brand-ink'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

export default TopNav;
