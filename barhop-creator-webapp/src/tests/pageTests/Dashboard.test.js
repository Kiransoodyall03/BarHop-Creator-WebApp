import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../../pages/Dashboard.js';
import { useAuth } from '../../context/AuthContext.js';
import { BrowserRouter } from 'react-router-dom';
import { useError } from '../../context/ErrorContext.js';
import { getVenuesByOwner } from '../../firebase/venueService.js';
import {
  getVenueAnalytics,
  aggregateAnalyticsSummary,
} from '../../firebase/analyticsService.js';

const mockNavigate = jest.fn();
jest.mock(
  'react-router-dom',
  () => ({
    BrowserRouter: function MockBrowserRouter({ children }) {
      return <div>{children}</div>;
    },
    useNavigate: () => mockNavigate,
    Link: function MockLink({ children, to }) {
      return <a href={to}>{children}</a>;
    },
    useLocation: () => ({ pathname: '/dashboard' }),
    Outlet: function MockOutlet() {
      return <div data-testid="outlet"></div>;
    },
  }),
  { virtual: true }
);

// Mock Contexts & Services
jest.mock('../../context/AuthContext');
jest.mock('../../context/ErrorContext');
jest.mock('../../firebase/venueService');
jest.mock('../../firebase/analyticsService');
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
}));
// Mock the VenueCardPreview to avoid complex drag/drop DOM event issues in Jest
jest.mock(
  '../../components/VenueCardPreview',
  () =>
    function MockVenueCardPreview() {
      return <div data-testid="mock-venue-preview">Card Preview</div>;
    }
);

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Dashboard Component - B2B Marketing UI', () => {
  const mockShowError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: { uid: 'user123' } });
    useError.mockReturnValue({ showError: mockShowError });
  });

  it('renders loading state initially', () => {
    // Delay resolution to test loading state
    getVenuesByOwner.mockReturnValue(new Promise(() => {}));

    renderWithRouter(<Dashboard />);
    expect(
      screen.getByText(/Loading marketing analytics/i)
    ).toBeInTheDocument();
  });

  it('renders empty state prompting venue creation if no venues exist', async () => {
    getVenuesByOwner.mockResolvedValueOnce([]); // User has no venues

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/No Venue Card Created/i)).toBeInTheDocument();
      expect(screen.getByText(/\+ Create Venue Card/i)).toBeInTheDocument();
    });
  });

  it('renders marketing metrics and funnel data when venue exists', async () => {
    // Mock Data Payload
    const mockVenues = [
      { id: 'venue123', name: 'Neon Nights Club', published: true },
    ];

    // Mock Analytics Logs (e.g. 7 days of data)
    const mockLogs = [
      {
        id: 'day1',
        swipedRight: 100,
        swipedLeft: 50,
        clickThroughs: 20,
        matchRate: 5,
        date: new Date(),
      },
    ];

    getVenuesByOwner.mockResolvedValueOnce(mockVenues);
    getVenueAnalytics.mockResolvedValueOnce(mockLogs);

    // Mock the summary aggregator that the Dashboard relies on
    aggregateAnalyticsSummary.mockReturnValueOnce({
      impressions: 150,
      swipedRight: 100,
      swipedLeft: 50,
      clickThroughs: 20,
      matchRate: 5,
    });

    renderWithRouter(<Dashboard />);

    // Wait for the Dashboard to finish loading
    await waitFor(() => {
      expect(screen.getByText('Neon Nights Club')).toBeInTheDocument();
    });

    expect(screen.getByText('Right Swipes (Likes)')).toBeInTheDocument();
    expect(screen.getAllByText('100')[0]).toBeInTheDocument();

    expect(screen.getByText('Left Swipes (Passes)')).toBeInTheDocument();
    expect(screen.getAllByText('50')[0]).toBeInTheDocument();

    expect(screen.getByText('Profile Expansions')).toBeInTheDocument();
    expect(screen.getAllByText('20')[0]).toBeInTheDocument();

    expect(screen.getByText('Group Matches')).toBeInTheDocument();
    expect(screen.getAllByText('5')[0]).toBeInTheDocument();

    // Check if Funnel & Preview rendered
    expect(screen.getByText('Discovery Funnel')).toBeInTheDocument();
    expect(screen.getByTestId('mock-venue-preview')).toBeInTheDocument();
  });

  it('triggers showError context on API failure', async () => {
    getVenuesByOwner.mockRejectedValueOnce(new Error('Firebase Error'));

    renderWithRouter(<Dashboard />);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        'Failed to load your marketing data.'
      );
    });
  });
});
