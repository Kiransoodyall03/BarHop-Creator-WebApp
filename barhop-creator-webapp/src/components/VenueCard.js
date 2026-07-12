import React from 'react';
import { Link } from 'react-router-dom';

function VenueCard({ venue, onDelete, onTogglePublish }) {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${venue.name}"?`)) {
      onDelete(venue.id);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-card transition hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl">
      <div className="relative h-44 w-full">
        {venue.images && venue.images.length > 0 ? (
          <img
            src={venue.images[0]}
            alt={venue.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface text-sm text-gray-500">
            <span>No Image</span>
          </div>
        )}
        <div
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
            venue.published
              ? 'bg-emerald-500/90 text-white'
              : 'bg-accent/90 text-black'
          }`}
        >
          {venue.published ? 'Published' : 'Draft'}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold text-white">{venue.name}</h3>
        <p className="text-sm text-gray-500">{venue.address}</p>

        {venue.category && (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium capitalize text-accent">
              {venue.category}
            </span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4">
          <Link
            to={`/venue/preview?id=${venue.id}`}
            className="text-sm font-medium text-gray-300 transition hover:text-accent"
          >
            Preview
          </Link>
          <Link
            to={`/venue/edit/${venue.id}`}
            className="text-sm font-medium text-gray-300 transition hover:text-accent"
          >
            Edit
          </Link>
          <button
            onClick={() => onTogglePublish(venue.id, venue.published)}
            className="text-sm font-medium text-gray-300 transition hover:text-accent"
          >
            {venue.published ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={handleDelete}
            className="text-sm font-medium text-red-400 transition hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default VenueCard;
