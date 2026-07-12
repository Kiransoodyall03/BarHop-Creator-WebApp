import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Preview from '../../pages/Preview.js';
import { useAuth } from '../../context/AuthContext.js';
import { useError } from '../../context/ErrorContext.js';
import { getVenuesByOwner, updateVenue } from '../../firebase/venueService.js';

jest.mock('../../context/AuthContext');
jest.mock('../../context/ErrorContext');
// Factory mock so the real module (which initializes Firebase at import
// time) never loads inside Jest.
jest.mock('../../firebase/venueService', () => ({
  getVenuesByOwner: jest.fn(),
  updateVenue: jest.fn(),
}));
// Avoid the preview card's drag/drop DOM event handling in Jest.
jest.mock(
  '../../components/VenueCardPreview',
  () =>
    function MockVenueCardPreview() {
      return <div data-testid="mock-venue-preview">Card Preview</div>;
    }
);

const buildVenue = (overrides = {}) => ({
  id: 'venue-1',
  name: 'Neon Nights',
  address: '12 Long Street',
  category: 'club',
  description: 'A club',
  images: [],
  published: false,
  subscriptionTier: 'trial',
  ...overrides,
});

describe('Preview Page - tier-gated publish toggle', () => {
  const mockShowError = jest.fn();

  beforeAll(() => {
    global.alert = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: { uid: 'user123' } });
    useError.mockReturnValue({ showError: mockShowError });
    updateVenue.mockResolvedValue();
  });

  const renderWithVenue = async (venue) => {
    // Stable array identity so Preview's refetch settles.
    const venues = [venue];
    getVenuesByOwner.mockResolvedValue(venues);
    render(<Preview />);
    await screen.findByTestId('publish-toggle-button');
  };

  it('blocks publishing on trial with the upgrade toast', async () => {
    await renderWithVenue(buildVenue());

    const button = screen.getByTestId('publish-toggle-button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveTextContent('🔒 Publish to App');

    fireEvent.click(button);

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        'You must subscribe to the Starter Plan to publish your venue to the consumer swipe deck.'
      )
    );
    expect(updateVenue).not.toHaveBeenCalled();
  });

  it('still allows a trial venue to unpublish', async () => {
    await renderWithVenue(buildVenue({ published: true }));

    const button = screen.getByTestId('publish-toggle-button');
    expect(button).toHaveTextContent('Unpublish Card');
    fireEvent.click(button);

    await waitFor(() =>
      expect(updateVenue).toHaveBeenCalledWith('venue-1', { published: false })
    );
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it('lets a starter venue publish', async () => {
    await renderWithVenue(buildVenue({ subscriptionTier: 'starter' }));

    const button = screen.getByTestId('publish-toggle-button');
    expect(button).toHaveAttribute('aria-disabled', 'false');
    expect(button).toHaveTextContent('Publish to App');
    fireEvent.click(button);

    await waitFor(() =>
      expect(updateVenue).toHaveBeenCalledWith('venue-1', { published: true })
    );
  });

  it('lets an enterprise venue publish', async () => {
    await renderWithVenue(buildVenue({ subscriptionTier: 'enterprise' }));

    fireEvent.click(screen.getByTestId('publish-toggle-button'));

    await waitFor(() =>
      expect(updateVenue).toHaveBeenCalledWith('venue-1', { published: true })
    );
  });
});
