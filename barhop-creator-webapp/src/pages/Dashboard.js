import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import Navbar from '../components/Navbar';
import VenueCard from '../components/VenueCard';
import {
  getVenuesByOwner,
  deleteVenue,
  updateVenue,
} from '../firebase/venueService';
import '../styles/Dashboard.css';

function Dashboard() {
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useError();
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // 1. Wrapped in useCallback and moved ABOVE useEffect
  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      const userVenues = await getVenuesByOwner(currentUser.uid);
      setVenues(userVenues);
      setFilteredVenues(userVenues);
    } catch (error) {
      console.error('Error fetching venues:', error);
      showError('Failed to load venues. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUser.uid, showError]);

  // 2. Wrapped in useCallback and moved ABOVE useEffect
  const applyFilters = useCallback(() => {
    let filtered = [...venues];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(
        (venue) =>
          venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          venue.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((venue) =>
        filterStatus === 'published' ? venue.published : !venue.published
      );
    }

    setFilteredVenues(filtered);
  }, [venues, searchQuery, filterStatus]);

  // 3. Clean useEffects with proper dependencies
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVenues();
  }, [fetchVenues]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applyFilters();
  }, [applyFilters]);

  const handleDelete = async (venueId) => {
    try {
      await deleteVenue(venueId);
      showSuccess('Venue deleted successfully');
      fetchVenues();
    } catch (error) {
      console.error('Error deleting venue:', error);
      showError('Failed to delete venue. Please try again.');
    }
  };

  const handleTogglePublish = async (venueId, currentStatus) => {
    try {
      await updateVenue(venueId, {
        published: !currentStatus,
        updatedAt: new Date(),
      });
      showSuccess(currentStatus ? 'Venue unpublished' : 'Venue published');
      fetchVenues();
    } catch (error) {
      console.error('Error updating venue:', error);
      showError('Failed to update venue. Please try again.');
    }
  };

  // Calculate stats
  const stats = {
    total: venues.length,
    published: venues.filter((v) => v.published).length,
    draft: venues.filter((v) => !v.published).length,
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="dashboard">
          <div className="dashboard__loading">
            <div className="spinner"></div>
            <p>Loading your venues...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="dashboard__container">
          {/* Header */}
          <div className="dashboard__header">
            <div>
              <h1 className="dashboard__title">Dashboard</h1>
              <p className="dashboard__subtitle">Manage your venue cards</p>
            </div>
            <Link to="/venue/create" className="btn-create">
              <span className="btn-create__icon">+</span>
              Create Venue
            </Link>
          </div>

          {/* Stats */}
          <div className="dashboard__stats">
            <div className="stat-card">
              <div className="stat-card__value">{stats.total}</div>
              <div className="stat-card__label">Total Venues</div>
            </div>
            <div className="stat-card stat-card--success">
              <div className="stat-card__value">{stats.published}</div>
              <div className="stat-card__label">Published</div>
            </div>
            <div className="stat-card stat-card--muted">
              <div className="stat-card__value">{stats.draft}</div>
              <div className="stat-card__label">Drafts</div>
            </div>
          </div>

          {/* Search and Filters */}
          {venues.length > 0 && (
            <div className="dashboard__controls">
              <input
                type="text"
                placeholder="Search venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          )}

          {/* Venues Grid */}
          {filteredVenues.length > 0 ? (
            <div className="dashboard__grid">
              {filteredVenues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                />
              ))}
            </div>
          ) : venues.length > 0 ? (
            <div className="dashboard__empty">
              <p>No venues match your search criteria</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
                className="btn-clear"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="dashboard__empty">
              <div className="empty-icon">🏪</div>
              <h2>No Venues Yet</h2>
              <p>Create your first venue card to get started</p>
              <Link to="/venue/create" className="btn-create">
                <span className="btn-create__icon">+</span>
                Create Your First Venue
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
