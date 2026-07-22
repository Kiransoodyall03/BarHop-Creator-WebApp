import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import { Spinner } from './ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { getVenuesByOwner } from '../firebase/venueService';

function DashboardLayout() {
  const { currentUser } = useAuth();
  const [activeVenue, setActiveVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVenueForNav = useCallback(async () => {
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
    fetchVenueForNav();
  }, [fetchVenueForNav]);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* 1. Sticky top navigation */}
      <TopNav activeVenue={activeVenue} />

      {/* 2. Main content area */}
      <main className="flex flex-1 flex-col">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <Outlet context={{ activeVenue }} />
        )}
      </main>
    </div>
  );
}

export default DashboardLayout;
