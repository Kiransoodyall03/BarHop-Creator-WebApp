import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../firebase/authService';

const navLinkClass = (active) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    active ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:text-white'
  }`;

const drawerLinkClass =
  'rounded-md px-4 py-3 font-medium text-gray-300 transition hover:bg-accent/10 hover:text-accent';

function Navbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="relative sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-surface/90 px-6 py-3 backdrop-blur">
      {/* Logo */}
      <Link
        to="/dashboard"
        className="font-display text-2xl tracking-wider text-white"
      >
        BarHop
      </Link>

      {/* Desktop nav links */}
      <div className="hidden items-center gap-1 md:flex">
        <Link to="/dashboard" className={navLinkClass(isActive('/dashboard'))}>
          Dashboard
        </Link>
        <Link
          to="/venue/create"
          className={navLinkClass(isActive('/venue/create'))}
        >
          Venue Card
        </Link>
        <Link
          to="/venue/manage"
          className={navLinkClass(isActive('/venue/manage'))}
        >
          Manage
        </Link>
        <Link
          to="/venue/preview"
          className={navLinkClass(isActive('/venue/preview'))}
        >
          Preview
        </Link>
      </div>

      {/* Desktop right side — user info + logout */}
      <div className="hidden items-center gap-3 md:flex">
        {currentUser?.photoURL && (
          <img
            className="h-8 w-8 rounded-full border border-white/10 object-cover"
            src={currentUser.photoURL}
            alt={currentUser.displayName}
          />
        )}
        <span className="text-sm text-gray-300">
          {currentUser?.firstName ||
            currentUser?.displayName ||
            currentUser?.email}
        </span>
        <button
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-gray-300 transition hover:border-accent/60 hover:text-accent"
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        className="flex flex-col gap-1.5 md:hidden"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span
          className={`h-0.5 w-6 rounded bg-gray-200 transition ${
            menuOpen ? 'translate-y-2 rotate-45' : ''
          }`}
        />
        <span
          className={`h-0.5 w-6 rounded bg-gray-200 transition ${
            menuOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`h-0.5 w-6 rounded bg-gray-200 transition ${
            menuOpen ? '-translate-y-2 -rotate-45' : ''
          }`}
        />
      </button>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          data-testid="navbar-drawer"
          className="absolute inset-x-0 top-full flex flex-col border-b border-white/10 bg-surface p-4 md:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <Link to="/dashboard" className={drawerLinkClass}>
            Dashboard
          </Link>
          <Link to="/venue/create" className={drawerLinkClass}>
            Venue Card
          </Link>
          <Link to="/venue/manage" className={drawerLinkClass}>
            Manage
          </Link>
          <Link to="/venue/preview" className={drawerLinkClass}>
            Preview
          </Link>
          <div className="my-2 border-t border-white/10" />
          <button
            className="rounded-md px-4 py-3 text-left font-medium text-red-400 transition hover:bg-red-400/10"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
