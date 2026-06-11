import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { getVenuesByOwner } from '../firebase/venueService';
import '../styles/Dashboard.css';

function DashboardLayout() {
  const { currentUser } = useAuth();
  const [activeVenue, setActiveVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVenueForSidebar = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const userVenues = await getVenuesByOwner(currentUser.uid);
      if (userVenues.length > 0) {
        setActiveVenue(userVenues[0]);
      }
    } catch (error) {
      console.error('Error fetching venue layout data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVenueForSidebar();
  }, [fetchVenueForSidebar]);

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="dashboard-main center-content">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* 1. Static Sidebar on the left */}
      <Sidebar activeVenue={activeVenue} />

      {/* 2. Dynamic Content on the right (Dashboard, CreateVenue, or Preview) */}
      <Outlet context={{ activeVenue }} />
    </div>
  );
}

export default DashboardLayout;
