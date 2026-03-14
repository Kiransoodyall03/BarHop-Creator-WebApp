import React from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "../styles/Dashboard.css";

function Dashboard() {
  const { currentUser } = useAuth();

  return (
    <div className="dashboard">
      <Navbar />

      <main className="dashboard__main">
        <p className="dashboard__eyebrow">Signed in as</p>
        <h1 className="dashboard__title">
          {currentUser.firstName} {currentUser.lastName}
        </h1>

        <div className="dashboard__card">

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

          <div className="detail__row">
            <span className="detail__label">User ID</span>
            <span className="detail__value detail__value--mono">{currentUser.uid}</span>
          </div>

          <div className="detail__row">
            <span className="detail__label">Email</span>
            <span className="detail__value">{currentUser.email}</span>
          </div>

          <div className="detail__row">
            <span className="detail__label">Display Name</span>
            <span className="detail__value">{currentUser.displayName ?? "—"}</span>
          </div>

          <div className="detail__row">
            <span className="detail__label">First Name</span>
            <span className="detail__value">{currentUser.firstName}</span>
          </div>

          <div className="detail__row">
            <span className="detail__label">Last Name</span>
            <span className="detail__value">{currentUser.lastName}</span>
          </div>

          <div className="detail__row">
            <span className="detail__label">Sign-in Method</span>
            <span className={`detail__badge detail__badge--${currentUser.provider}`}>
              {currentUser.provider}
            </span>
          </div>

          <div className="detail__row">
            <span className="detail__label">Email Verified</span>
            <span className={`detail__badge detail__badge--${currentUser.emailVerified ? "verified" : "unverified"}`}>
              {currentUser.emailVerified ? "Yes" : "No"}
            </span>
          </div>

          <div className="detail__row">
            <span className="detail__label">Member Since</span>
            <span className="detail__value">
              {currentUser.createdAt
                ? new Date(currentUser.createdAt).toLocaleDateString("en-ZA", {
                    day: "numeric", month: "long", year: "numeric",
                  })
                : "—"}
            </span>
          </div>

          <div className="detail__row">
            <span className="detail__label">Onboarding</span>
            <span className={`detail__badge detail__badge--${currentUser.onboardingComplete ? "verified" : "unverified"}`}>
              {currentUser.onboardingComplete ? "Complete" : "Pending"}
            </span>
          </div>

          <div className="detail__row">
            <span className="detail__label">Venue ID</span>
            <span className="detail__value detail__value--mono">
              {currentUser.venueId ?? "Not linked"}
            </span>
          </div>

        </div>
      </main>
    </div>
  );
}

export default Dashboard;