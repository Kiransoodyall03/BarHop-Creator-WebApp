import React, { useState, useRef, useEffect } from "react";
import "../styles/VenueCardPreview.css";

function VenueCardPreview({ venueData, currentStep }) {
  const { title, address, categories, images, description } = venueData;
  
  // Determine number of image indicators (max 4)
  const imageCount = Math.min(images.length || 1, 4);
  const currentImageIndex = 0;

  // Bottom sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragStartY, setDragStartY] = useState(null);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef(null);
  const isDragging = useRef(false);

  // Handle drag start
  const handleDragStart = (clientY) => {
    isDragging.current = true;
    setDragStartY(clientY);
  };

  // Handle drag move
  const handleDragMove = (clientY) => {
    if (!isDragging.current || dragStartY === null) return;

    const deltaY = clientY - dragStartY;
    
    if (sheetOpen) {
      // When open, only allow downward dragging
      if (deltaY > 0) {
        setCurrentY(Math.min(deltaY, 300));
      }
    } else {
      // When closed, only allow upward dragging
      if (deltaY < 0) {
        setCurrentY(Math.max(deltaY, -300));
      }
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    
    const threshold = 80; // pixels to trigger open/close

    if (sheetOpen) {
      // If dragged down more than threshold, close
      if (currentY > threshold) {
        setSheetOpen(false);
      }
    } else {
      // If dragged up more than threshold, open
      if (currentY < -threshold) {
        setSheetOpen(true);
      }
    }

    setCurrentY(0);
    setDragStartY(null);
  };

  // Mouse events
  const handleMouseDown = (e) => {
    handleDragStart(e.clientY);
  };

  const handleMouseMove = (e) => {
    handleDragMove(e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch events
  const handleTouchStart = (e) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging.current, dragStartY]);

  // Calculate sheet position
  const getSheetTransform = () => {
    if (sheetOpen) {
      return `translateY(${currentY}px)`;
    } else {
      return `translateY(calc(100% - 100px + ${currentY}px))`;
    }
  };

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

          {/* Category Pills */}
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

        {/* Bottom Sheet */}
        <div 
          ref={sheetRef}
          className={`card-bottom-sheet ${sheetOpen ? 'open' : ''}`}
          style={{ transform: getSheetTransform() }}
        >
          {/* Drag Handle */}
          <div 
            className="card-drag-handle"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div className="handle-bar" />
          </div>

          {/* Sheet Content */}
          <div className="sheet-content">
            <h3 className="sheet-title">About this place</h3>
            
            <div className="sheet-section">
              <h4 className="sheet-section-title">Description</h4>
              <p className="sheet-description">
                {description || "No description available yet. Add a description to tell people more about your venue!"}
              </p>
            </div>

            <div className="sheet-section">
              <h4 className="sheet-section-title">Opening Hours</h4>
              <p className="sheet-placeholder">Hours will be displayed here</p>
            </div>

            <div className="sheet-section">
              <h4 className="sheet-section-title">Special Offers</h4>
              <p className="sheet-placeholder">Special offers coming soon</p>
            </div>

            <div className="sheet-section">
              <h4 className="sheet-section-title">Contact</h4>
              <p className="sheet-placeholder">Contact information coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VenueCardPreview;