import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getVenuesByOwner } from "../firebase/venueService";
import Navbar from "../components/Navbar";
import VenueCardPreview from "../components/VenueCardPreview";
import "../styles/Preview.css";
import { useError } from "../context/ErrorContext";

function Preview() {
  const { currentUser } = useAuth();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const {showError,showSuccess} = useError();

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const userVenues = await getVenuesByOwner(currentUser.uid);
      setVenues(userVenues);
      
      // Select the most recent venue by default
      if (userVenues.length > 0) {
        setSelectedVenue(userVenues[0]);
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
      showError("Failed to load venues. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleVenueSelect = (e) => {
    const venueId = e.target.value;
    const venue = venues.find(v => v.id === venueId);
    setSelectedVenue(venue);
  };

  // Convert venue data to match VenueCardPreview format
  const getVenuePreviewData = (venue) => {
    if (!venue) return null;

    return {
      title: venue.name,
      address: venue.address,
      categories: venue.category ? [venue.category] : [],
      images: venue.images || [],
      description: venue.description || "",
    };
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="preview-page">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your venues...</p>
          </div>
        </div>
      </>
    );
  }

  if (venues.length === 0) {
    return (
      <>
        <Navbar />
        <div className="preview-page">
          <div className="empty-state">
            <h2>No Venue Cards Yet</h2>
            <p>Create your first venue card to see it here!</p>
            <a href="/venue/create" className="create-venue-link">
              Create Venue Card
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
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
          <h1 className="preview-title">Preview Your Venue</h1>

          {/* Venue Selector */}
          <div className="venue-selector-container">
            <label className="selector-label">Select Venue:</label>
            <select 
              className="venue-selector"
              value={selectedVenue?.id || ""}
              onChange={handleVenueSelect}
            >
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} - {new Date(venue.createdAt?.toDate()).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* Venue Details */}
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
                  <span className="detail-value">
                    {selectedVenue.category || "Not set"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${selectedVenue.published ? 'published' : 'draft'}`}>
                    {selectedVenue.published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Description</h3>
                <p className="description-text">
                  {selectedVenue.description || "No description provided"}
                </p>
              </div>

              <div className="detail-section">
                <h3>Media</h3>
                <div className="detail-row">
                  <span className="detail-label">Images:</span>
                  <span className="detail-value">
                    {selectedVenue.images?.length || 0} uploaded
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Video:</span>
                  <span className="detail-value">
                    {selectedVenue.video ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Opening Hours</h3>
                {Object.entries(selectedVenue.hours || {}).map(([day, hours]) => (
                  <div key={day} className="hours-row">
                    <span className="day-label">
                      {day.charAt(0).toUpperCase() + day.slice(1)}:
                    </span>
                    <span className="hours-value">
                      {hours.closed 
                        ? "Closed" 
                        : `${hours.open || "Not set"} - ${hours.close || "Not set"}`
                      }
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="preview-actions">
                <a 
                  href={`/venue/edit/${selectedVenue.id}`} 
                  className="action-btn edit-btn"
                >
                  Edit Venue
                </a>
                <button 
                  className="action-btn publish-btn"
                  onClick={() => alert("Publish functionality coming soon!")}
                >
                  {selectedVenue.published ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Preview;