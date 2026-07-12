import React, { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import FeatureLocked from '../components/FeatureLocked';
import { useError } from '../context/ErrorContext';
import { useSubscription } from '../hooks/useSubscription';
import {
  createReservation,
  getTonightReservations,
} from '../firebase/venueService';

const inputClass =
  'w-full rounded-lg border border-white/10 bg-surface px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/40';

const STATUS_CLASSES = {
  Confirmed: 'bg-emerald-500/15 text-emerald-400',
  Pending: 'bg-accent/15 text-accent',
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
      <div className="rounded-2xl border border-white/10 bg-surface-card p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">
            Tonight&apos;s Guestlist
          </h2>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
            {reservations.length} reservation
            {reservations.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-accent"></div>
          </div>
        ) : reservations.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            No reservations for tonight yet — add your first VIP booking below.
          </p>
        ) : (
          <ul data-testid="reservations-list" className="mt-6 flex flex-col">
            {reservations.map((reservation) => (
              <li
                key={reservation.id}
                data-testid={`reservation-row-${reservation.id}`}
                className="flex items-center justify-between gap-4 border-b border-white/5 py-3 text-sm last:border-b-0"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-gray-200">
                    {reservation.guestName}
                  </span>
                  <span className="text-xs text-gray-500">
                    Party of {reservation.partySize} ·{' '}
                    {reservation.tableNumber || 'Unassigned'}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-gray-400">
                    {formatTime(reservation)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      STATUS_CLASSES[reservation.status] ||
                      'bg-white/10 text-gray-300'
                    }`}
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
        className="rounded-2xl border border-white/10 bg-surface-card p-8"
      >
        <h2 className="text-lg font-semibold text-white">Add Reservation</h2>
        <div className="mt-4 grid grid-cols-4 gap-3 max-md:grid-cols-1">
          <input
            type="text"
            className={inputClass}
            placeholder="Guest name"
            data-testid="reservation-guest-input"
            value={form.guestName}
            onChange={(e) => updateForm('guestName', e.target.value)}
          />
          <input
            type="number"
            min="1"
            className={inputClass}
            placeholder="Party size"
            data-testid="reservation-party-input"
            value={form.partySize}
            onChange={(e) => updateForm('partySize', e.target.value)}
          />
          <input
            type="text"
            className={inputClass}
            placeholder="Table (e.g. VIP 1)"
            data-testid="reservation-table-input"
            value={form.tableNumber}
            onChange={(e) => updateForm('tableNumber', e.target.value)}
          />
          <input
            type="time"
            className={inputClass}
            data-testid="reservation-time-input"
            value={form.time}
            onChange={(e) => updateForm('time', e.target.value)}
          />
        </div>
        <button
          type="submit"
          data-testid="add-reservation-submit"
          disabled={submitting}
          className="mt-4 rounded-lg bg-accent px-6 py-2.5 font-semibold text-black transition hover:bg-accent-dim hover:shadow-glow-amber disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add to Guestlist'}
        </button>
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
    <main className="relative min-h-screen flex-1 overflow-hidden bg-surface-deep px-6 py-12 text-gray-100 lg:px-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-neon-violet/10 via-accent/5 to-transparent" />

      <div className="relative mx-auto max-w-4xl">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Front of House
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white">
            VIP Reservations
          </h1>
          <p className="mt-4 max-w-xl text-gray-400">
            Manage tonight&apos;s guestlist, lock in VIP tables, and protect
            your floor from no-shows.
          </p>
        </header>

        {!activeVenue ? (
          <div
            data-testid="no-venue-notice"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-gray-300"
          >
            Create your venue card first to start taking VIP reservations.{' '}
            <Link to="/venue/create" className="text-accent hover:underline">
              Create your venue
            </Link>
          </div>
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
      </div>
    </main>
  );
}

export default Reservations;
