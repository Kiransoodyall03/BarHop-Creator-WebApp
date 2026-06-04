import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/VenueCard.css';

function VenueCard({ venue, onDelete, onTogglePublish }) {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${venue.name}"?`)) {
      onDelete(venue.id);
    }
  };

  return (
    <div className="venue-card">
      <div className="venue-card__image">
        {venue.images && venue.images.length > 0 ? (
          <img src={venue.images[0]} alt={venue.name} />
        ) : (
          <div className="venue-card__placeholder">
            <span>No Image</span>
          </div>
        )}
        <div
          className={`venue-card__status ${venue.published ? 'published' : 'draft'}`}
        >
          {venue.published ? 'Published' : 'Draft'}
        </div>
      </div>

      <div className="venue-card__content">
        <h3 className="venue-card__title">{venue.name}</h3>
        <p className="venue-card__address">{venue.address}</p>

        {venue.category && (
          <div className="venue-card__categories">
            <span className="category-tag">{venue.category}</span>
          </div>
        )}

        <div className="venue-card__actions">
          <Link to={`/venue/preview?id=${venue.id}`} className="action-link">
            Preview
          </Link>
          <Link to={`/venue/edit/${venue.id}`} className="action-link">
            Edit
          </Link>
          <button
            onClick={() => onTogglePublish(venue.id, venue.published)}
            className="action-btn"
          >
            {venue.published ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={handleDelete}
            className="action-btn action-btn--danger"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default VenueCard;
