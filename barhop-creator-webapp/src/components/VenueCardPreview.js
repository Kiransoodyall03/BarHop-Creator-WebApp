import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/VenueCardPreview.css';

function VenueCardPreview({ venueData }) {
  const {
    title,
    address,
    phone,
    website,
    category,
    images,
    description,
    hours,
    socialLinks,
  } = venueData;

  const imageCount = Math.max(images.length, 1);
  const currentImageIndex = 0;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [dragStartY, setDragStartY] = useState(null);
  const [currentY, setCurrentY] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);

  const handleDoubleClick = () => setSheetOpen(!sheetOpen);

  const handleDragStart = useCallback((clientY) => {
    isDragging.current = true;
    hasMoved.current = false;
    setDragStartY(clientY);
  }, []);

  const handleTouchStartIndicator = (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault();
      setSheetOpen(!sheetOpen);
    } else {
      setLastTap(currentTime);
      handleDragStart(e.touches[0].clientY);
    }
  };

  const handleDragMove = useCallback(
    (clientY) => {
      if (!isDragging.current || dragStartY === null) return;
      const deltaY = clientY - dragStartY;
      if (Math.abs(deltaY) > 5) hasMoved.current = true;
      if (sheetOpen) {
        if (deltaY > 0) setCurrentY(Math.min(deltaY, 400));
      } else {
        if (deltaY < 0) setCurrentY(Math.max(deltaY, -400));
      }
    },
    [dragStartY, sheetOpen]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (hasMoved.current) {
      const threshold = 60;
      if (sheetOpen && currentY > threshold) setSheetOpen(false);
      if (!sheetOpen && currentY < -threshold) setSheetOpen(true);
    }
    setCurrentY(0);
    setDragStartY(null);
    hasMoved.current = false;
  }, [currentY, sheetOpen]);

  useEffect(() => {
    const handleMouseMove = (e) =>
      (isDragging.current && e.preventDefault()) || handleDragMove(e.clientY);
    const handleMouseUp = () => handleDragEnd();
    const handleTouchMove = (e) =>
      (isDragging.current && e.preventDefault()) ||
      handleDragMove(e.touches[0].clientY);
    const handleTouchEnd = () => handleDragEnd();

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  const getSheetTransform = () =>
    sheetOpen
      ? `translateY(${currentY}px)`
      : `translateY(calc(100% - 40px + ${currentY}px))`;

  return (
    <div className="venue-card-preview">
      <div className="card-image-container">
        <div className="image-indicators">
          {Array.from({ length: imageCount }).map((_, index) => (
            <div
              key={index}
              className={`indicator-bar ${index === currentImageIndex && images.length > 0 ? 'active' : ''}`}
            />
          ))}
        </div>

        {images.length > 0 ? (
          <img src={images[0]} alt="Venue" className="card-image" />
        ) : (
          <div className="card-image-placeholder">
            <span className="add-image-text">No Images</span>
          </div>
        )}

        <div className="card-overlay-content">
          <h2 className="card-title">{title || 'Venue Title'}</h2>

          <div className="card-categories">
            {category ? (
              <span className="category-pill">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
            ) : (
              <span className="category-pill placeholder">Category</span>
            )}
          </div>

          <p className="card-distance">Xkm away</p>
          <div className="card-status-container">
            <span className="status-badge open">Open</span>
          </div>
          <p className="card-location">{address || 'Location of Place'}</p>
        </div>

        {/* BOTTOM SHEET */}
        <div
          className={`card-bottom-sheet ${sheetOpen ? 'open' : ''}`}
          style={{ transform: getSheetTransform() }}
        >
          <div
            className="sheet-indicator"
            onMouseDown={(e) => handleDragStart(e.clientY)}
            onTouchStart={handleTouchStartIndicator}
            onDoubleClick={handleDoubleClick}
          >
            <div className="indicator-handle-bar" />
          </div>

          <div className="sheet-content">
            <h3 className="sheet-title">About this place</h3>

            <div className="sheet-section">
              <h4 className="sheet-section-title">Description</h4>
              <p className="sheet-description">
                {description || 'No description available yet.'}
              </p>
            </div>

            <div className="sheet-section">
              <h4 className="sheet-section-title">Contact & Socials</h4>
              <div
                style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.6' }}
              >
                {phone ? (
                  <p>📞 {phone}</p>
                ) : (
                  <p className="sheet-placeholder">No phone added</p>
                )}
                {website ? (
                  <p>🌐 {website.replace(/^https?:\/\//, '')}</p>
                ) : null}
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  {socialLinks?.instagram && <span>📷 IG</span>}
                  {socialLinks?.tiktok && <span>🎵 TT</span>}
                </div>
              </div>
            </div>

            <div className="sheet-section" style={{ paddingBottom: '3rem' }}>
              <h4 className="sheet-section-title">Operating Hours</h4>
              <div style={{ color: '#ccc', fontSize: '0.85rem' }}>
                {hours ? (
                  Object.entries(hours).map(([day, time]) => (
                    <div
                      key={day}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ textTransform: 'capitalize' }}>{day}</span>
                      <span>
                        {time.closed
                          ? 'Closed'
                          : time.open
                            ? `${time.open} - ${time.close}`
                            : 'TBD'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="sheet-placeholder">
                    Hours will be displayed here
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VenueCardPreview;
