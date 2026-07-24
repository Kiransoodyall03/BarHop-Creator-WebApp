import React, { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import FeatureLocked from '../components/FeatureLocked';
import { useError } from '../context/ErrorContext';
import { useSubscription } from '../hooks/useSubscription';
import {
  createReservation,
  getTonightReservations,
} from '../firebase/venueService';
import {
  BrandButton,
  BrandInput,
  BrandSpinner,
  Chip,
  chipClasses,
  PageHeading,
  PageShell,
  PANEL,
  PanelTitle,
  RING_SETS,
} from '../components/ui/Brand';

const STATUS_TONES = {
  Confirmed: 'success',
  Pending: 'warn',
};

// Believable guestlist shown (blurred) to locked tiers — pure FOMO
// props, never fetched from Firestore.
const SAMPLE_RESERVATIONS = [
  {
    id: 'sample-1',
    guestName: 'Thandi M.',
    partySize: 8,
    tableNumber: 'VIP 1',
    time: '21:00',
    status: 'Confirmed',
  },
  {
    id: 'sample-2',
    guestName: 'Sipho D.',
    partySize: 5,
    tableNumber: 'Booth 3',
    time: '21:30',
    status: 'Confirmed',
  },
  {
    id: 'sample-3',
    guestName: 'Lerato K.',
    partySize: 12,
    tableNumber: 'VIP 2',
    time: '22:00',
    status: 'Pending',
  },
  {
    id: 'sample-4',
    guestName: 'James V.',
    partySize: 4,
    tableNumber: 'Booth 1',
    time: '22:30',
    status: 'Confirmed',
  },
  {
    id: 'sample-5',
    guestName: 'Aisha P.',
    partySize: 6,
    tableNumber: 'Mezzanine',
    time: '23:00',
    status: 'Pending',
  },
];

const formatTime = (reservation) => {
  if (reservation.time) return reservation.time;
  const date = reservation.reservationDate;
  if (date instanceof Date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return '—';
};

function ReservationsPanel({ venueId, isLocked }) {
  const { showError } = useError();
  const [reservations, setReservations] = useState(
    isLocked ? SAMPLE_RESERVATIONS : []
  );
  const [loading, setLoading] = useState(!isLocked);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    guestName: '',
    partySize: '',
    tableNumber: '',
    time: '',
  });

  const fetchReservations = useCallback(async () => {
    // Locked tiers only ever see the static sample guestlist.
    if (isLocked || !venueId) return;
    try {
      setLoading(true);
      const rows = await getTonightReservations(venueId);
      setReservations(rows);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      showError('Failed to load reservations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isLocked, venueId, showError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReservations();
  }, [fetchReservations]);

  const updateForm = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAddReservation = async (e) => {
    e.preventDefault();
    if (!form.guestName || !form.partySize || !form.time) {
      showError('Guest name, party size and time are required.');
      return;
    }
    setSubmitting(true);
    try {
      const [hours, minutes] = form.time.split(':');
      const reservationDate = new Date();
      reservationDate.setHours(Number(hours), Number(minutes), 0, 0);

      await createReservation(venueId, {
        guestName: form.guestName,
        partySize: Number(form.partySize),
        tableNumber: form.tableNumber || 'Unassigned',
        reservationDate,
      });
      setForm({ guestName: '', partySize: '', tableNumber: '', time: '' });
      await fetchReservations();
    } catch (error) {
      console.error('Error creating reservation:', error);
      showError('Failed to add the reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className={PANEL}>
        <PanelTitle
          title="Tonight's Guestlist"
          actions={
            <Chip>
              {reservations.length} reservation
              {reservations.length === 1 ? '' : 's'}
            </Chip>
          }
        />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <BrandSpinner />
          </div>
        ) : reservations.length === 0 ? (
          <p className="py-10 text-center font-mono text-sm text-white/50">
            No reservations for tonight yet — add your first VIP booking below.
          </p>
        ) : (
          <ul data-testid="reservations-list" className="mt-6 flex flex-col">
            {reservations.map((reservation) => (
              <li
                key={reservation.id}
                data-testid={`reservation-row-${reservation.id}`}
                className="flex items-center justify-between gap-4 border-b border-white/10 py-3 font-mono text-sm last:border-b-0"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-bold text-white">
                    {reservation.guestName}
                  </span>
                  <span className="text-xs text-white/50">
                    Party of {reservation.partySize} ·{' '}
                    {reservation.tableNumber || 'Unassigned'}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-white/70">
                    {formatTime(reservation)}
                  </span>
                  <span
                    className={chipClasses(
                      STATUS_TONES[reservation.status] || 'neutral'
                    )}
                  >
                    {reservation.status || 'Pending'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        data-testid="add-reservation-form"
        onSubmit={handleAddReservation}
        className={PANEL}
      >
        <PanelTitle title="Add Reservation" />
        <div className="mt-5 grid grid-cols-4 gap-3 max-md:grid-cols-1">
          <BrandInput
            type="text"
            placeholder="Guest name"
            data-testid="reservation-guest-input"
            value={form.guestName}
            onChange={(e) => updateForm('guestName', e.target.value)}
          />
          <BrandInput
            type="number"
            min="1"
            placeholder="Party size"
            data-testid="reservation-party-input"
            value={form.partySize}
            onChange={(e) => updateForm('partySize', e.target.value)}
          />
          <BrandInput
            type="text"
            placeholder="Table (e.g. VIP 1)"
            data-testid="reservation-table-input"
            value={form.tableNumber}
            onChange={(e) => updateForm('tableNumber', e.target.value)}
          />
          <BrandInput
            type="time"
            data-testid="reservation-time-input"
            value={form.time}
            onChange={(e) => updateForm('time', e.target.value)}
          />
        </div>
        <BrandButton
          type="submit"
          data-testid="add-reservation-submit"
          disabled={submitting}
          className="mt-5"
        >
          {submitting ? 'Adding…' : 'Add to Guestlist'}
        </BrandButton>
      </form>
    </div>
  );
}

function Reservations() {
  const { activeVenue } = useOutletContext() || {};
  const { vipReservations } = useSubscription(
    activeVenue && activeVenue.subscriptionTier
  );

  return (
    <PageShell rings={RING_SETS.column} width="max-w-4xl">
      <PageHeading
        eyebrow="Front of House"
        title="VIP Reservations"
        description="Manage tonight's guestlist, lock in VIP tables, and protect your floor from no-shows."
      />

      {!activeVenue ? (
        <p
          data-testid="no-venue-notice"
          className={`${PANEL} font-mono text-sm text-white/70`}
        >
          Create your venue card first to start taking VIP reservations.{' '}
          <Link
            to="/venue/create"
            className="font-bold text-brand-orange hover:underline"
          >
            Create your venue
          </Link>
        </p>
      ) : (
        <FeatureLocked
          requiredTier="pro"
          featureName="VIP Table Management"
          description="Upgrade to Pro to manage guestlists, capture Paystack deposits, and lock in VIP tables before the rush."
        >
          <ReservationsPanel
            venueId={activeVenue.id}
            isLocked={!vipReservations}
          />
        </FeatureLocked>
      )}
    </PageShell>
  );
}

export default Reservations;
