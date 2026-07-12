import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { getVenuesByOwner } from '../firebase/venueService';

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

  return (
    <div className="flex min-h-screen bg-surface-deep max-md:flex-col">
      {/* 1. Static Sidebar on the left */}
      <Sidebar activeVenue={activeVenue} />

      {/* 2. Main content area */}
      <main className="flex-1 flex flex-col">
        {loading ? (
           <div className="flex flex-1 items-center justify-center">
             <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-accent"></div>
           </div>
        ) : (
          <Outlet context={{ activeVenue }} />
        )}
      </main>
    </div>
  );
}

export default DashboardLayout;
