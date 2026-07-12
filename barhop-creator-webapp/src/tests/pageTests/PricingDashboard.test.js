import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PricingDashboard from '../../pages/PricingDashboard.js';
import { useError } from '../../context/ErrorContext.js';
import { initializeSubscription } from '../../firebase/subscriptionService.js';

let mockOutletContext = { activeVenue: { id: 'venue-1' } };
let mockSearchParams = new URLSearchParams();

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
    useSearchParams: () => [mockSearchParams],
  }),
  { virtual: true }
);

jest.mock('../../context/ErrorContext');
// Factory mock so the real module (which initializes Firebase at import
// time) never loads inside Jest.
jest.mock('../../firebase/subscriptionService', () => ({
  initializeSubscription: jest.fn(),
}));

describe('PricingDashboard - 3-Tier Paystack Checkout', () => {
  const mockShowError = jest.fn();
  const originalLocation = window.location;

  beforeAll(() => {
    delete window.location;
    window.location = { href: '', origin: 'http://localhost' };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = '';
    mockOutletContext = { activeVenue: { id: 'venue-1' } };
    mockSearchParams = new URLSearchParams();
    useError.mockReturnValue({ showError: mockShowError });
  });

  it('renders all three tiers and defaults to annual billing', () => {
    render(<PricingDashboard />);

    expect(screen.getByTestId('plan-card-starter')).toBeInTheDocument();
    expect(screen.getByTestId('plan-card-pro')).toBeInTheDocument();
    expect(screen.getByTestId('plan-card-enterprise')).toBeInTheDocument();

    expect(screen.getByTestId('billing-toggle-annual')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByTestId('billing-toggle-monthly')).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    // Annual view shows monthly-equivalent heroes + annual totals
    expect(screen.getByText('R414')).toBeInTheDocument();
    expect(screen.getByText('R1,248')).toBeInTheDocument();
    expect(screen.getByText('R2,914')).toBeInTheDocument();
    expect(screen.getByText(/R4,970\/yr/)).toBeInTheDocument();
    expect(screen.getByText(/R14,970\/yr/)).toBeInTheDocument();
    expect(screen.getByText(/R34,970\/yr/)).toBeInTheDocument();
    expect(screen.getByText('2 Months Free')).toBeInTheDocument();
  });

  it('switches to monthly prices when the toggle is clicked', () => {
    render(<PricingDashboard />);

    fireEvent.click(screen.getByTestId('billing-toggle-monthly'));

    expect(screen.getByTestId('billing-toggle-monthly')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByText('R497')).toBeInTheDocument();
    expect(screen.getByText('R1,497')).toBeInTheDocument();
    expect(screen.getByText('R3,497')).toBeInTheDocument();
    expect(screen.getAllByText('Billed monthly')).toHaveLength(3);
  });

  it('highlights the Pro tier with the Most Popular badge', () => {
    render(<PricingDashboard />);

    const proCard = screen.getByTestId('plan-card-pro');
    expect(proCard).toHaveTextContent('Most Popular');
    expect(screen.getByTestId('plan-card-starter')).not.toHaveTextContent(
      'Most Popular'
    );
  });

  it('lists every feature for each tier', () => {
    render(<PricingDashboard />);

    [
      'Basic Venue Card (3 HD Images)',
      'Standard Swipe Injection',
      'Basic Marketing Analytics',
      'Unlimited Staff Logins',
      'Premium Venue Card (7s Video)',
      'Standout Swipe Priority',
      'VIP Reservations & Guestlists',
      'Deposit Capture via Paystack',
      'Match-to-Visit Analytics',
      'Everything in Pro',
      'Staff Payout Automation',
      'Deep Demographic Heatmaps',
      'Full Revenue & RevPASH Analytics',
      'Multi-Venue Group Linking',
    ].forEach((feature) => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });

  it('starts an annual Pro checkout and redirects to Paystack', async () => {
    let resolveCheckout;
    initializeSubscription.mockReturnValue(
      new Promise((resolve) => {
        resolveCheckout = resolve;
      })
    );
    render(<PricingDashboard />);

    fireEvent.click(screen.getByTestId('plan-cta-pro'));

    expect(initializeSubscription).toHaveBeenCalledWith({
      tier: 'pro',
      interval: 'annual',
      venueId: 'venue-1',
    });
    expect(screen.getByTestId('plan-cta-pro')).toHaveTextContent(
      'Redirecting…'
    );
    expect(screen.getByTestId('plan-cta-starter')).toBeDisabled();
    expect(screen.getByTestId('plan-cta-enterprise')).toBeDisabled();

    resolveCheckout({ success: true, url: 'https://paystack.test/checkout' });
    await waitFor(() =>
      expect(window.location.href).toBe('https://paystack.test/checkout')
    );
  });

  it('sends the monthly plan when the toggle is on monthly', async () => {
    initializeSubscription.mockResolvedValue({
      success: true,
      url: 'https://paystack.test/checkout',
    });
    render(<PricingDashboard />);

    fireEvent.click(screen.getByTestId('billing-toggle-monthly'));
    fireEvent.click(screen.getByTestId('plan-cta-starter'));

    await waitFor(() =>
      expect(initializeSubscription).toHaveBeenCalledWith({
        tier: 'starter',
        interval: 'monthly',
        venueId: 'venue-1',
      })
    );
  });

  it('disables checkout and shows a notice when the user has no venue', () => {
    mockOutletContext = { activeVenue: null };
    render(<PricingDashboard />);

    expect(screen.getByTestId('no-venue-notice')).toBeInTheDocument();
    expect(screen.getByTestId('plan-cta-starter')).toBeDisabled();
    expect(screen.getByTestId('plan-cta-pro')).toBeDisabled();
    expect(screen.getByTestId('plan-cta-enterprise')).toBeDisabled();
    expect(initializeSubscription).not.toHaveBeenCalled();
  });

  it('shows an error toast and re-enables buttons when checkout fails', async () => {
    initializeSubscription.mockRejectedValue(new Error('Paystack is down'));
    render(<PricingDashboard />);

    fireEvent.click(screen.getByTestId('plan-cta-pro'));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith('Paystack is down')
    );
    expect(screen.getByTestId('plan-cta-pro')).not.toBeDisabled();
    expect(screen.getByTestId('plan-cta-pro')).toHaveTextContent('Choose Pro');
    expect(window.location.href).toBe('');
  });

  it('shows the success banner after returning from checkout', () => {
    mockSearchParams = new URLSearchParams('checkout=success');
    render(<PricingDashboard />);

    expect(screen.getByText(/Subscription activated/)).toBeInTheDocument();
  });

  describe('Active Subscription view', () => {
    it('still shows the pricing matrix for trial venues', () => {
      mockOutletContext = {
        activeVenue: { id: 'venue-1', subscriptionTier: 'trial' },
      };
      render(<PricingDashboard />);

      expect(
        screen.queryByTestId('active-subscription-view')
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('plan-cta-pro')).toHaveTextContent(
        'Choose Pro'
      );
    });

    it('renders the active view instead of the matrix for a paid tier', () => {
      mockOutletContext = {
        activeVenue: { id: 'venue-1', subscriptionTier: 'pro' },
      };
      render(<PricingDashboard />);

      expect(
        screen.getByTestId('active-subscription-view')
      ).toBeInTheDocument();
      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
      expect(screen.getByTestId('active-badge')).toHaveTextContent('Active');
      expect(
        screen.getByText('Premium Venue Card (7s Video)')
      ).toBeInTheDocument();
      expect(screen.getByText('Match-to-Visit Analytics')).toBeInTheDocument();
      expect(screen.getByTestId('upgrade-plan-button')).toHaveTextContent(
        'Upgrade Plan'
      );
      expect(screen.getByTestId('manage-billing-button')).toHaveAttribute(
        'href',
        '/settings?tab=billing'
      );
      expect(screen.queryByTestId('plan-cta-pro')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('billing-toggle-annual')
      ).not.toBeInTheDocument();
    });

    it('enters upgrade mode with tier-aware buttons and exits via back', () => {
      mockOutletContext = {
        activeVenue: { id: 'venue-1', subscriptionTier: 'pro' },
      };
      render(<PricingDashboard />);

      fireEvent.click(screen.getByTestId('upgrade-plan-button'));

      expect(screen.getByTestId('plan-cta-pro')).toBeDisabled();
      expect(screen.getByTestId('plan-cta-pro')).toHaveTextContent(
        'Current Plan'
      );
      expect(screen.getByTestId('plan-cta-starter')).toBeDisabled();
      expect(screen.getByTestId('plan-cta-starter')).toHaveTextContent(
        'Downgrade'
      );
      expect(screen.getByTestId('plan-cta-enterprise')).not.toBeDisabled();
      expect(screen.getByTestId('plan-cta-enterprise')).toHaveTextContent(
        'Upgrade Now'
      );

      fireEvent.click(screen.getByTestId('back-to-dashboard-button'));
      expect(
        screen.getByTestId('active-subscription-view')
      ).toBeInTheDocument();
      expect(screen.queryByTestId('plan-cta-pro')).not.toBeInTheDocument();
    });

    it('starts checkout for a higher tier from upgrade mode', async () => {
      mockOutletContext = {
        activeVenue: { id: 'venue-1', subscriptionTier: 'pro' },
      };
      initializeSubscription.mockResolvedValue({
        success: true,
        url: 'https://paystack.test/upgrade',
      });
      render(<PricingDashboard />);

      fireEvent.click(screen.getByTestId('upgrade-plan-button'));
      fireEvent.click(screen.getByTestId('plan-cta-enterprise'));

      await waitFor(() =>
        expect(initializeSubscription).toHaveBeenCalledWith({
          tier: 'enterprise',
          interval: 'annual',
          venueId: 'venue-1',
        })
      );
      await waitFor(() =>
        expect(window.location.href).toBe('https://paystack.test/upgrade')
      );
    });

    it('labels the primary action View All Plans on the top tier', () => {
      mockOutletContext = {
        activeVenue: { id: 'venue-1', subscriptionTier: 'enterprise' },
      };
      render(<PricingDashboard />);

      expect(screen.getByTestId('upgrade-plan-button')).toHaveTextContent(
        'View All Plans'
      );

      fireEvent.click(screen.getByTestId('upgrade-plan-button'));
      expect(screen.getByTestId('plan-cta-enterprise')).toHaveTextContent(
        'Current Plan'
      );
      expect(screen.getByTestId('plan-cta-starter')).toHaveTextContent(
        'Downgrade'
      );
      expect(screen.getByTestId('plan-cta-pro')).toHaveTextContent('Downgrade');
      expect(screen.getByTestId('plan-cta-pro')).toBeDisabled();
    });
  });
});
