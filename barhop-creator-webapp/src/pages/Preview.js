import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getVenuesByOwner, updateVenue } from '../firebase/venueService';
import VenueCardPreview from '../components/VenueCardPreview';
import { useError } from '../context/ErrorContext';
import { useSubscription } from '../hooks/useSubscription';

const labelClass =
  'text-xs font-semibold uppercase tracking-wider text-gray-400';

function Preview() {
  const { currentUser } = useAuth();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useError();
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

  // Convert venue data to match the new strict types.ts payload for the Preview Card
  const getVenuePreviewData = (venue) => {
    if (!venue) return null;

    return {
      title: venue.name,
      address: venue.address,
      phone: venue.phone || '',
      website: venue.website || '',
      category: venue.category || '', // Primary (legacy) category
      categories:
        venue.categories && venue.categories.length > 0
          ? venue.categories
          : venue.category
            ? [venue.category]
            : [],
      images: venue.images || [],
      video: venue.video || null,
      description: venue.description || '',
      socialLinks: venue.socialLinks || {
        instagram: '',
        facebook: '',
        tiktok: '',
      },
      hours: venue.hours || null,
    };
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
      alert(
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
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-surface-deep p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-accent"></div>
        <p className="text-sm text-gray-400">Loading your venues...</p>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-surface-deep p-12">
        <div className="max-w-md rounded-2xl border border-dashed border-white/20 bg-surface p-12 text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">
            No Venue Cards Yet
          </h2>
          <p className="mb-8 text-gray-500">
            Create your first venue card to see it here!
          </p>
          <a
            href="/venue/create"
            className="inline-block rounded-lg bg-accent px-5 py-2.5 font-semibold text-black transition hover:bg-accent-dim hover:shadow-glow-amber"
          >
            + Create Venue Card
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 gap-8 bg-surface-deep p-8 text-gray-100 max-lg:flex-col">
      {/* Left Side - Card Preview */}
      <div className="flex w-1/2 items-start justify-center max-lg:w-full">
        {selectedVenue && (
          <VenueCardPreview
            venueData={getVenuePreviewData(selectedVenue)}
            currentStep={4}
          />
        )}
      </div>

      {/* Right Side - Controls & Info */}
      <div className="flex w-1/2 flex-col gap-6 max-lg:w-full">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Active Card Preview
        </h1>

        {/* Venue Selector */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Switch Venue:</label>
          <select
            className="w-full rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm text-white outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/40"
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
          <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-surface-card p-8">
            <div className="flex flex-col gap-2">
              <h3 className="mb-1 text-lg font-semibold text-white">
                Basic Information
              </h3>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">Name:</span>
                <span className="text-right font-medium text-gray-200">
                  {selectedVenue.name}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">Address:</span>
                <span className="text-right font-medium text-gray-200">
                  {selectedVenue.address}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">Categories:</span>
                <span className="text-right font-medium capitalize text-gray-200">
                  {(selectedVenue.categories &&
                  selectedVenue.categories.length > 0
                    ? selectedVenue.categories.join(', ')
                    : selectedVenue.category) || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">Status:</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedVenue.published
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-accent/15 text-accent'
                  }`}
                >
                  {selectedVenue.published ? 'Live on App' : 'Draft Mode'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="mb-1 text-lg font-semibold text-white">
                Description
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">
                {selectedVenue.description || 'No description provided'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="mb-1 text-lg font-semibold text-white">
                Media Assets
              </h3>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-500">Images Loaded:</span>
                <span className="text-right font-medium text-gray-200">
                  {selectedVenue.images?.length || 0} / 4 Uploaded
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-2 flex gap-4">
              <a
                href={`/venue/edit/${selectedVenue.id}`}
                className="flex-1 rounded-lg border border-white/15 px-5 py-2.5 text-center font-semibold text-gray-200 transition hover:border-accent/60 hover:text-accent"
              >
                Optimize Card
              </a>
              {/* Styled disabled (not the disabled attribute) so the
                  click still fires the upgrade toast when tier-locked. */}
              <button
                data-testid="publish-toggle-button"
                aria-disabled={!selectedVenue.published && !canPublish}
                className={`flex-1 rounded-lg bg-accent px-5 py-2.5 text-center font-semibold text-black transition ${
                  !selectedVenue.published && !canPublish
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-accent-dim hover:shadow-glow-amber'
                }`}
                onClick={handleTogglePublish}
              >
                {selectedVenue.published
                  ? 'Unpublish Card'
                  : canPublish
                    ? 'Publish to App'
                    : '🔒 Publish to App'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Preview;
