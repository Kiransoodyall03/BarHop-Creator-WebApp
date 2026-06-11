import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getVenuesByOwner } from '../firebase/venueService';
import VenueCardPreview from '../components/VenueCardPreview';
import { useError } from '../context/ErrorContext';
import '../styles/Preview.css';

function Preview() {
  const { currentUser } = useAuth();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();

  const fetchVenues = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      const userVenues = await getVenuesByOwner(currentUser.uid);
      setVenues(userVenues);

      // Select the most recent venue by default
      if (userVenues.length > 0) {
        setSelectedVenue(userVenues[0]);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      showError('Failed to load venues. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVenues();
  }, [fetchVenues]);

  const handleVenueSelect = (e) => {
    const venueId = e.target.value;
    const venue = venues.find((v) => v.id === venueId);
    setSelectedVenue(venue);
  };

  // Convert venue data to match the new strict types.ts payload for the Preview Card
  const getVenuePreviewData = (venue) => {
    if (!venue) return null;

    return {
      title: venue.name,
      address: venue.address,
      phone: venue.phone || '',
      website: venue.website || '',
      category: venue.category || '', // Singular string
      images: venue.images || [],
      description: venue.description || '',
      socialLinks: venue.socialLinks || {
        instagram: '',
        facebook: '',
        tiktok: '',
      },
      hours: venue.hours || null,
    };
  };

  if (loading) {
    return (
      <div className="preview-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p style={{ color: '#888', marginTop: '1rem' }}>
            Loading your venues...
          </p>
        </div>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="preview-page">
        <div className="empty-state">
          <h2>No Venue Cards Yet</h2>
          <p>Create your first venue card to see it here!</p>
          <a href="/venue/create" className="create-venue-link">
            + Create Venue Card
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-page">
      {/* Left Side - Card Preview */}
      <div className="preview-card-section">
        {selectedVenue && (
          <VenueCardPreview
            venueData={getVenuePreviewData(selectedVenue)}
            currentStep={4}
          />
        )}
      </div>

      {/* Right Side - Controls & Info */}
      <div className="preview-controls-section">
        <h1 className="preview-title">Active Card Preview</h1>

        {/* Venue Selector */}
        <div className="venue-selector-container">
          <label className="selector-label">Switch Venue:</label>
          <select
            className="venue-selector"
            value={selectedVenue?.id || ''}
            onChange={handleVenueSelect}
          >
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name} - {venue.published ? '(Live)' : '(Draft)'}
              </option>
            ))}
          </select>
        </div>

        {/* Venue Details - Styled as a Dashboard Data Panel */}
        {selectedVenue && (
          <div className="venue-details">
            <div className="detail-section">
              <h3>Basic Information</h3>
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{selectedVenue.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{selectedVenue.address}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Category:</span>
                <span
                  className="detail-value"
                  style={{ textTransform: 'capitalize' }}
                >
                  {selectedVenue.category || 'Not set'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span
                  className={`status-badge ${selectedVenue.published ? 'published' : 'draft'}`}
                >
                  {selectedVenue.published ? 'Live on App' : 'Draft Mode'}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Description</h3>
              <p className="description-text">
                {selectedVenue.description || 'No description provided'}
              </p>
            </div>

            <div className="detail-section">
              <h3>Media Assets</h3>
              <div className="detail-row">
                <span className="detail-label">Images Loaded:</span>
                <span className="detail-value">
                  {selectedVenue.images?.length || 0} / 4 Uploaded
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="preview-actions">
              <a
                href={`/venue/edit/${selectedVenue.id}`}
                className="action-btn edit-btn"
              >
                Optimize Card
              </a>
              <button
                className="action-btn publish-btn"
                onClick={() => alert('Publish functionality coming soon!')}
              >
                {selectedVenue.published ? 'Unpublish Card' : 'Publish to App'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Preview;
