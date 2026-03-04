import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logout } from "../firebase/authService";
import "../styles/Dashboard.css";

function Dashboard() {
  const { currentUser } = useAuth();
  const navigate        = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      <nav className="dashboard__nav">
        <span className="dashboard__logo">BarHop</span>
        <button className="dashboard__logout" onClick={handleLogout}>
          Sign Out
        </button>
      </nav>

      <main className="dashboard__main">
        <p className="dashboard__eyebrow">Signed in as</p>
        <h1 className="dashboard__title">
          {currentUser.firstName} {currentUser.lastName}
        </h1>

        <div className="dashboard__card">

          {/* Avatar */}
          {currentUser.photoURL && (
            <div className="detail__row">
              <span className="detail__label">Photo</span>
              <img
                className="detail__avatar"
                src={currentUser.photoURL}
                alt={currentUser.displayName}
              />
            </div>
          )}

          {/* uid */}
          <div className="detail__row">
            <span className="detail__label">User ID</span>
            <span className="detail__value detail__value--mono">{currentUser.uid}</span>
          </div>

          {/* email */}
          <div className="detail__row">
            <span className="detail__label">Email</span>
            <span className="detail__value">{currentUser.email}</span>
          </div>

          {/* displayName */}
          <div className="detail__row">
            <span className="detail__label">Display Name</span>
            <span className="detail__value">{currentUser.displayName ?? "—"}</span>
          </div>

          {/* firstName */}
          <div className="detail__row">
            <span className="detail__label">First Name</span>
            <span className="detail__value">{currentUser.firstName}</span>
          </div>

          {/* lastName */}
          <div className="detail__row">
            <span className="detail__label">Last Name</span>
            <span className="detail__value">{currentUser.lastName}</span>
          </div>

          {/* provider */}
          <div className="detail__row">
            <span className="detail__label">Sign-in Method</span>
            <span className={`detail__badge detail__badge--${currentUser.provider}`}>
              {currentUser.provider}
            </span>
          </div>

          {/* emailVerified */}
          <div className="detail__row">
            <span className="detail__label">Email Verified</span>
            <span className={`detail__badge detail__badge--${currentUser.emailVerified ? "verified" : "unverified"}`}>
              {currentUser.emailVerified ? "Yes" : "No"}
            </span>
          </div>

          {/* createdAt */}
          <div className="detail__row">
            <span className="detail__label">Member Since</span>
            <span className="detail__value">
              {currentUser.createdAt
                ? new Date(currentUser.createdAt).toLocaleDateString("en-ZA", {
                    day:   "numeric",
                    month: "long",
                    year:  "numeric",
                  })
                : "—"}
            </span>
          </div>

          {/* updatedAt */}
          <div className="detail__row">
            <span className="detail__label">Last Updated</span>
            <span className="detail__value">
              {currentUser.updatedAt
                ? new Date(currentUser.updatedAt).toLocaleDateString("en-ZA", {
                    day:   "numeric",
                    month: "long",
                    year:  "numeric",
                  })
                : "—"}
            </span>
          </div>

        </div>
      </main>
    </div>
  );
}

export default Dashboard;