import React, { useState, useEffect, useCallback } from 'react';
import {
  LockClosedIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getVenuesByOwner, updateVenue } from '../firebase/venueService';
import VenueCardPreview from '../components/VenueCardPreview';
import { toPreviewData } from '../data/venuePreview';
import {
  BrandEmptyState,
  BrandLabel,
  BrandSelect,
  BrandSpinner,
  Chip,
  PageHeading,
  PageShell,
  PANEL,
  PanelTitle,
  RING_SETS,
  brandButton,
} from '../components/ui/Brand';
import { useError } from '../context/ErrorContext';
import { useSubscription } from '../hooks/useSubscription';

const DetailRow = ({ label, children }) => (
  <div className="flex justify-between gap-4 font-mono text-sm">
    <span className="text-white/50">{label}</span>
    <span className="text-right text-white/85">{children}</span>
  </div>
);

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
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-brand-ink p-12">
        <BrandSpinner />
        <p className="font-mono text-sm text-white/70">
          Loading your venues...
        </p>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <PageShell
        rings={RING_SETS.column}
        width="max-w-2xl"
        className="flex flex-col justify-center"
      >
        <BrandEmptyState
          icon={RectangleStackIcon}
          title="No Venue Cards Yet"
          description="Create your first venue card to see it here!"
          action={
            // Plain anchors, not <Link>: this page is unit-tested outside a
            // Router, and a full navigation is fine for both targets.
            <a href="/venue/create" className={brandButton('primary', 'lg')}>
              + Create Venue Card
            </a>
          }
        />
      </PageShell>
    );
  }

  const publishLocked = selectedVenue && !selectedVenue.published && !canPublish;

  return (
    <PageShell rings={RING_SETS.split} width="max-w-7xl">
      <PageHeading
        eyebrow="Live Card"
        title="Active Card Preview"
        description="Exactly what a group sees in the swipe deck. Switch venues to inspect each card, then publish when it's ready."
      />

      <div className="flex gap-8 max-lg:flex-col">
        {/* Left — the card itself */}
        <div className="flex w-1/2 items-start justify-center max-lg:w-full">
          {selectedVenue && (
            <VenueCardPreview
              venueData={toPreviewData(selectedVenue)}
              currentStep={4}
            />
          )}
        </div>

        {/* Right — controls & info */}
        <div className="flex w-1/2 flex-col gap-6 max-lg:w-full">
          <div className="flex flex-col gap-2">
            <BrandLabel htmlFor="venue-switcher">Switch Venue</BrandLabel>
            <BrandSelect
              id="venue-switcher"
              value={selectedVenue?.id || ''}
              onChange={handleVenueSelect}
            >
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} - {venue.published ? '(Live)' : '(Draft)'}
                </option>
              ))}
            </BrandSelect>
          </div>

          {selectedVenue && (
            <div className={`${PANEL} flex flex-col gap-6`}>
              <div className="flex flex-col gap-3">
                <PanelTitle title="Basic Information" />
                <DetailRow label="Name:">{selectedVenue.name}</DetailRow>
                <DetailRow label="Address:">{selectedVenue.address}</DetailRow>
                <DetailRow label="Categories:">
                  <span className="capitalize">
                    {(selectedVenue.categories &&
                    selectedVenue.categories.length > 0
                      ? selectedVenue.categories.join(', ')
                      : selectedVenue.category) || 'Not set'}
                  </span>
                </DetailRow>
                <div className="flex items-center justify-between gap-4 font-mono text-sm">
                  <span className="text-white/50">Status:</span>
                  <Chip tone={selectedVenue.published ? 'success' : 'warn'}>
                    {selectedVenue.published ? 'Live on App' : 'Draft Mode'}
                  </Chip>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <PanelTitle title="Description" />
                <p className="font-mono text-sm leading-relaxed text-white/70">
                  {selectedVenue.description || 'No description provided'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <PanelTitle title="Media Assets" />
                <DetailRow label="Images Loaded:">
                  {selectedVenue.images?.length || 0} / 4 Uploaded
                </DetailRow>
              </div>

              {/* Action Buttons */}
              <div className="mt-2 flex gap-4">
                <a
                  href={`/venue/edit/${selectedVenue.id}`}
                  className={brandButton('outline', 'md', 'flex-1')}
                >
                  Optimize Card
                </a>
                {/* Styled disabled (not the disabled attribute) so the
                    click still fires the upgrade toast when tier-locked. */}
                <button
                  type="button"
                  data-testid="publish-toggle-button"
                  aria-disabled={publishLocked}
                  className={brandButton(
                    'primary',
                    'md',
                    `flex-1 ${publishLocked ? 'cursor-not-allowed opacity-50 hover:brightness-100' : ''}`
                  )}
                  onClick={handleTogglePublish}
                >
                  {publishLocked && (
                    <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
                  )}
                  {selectedVenue.published
                    ? 'Unpublish Card'
                    : 'Publish to App'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default Preview;
