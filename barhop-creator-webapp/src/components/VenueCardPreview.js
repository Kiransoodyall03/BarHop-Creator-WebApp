import React from "react";
import "../styles/VenueCardPreview.css";

function VenueCardPreview({ venueData, currentStep }) {
  const { title, address, categories, images, description } = venueData; // Changed category to categories
  
  // Determine number of image indicators (max 4)
  const imageCount = Math.min(images.length || 1, 4);
  const currentImageIndex = 0;

  return (
    <div className="venue-card-preview">
      {/* Image Section */}
      <div className="card-image-container">
        {/* Image Indicators at top */}
        <div className="image-indicators">
          {Array.from({ length: Math.max(imageCount, 4) }).map((_, index) => (
            <div
              key={index}
              className={`indicator-bar ${
                index === currentImageIndex && images.length > 0 ? 'active' : ''
              }`}
            />
          ))}
        </div>

        {/* Image or Placeholder */}
        {images.length > 0 ? (
          <img src={images[0]} alt="Venue" className="card-image" />
        ) : (
          <div className="card-image-placeholder">
            <span className="add-image-text">Add Image</span>
          </div>
        )}

        {/* Overlay Content (on top of image) */}
        <div className="card-overlay-content">
          <h2 className="card-title">
            {title || "Venue Title"}
          </h2>

          {/* Category Pills - Updated to handle array */}
          <div className="card-categories">
            {categories && categories.length > 0 ? (
              categories.map((cat, index) => (
                <span key={index} className="category-pill">
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </span>
              ))
            ) : (
              <>
                <span className="category-pill placeholder">Category 1</span>
                <span className="category-pill placeholder">Category 2</span>
                <span className="category-pill placeholder">Category 3</span>
              </>
            )}
          </div>

          {/* Distance */}
          <p className="card-distance">Xkm away</p>

          {/* Open/Closed Status */}
          <div className="card-status-container">
            <span className="status-badge open">Open</span>
          </div>

          {/* Location */}
          <p className="card-location">
            {address || "Location of Place"}
          </p>
        </div>

        {/* Bottom Drag Handle */}
        <div className="card-drag-handle">
          <div className="handle-bar" />
        </div>
      </div>
    </div>
  );
}

export default VenueCardPreview;