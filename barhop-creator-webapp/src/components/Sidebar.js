import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

function Sidebar({ activeVenue }) {
  const location = useLocation();

  // Helpers to check if a link is active
  const isActive = (path) => (location.pathname === path ? 'active' : '');
  const isEditActive =
    location.pathname.includes('/venue/edit') ||
    location.pathname.includes('/venue/create')
      ? 'active'
      : '';
  const isPreviewActive = location.pathname.includes('/venue/preview')
    ? 'active'
    : '';

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-brand">
        BarHop <span>Creator</span>
      </div>
      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>
          📊 Marketing Overview
        </Link>

        {/* If they have a venue, show Edit and Preview. If not, show Create. */}
        {activeVenue ? (
          <>
            <Link
              to={`/venue/edit/${activeVenue.id}`}
              className={`nav-item ${isEditActive}`}
            >
              ⚙️ Optimize Card
            </Link>
            <Link
              to={`/venue/preview/${activeVenue.id}`}
              className={`nav-item ${isPreviewActive}`}
            >
              📱 Live Preview
            </Link>
          </>
        ) : (
          <Link to="/venue/create" className={`nav-item ${isEditActive}`}>
            ✨ Create Venue Card
          </Link>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
