import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Reservations from '../../pages/Reservations.js';
import { useError } from '../../context/ErrorContext.js';
import {
  createReservation,
  getTonightReservations,
} from '../../firebase/venueService.js';

let mockOutletContext = { activeVenue: null };

jest.mock(
  'react-router-dom',
  () => ({
    Link: function MockLink({ children, to, ...rest }) {
      return (
        <a href={to} {...rest}>
          {children}
        </a>
      );
    },
    useOutletContext: () => mockOutletContext,
  }),
  { virtual: true }
);

jest.mock('../../context/ErrorContext');
// Factory mock so the real module (which initializes Firebase at import
// time) never loads inside Jest.
jest.mock('../../firebase/venueService', () => ({
  getTonightReservations: jest.fn(),
  createReservation: jest.fn(),
}));

describe('Reservations Page - Pro-gated VIP Table Management', () => {
  const mockShowError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useError.mockReturnValue({ showError: mockShowError });
    getTonightReservations.mockResolvedValue([]);
  });

  it('shows the create-venue notice when the user has no venue', () => {
    mockOutletContext = { activeVenue: null };
    render(<Reservations />);

    expect(screen.getByTestId('no-venue-notice')).toBeInTheDocument();
    expect(getTonightReservations).not.toHaveBeenCalled();
  });

  it('locks starter venues behind the blurred FOMO preview without fetching', () => {
    mockOutletContext = {
      activeVenue: { id: 'venue-1', subscriptionTier: 'starter' },
    };
    render(<Reservations />);

    expect(screen.getByTestId('feature-locked-overlay')).toBeInTheDocument();
    expect(screen.getByText('Unlock VIP Table Management')).toBeInTheDocument();
    expect(screen.getByTestId('feature-locked-upgrade')).toHaveAttribute(
      'href',
      '/plans'
    );
    // Sample guestlist renders under the blur; Firestore is never hit.
    expect(screen.getByText('Thandi M.')).toBeInTheDocument();
    expect(getTonightReservations).not.toHaveBeenCalled();
  });

  it('fetches and renders tonight’s reservations for pro venues', async () => {
    mockOutletContext = {
      activeVenue: { id: 'venue-1', subscriptionTier: 'pro' },
    };
    getTonightReservations.mockResolvedValue([
      {
        id: 'r1',
        guestName: 'Real Guest',
        partySize: 4,
        tableNumber: 'VIP 9',
        reservationDate: new Date('2026-07-13T21:30:00'),
        status: 'Confirmed',
      },
    ]);
    render(<Reservations />);

    expect(
      screen.queryByTestId('feature-locked-overlay')
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(getTonightReservations).toHaveBeenCalledWith('venue-1')
    );
    expect(await screen.findByText('Real Guest')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.queryByText('Thandi M.')).not.toBeInTheDocument();
  });

  it('shows the empty state when a pro venue has no reservations', async () => {
    mockOutletContext = {
      activeVenue: { id: 'venue-1', subscriptionTier: 'pro' },
    };
    render(<Reservations />);

    expect(
      await screen.findByText(/No reservations for tonight yet/i)
    ).toBeInTheDocument();
  });

  it('adds a reservation via the form and refetches', async () => {
    mockOutletContext = {
      activeVenue: { id: 'venue-1', subscriptionTier: 'pro' },
    };
    createReservation.mockResolvedValue('new-id');
    render(<Reservations />);
    await screen.findByText(/No reservations for tonight yet/i);

    fireEvent.change(screen.getByTestId('reservation-guest-input'), {
      target: { value: 'New Guest' },
    });
    fireEvent.change(screen.getByTestId('reservation-party-input'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByTestId('reservation-table-input'), {
      target: { value: 'Booth 7' },
    });
    fireEvent.change(screen.getByTestId('reservation-time-input'), {
      target: { value: '21:30' },
    });
    fireEvent.click(screen.getByTestId('add-reservation-submit'));

    await waitFor(() =>
      expect(createReservation).toHaveBeenCalledWith(
        'venue-1',
        expect.objectContaining({
          guestName: 'New Guest',
          partySize: 2,
          tableNumber: 'Booth 7',
          reservationDate: expect.any(Date),
        })
      )
    );
    // Initial load + post-create refresh
    await waitFor(() =>
      expect(getTonightReservations).toHaveBeenCalledTimes(2)
    );
  });

  it('validates required fields before writing', async () => {
    mockOutletContext = {
      activeVenue: { id: 'venue-1', subscriptionTier: 'pro' },
    };
    render(<Reservations />);
    await screen.findByText(/No reservations for tonight yet/i);

    fireEvent.click(screen.getByTestId('add-reservation-submit'));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        'Guest name, party size and time are required.'
      )
    );
    expect(createReservation).not.toHaveBeenCalled();
  });
});
