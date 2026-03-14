import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../firebase/authService";
import "../styles/Navbar.css";

function Navbar() {
  const { currentUser }   = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/dashboard" className="navbar__logo">
        BarHop
      </Link>

      {/* Desktop nav links */}
      <div className="navbar__links">
        <Link
          to="/dashboard"
          className={`navbar__link ${isActive("/dashboard") ? "navbar__link--active" : ""}`}
        >
          Dashboard
        </Link>
        <Link
          to="/venue/create"
          className={`navbar__link ${isActive("/venue/create") ? "navbar__link--active" : ""}`}
        >
          Venue Card
        </Link>
        <Link
          to="/venue/manage"
          className={`navbar__link ${isActive("/venue/manage") ? "navbar__link--active" : ""}`}
        >
          Manage
        </Link>
        <Link
          to="/venue/preview"
          className={`navbar__link ${isActive("/venue/preview") ? "navbar__link--active" : ""}`}
        >
          Preview
        </Link>
      </div>

      {/* Desktop right side — user info + logout */}
      <div className="navbar__right">
        {currentUser?.photoURL && (
          <img
            className="navbar__avatar"
            src={currentUser.photoURL}
            alt={currentUser.displayName}
          />
        )}
        <span className="navbar__name">
          {currentUser?.firstName || currentUser?.displayName || currentUser?.email}
        </span>
        <button className="navbar__logout" onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      {/* Mobile hamburger */}
      <button
        className={`navbar__hamburger ${menuOpen ? "navbar__hamburger--open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span />
        <span />
        <span />
      </button>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="navbar__drawer" onClick={() => setMenuOpen(false)}>
          <Link to="/dashboard"    className="drawer__link">Dashboard</Link>
          <Link to="/venue/create" className="drawer__link">Venue Card</Link>
          <Link to="/venue/manage" className="drawer__link">Manage</Link>
          <Link to="/venue/preview" className="drawer__link">Preview</Link>
          <div className="drawer__divider" />
          <button className="drawer__logout" onClick={handleLogout}>Sign Out</button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;