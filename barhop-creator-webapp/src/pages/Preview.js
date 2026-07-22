import React, { useState, useEffect, useCallback } from 'react';
import {
  LockClosedIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getVenuesByOwner, updateVenue } from '../firebase/venueService';
import VenueCardPreview from '../components/VenueCardPreview';
import { toPreviewData } from '../data/venuePreview';
import EmptyState from '../components/ui/EmptyState';
import { Select } from '../components/ui/Field';
import { Spinner } from '../components/ui/Spinner';
import { buttonClasses } from '../components/ui/Button';
import { useError } from '../context/ErrorContext';
import { useSubscription } from '../hooks/useSubscription';

const labelClass =
  'text-xs font-semibold uppercase tracking-wider text-content-muted';

function Preview() {
  const { currentUser } = useAuth();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useError();
  const { canPublish } = useSubscription(
    selectedVenue && selectedVenue.subscriptionTier
  );

  const fetchVenues = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      const userVenues = await getVenuesByOwner(currentUser.uid);
      setVenues(userVenues);

      if (userVenues.length > 0 && !selectedVenue) {
        setSelectedVenue(userVenues[0]);
      } else if (selectedVenue) {
        const updatedVenue = userVenues.find((v) => v.id === selectedVenue.id);
        setSelectedVenue(updatedVenue || userVenues[0]);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      showError('Failed to load venues. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showError, selectedVenue]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVenues();
  }, [fetchVenues]);

  const handleVenueSelect = (e) => {
    const venueId = e.target.value;
    const venue = venues.find((v) => v.id === venueId);
    setSelectedVenue(venue);
  };

  const handleTogglePublish = async () => {
    if (!selectedVenue) return;

    const newStatus = !selectedVenue.published;

    // Publishing is a paid (Starter+) feature. Unpublishing is always
    // allowed so a lapsed venue can still take its card down.
    if (newStatus && !canPublish) {
      showError(
        'You must subscribe to the Starter Plan to publish your venue to the consumer swipe deck.'
      );
      return;
    }

    // Ownership verification happens during registration (Paystack
    // subaccount), so every owner who can reach this toggle is verified.
    try {
      await updateVenue(selectedVenue.id, { published: newStatus });
      showSuccess(
        'Venue successfully ' +
          (newStatus ? 'published to the app' : 'unpublished') +
          '.'
      );
      fetchVenues(); // Refresh the list
    } catch (error) {
      console.error('Error toggling publish status:', error);
      showError('Failed to update publish status.');
    }
  };

  if (loading && venues.length === 0) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-surface p-12">
        <Spinner />
        <p className="text-sm text-content-muted">Loading your venues...</p>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-surface p-12">
        <EmptyState
          icon={RectangleStackIcon}
          title="No Venue Cards Yet"
          description="Create your first venue card to see it here!"
          className="max-w-md"
          action={
            <a href="/venue/create" className={buttonClasses('primary')}>
              + Create Venue Card
            </a>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 gap-8 bg-surface p-8 max-lg:flex-col">
      {/* Left Side - Card Preview */}
      <div className="flex w-1/2 items-start justify-center max-lg:w-full">
        {selectedVenue && (
          <VenueCardPreview
            venueData={toPreviewData(selectedVenue)}
            currentStep={4}
          />
        )}
      </div>

      {/* Right Side - Controls & Info */}
      <div className="flex w-1/2 flex-col gap-6 max-lg:w-full">
        <h1 className="font-display text-3xl font-bold tracking-tight text-content">
          Active Card Preview
        </h1>

        {/* Venue Selector */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Switch Venue:</label>
          <Select
            className="py-3 text-sm"
            value={selectedVenue?.id || ''}
            onChange={handleVenueSelect}
          >
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name} - {venue.published ? '(Live)' : '(Draft)'}
              </option>
            ))}
          </Select>
        </div>

        {/* Venue Details - Styled as a Dashboard Data Panel */}
        {selectedVenue && (
          <div className="flex flex-col gap-6 rounded-2xl border border-edge bg-surface-raised p-8 shadow-card">
            <div className="flex flex-col gap-2">
              <h3 className="mb-1 text-lg font-semibold text-content">
                Basic Information
              </h3>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-content-faint">Name:</span>
                <span className="text-right font-medium text-content">
                  {selectedVenue.name}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-content-faint">Address:</span>
                <span className="text-right font-medium text-content">
                  {selectedVenue.address}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-content-faint">Categories:</span>
                <span className="text-right font-medium capitalize text-content">
                  {(selectedVenue.categories &&
                  selectedVenue.categories.length > 0
                    ? selectedVenue.categories.join(', ')
                    : selectedVenue.category) || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-content-faint">Status:</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedVenue.published
                      ? 'bg-success/15 text-success'
                      : 'bg-secondary/15 text-secondary'
                  }`}
                >
                  {selectedVenue.published ? 'Live on App' : 'Draft Mode'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="mb-1 text-lg font-semibold text-content">
                Description
              </h3>
              <p className="text-sm leading-relaxed text-content-muted">
                {selectedVenue.description || 'No description provided'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="mb-1 text-lg font-semibold text-content">
                Media Assets
              </h3>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-content-faint">Images Loaded:</span>
                <span className="text-right font-medium text-content">
                  {selectedVenue.images?.length || 0} / 4 Uploaded
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-2 flex gap-4">
              <a
                href={`/venue/edit/${selectedVenue.id}`}
                className={buttonClasses('secondary', 'md', 'flex-1')}
              >
                Optimize Card
              </a>
              {/* Styled disabled (not the disabled attribute) so the
                  click still fires the upgrade toast when tier-locked. */}
              <button
                data-testid="publish-toggle-button"
                aria-disabled={!selectedVenue.published && !canPublish}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-center font-semibold text-on-primary transition-colors duration-150 ${
                  !selectedVenue.published && !canPublish
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-primary-hover hover:shadow-glow-primary'
                }`}
                onClick={handleTogglePublish}
              >
                {!selectedVenue.published && !canPublish && (
                  <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
                )}
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
