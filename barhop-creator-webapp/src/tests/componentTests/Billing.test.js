import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Billing from '../../components/Billing';
import { useAuth } from '../../context/AuthContext.js';
import { useError } from '../../context/ErrorContext.js';
import {
  cancelSubscription,
  getBillingOverview,
  getSubscriptionManageLink,
} from '../../firebase/subscriptionService.js';

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

jest.mock('../../context/AuthContext');
jest.mock('../../context/ErrorContext');
// Factory mock so the real module (which initializes Firebase at import
// time) never loads inside Jest.
jest.mock('../../firebase/subscriptionService', () => ({
  initializeSubscription: jest.fn(),
  getBillingOverview: jest.fn(),
  getSubscriptionManageLink: jest.fn(),
  cancelSubscription: jest.fn(),
}));

const mockUser = {
  uid: 'user123',
  paystackCustomerCode: 'CUS_abc123',
  businessProfile: { tradingName: 'Neon Nights' },
};

const proSubscription = {
  status: 'active',
  tier: 'pro',
  planName: 'BarHop Pro (Monthly)',
  interval: 'monthly',
  amountCents: 149700,
  currency: 'ZAR',
  nextPaymentDate: '2026-08-13T00:00:00.000Z',
  card: { brand: 'visa', last4: '4081', expMonth: '12', expYear: '2027' },
};

const awaitOverviewSettled = async () => {
  await waitFor(() =>
    expect(screen.queryByTestId('subscription-loading')).not.toBeInTheDocument()
  );
};

describe('Billing - self-serve billing portal', () => {
  const mockShowError = jest.fn();
  const mockShowSuccess = jest.fn();
  const originalOpen = window.open;

  beforeAll(() => {
    window.open = jest.fn();
  });

  afterAll(() => {
    window.open = originalOpen;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockOutletContext = {
      activeVenue: { id: 'venue-1', subscriptionTier: 'pro' },
    };
    useAuth.mockReturnValue({ currentUser: mockUser });
    useError.mockReturnValue({
      showError: mockShowError,
      showSuccess: mockShowSuccess,
    });
    getBillingOverview.mockResolvedValue({
      subscription: proSubscription,
      transactions: [],
    });
  });

  it('shows the active plan card with a feature recap', async () => {
    render(<Billing />);
    await awaitOverviewSettled();

    const card = screen.getByTestId('billing-current-plan');
    expect(card).toHaveTextContent('Pro Plan');
    expect(screen.getByTestId('billing-active-badge')).toHaveTextContent(
      'Active'
    );
    expect(card).toHaveTextContent('VIP Reservations & Guestlists');
    expect(card).toHaveTextContent('Deposit Capture via Paystack');
  });

  it('renders live subscription details from the overview', async () => {
    render(<Billing />);

    expect(await screen.findByTestId('subscription-status')).toHaveTextContent(
      'Active'
    );
    expect(screen.getByTestId('card-on-file')).toHaveTextContent(
      'visa •••• 4081'
    );
    expect(screen.getByTestId('subscription-next-payment')).toHaveTextContent(
      'R1,497'
    );
    expect(getBillingOverview).toHaveBeenCalledTimes(1);
  });

  it('opens the Paystack hosted page for card updates', async () => {
    getSubscriptionManageLink.mockResolvedValue({
      link: 'https://paystack.test/manage/abc',
    });
    render(<Billing />);

    fireEvent.click(await screen.findByTestId('update-card-button'));

    await waitFor(() =>
      expect(window.open).toHaveBeenCalledWith(
        'https://paystack.test/manage/abc',
        '_blank',
        'noopener'
      )
    );
  });

  it('cancels the subscription through the confirmation modal', async () => {
    cancelSubscription.mockResolvedValue({
      success: true,
      status: 'non-renewing',
    });
    render(<Billing />);

    fireEvent.click(await screen.findByTestId('cancel-subscription-button'));
    expect(screen.getByTestId('cancel-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cancel-modal-confirm'));

    await waitFor(() => expect(cancelSubscription).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByTestId('cancel-modal')).not.toBeInTheDocument()
    );
    expect(mockShowSuccess).toHaveBeenCalledWith(
      'Auto-renewal cancelled — you keep access until the end of your paid period.'
    );
    // Initial load + post-cancel refresh
    expect(getBillingOverview).toHaveBeenCalledTimes(2);
  });

  it('keeps the subscription when the modal is dismissed', async () => {
    render(<Billing />);

    fireEvent.click(await screen.findByTestId('cancel-subscription-button'));
    fireEvent.click(screen.getByTestId('cancel-modal-keep'));

    expect(screen.queryByTestId('cancel-modal')).not.toBeInTheDocument();
    expect(cancelSubscription).not.toHaveBeenCalled();
  });

  it('shows the non-renewing state without a cancel button', async () => {
    getBillingOverview.mockResolvedValue({
      subscription: { ...proSubscription, status: 'non-renewing' },
      transactions: [],
    });
    render(<Billing />);

    expect(await screen.findByTestId('subscription-status')).toHaveTextContent(
      'Cancelled — active until period end'
    );
    expect(screen.getByText('Access Until')).toBeInTheDocument();
    expect(
      screen.queryByTestId('cancel-subscription-button')
    ).not.toBeInTheDocument();
  });

  it('renders the billing history from recent transactions', async () => {
    getBillingOverview.mockResolvedValue({
      subscription: proSubscription,
      transactions: [
        {
          reference: 'ref_001',
          amountCents: 149700,
          currency: 'ZAR',
          paidAt: '2026-07-13T10:00:00.000Z',
          status: 'success',
          description: 'BarHop Pro (Monthly)',
        },
        {
          reference: 'ref_002',
          amountCents: 149700,
          currency: 'ZAR',
          paidAt: '2026-06-13T10:00:00.000Z',
          status: 'failed',
          description: 'BarHop Pro (Monthly)',
        },
      ],
    });
    render(<Billing />);

    expect(await screen.findByTestId('billing-history')).toBeInTheDocument();
    expect(screen.getByTestId('billing-tx-ref_001')).toHaveTextContent(
      'R1,497'
    );
    expect(screen.getByTestId('billing-tx-ref_001')).toHaveTextContent(
      'success'
    );
    expect(screen.getByTestId('billing-tx-ref_002')).toHaveTextContent(
      'failed'
    );
  });

  it('offers a retry when the overview lookup fails', async () => {
    getBillingOverview
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        subscription: proSubscription,
        transactions: [],
      });
    render(<Billing />);

    fireEvent.click(await screen.findByTestId('billing-retry'));

    expect(await screen.findByTestId('subscription-status')).toHaveTextContent(
      'Active'
    );
  });

  it('pre-fills the support mailto with full account context', async () => {
    render(<Billing />);
    await awaitOverviewSettled();

    const href = decodeURIComponent(
      screen.getByTestId('manage-billing-link').getAttribute('href')
    );
    expect(href).toContain('[Billing Request] Action Required - Neon Nights');
    expect(href).toContain('User ID: user123');
    expect(href).toContain('Venue ID: venue-1');
    expect(href).toContain('Current Plan: pro');
    expect(href).toContain('Customer Code: CUS_abc123');
  });

  it('skips the Paystack lookup for users without a customer code', async () => {
    useAuth.mockReturnValue({
      currentUser: { ...mockUser, paystackCustomerCode: null },
    });
    render(<Billing />);

    expect(getBillingOverview).not.toHaveBeenCalled();
    const href = decodeURIComponent(
      screen.getByTestId('manage-billing-link').getAttribute('href')
    );
    expect(href).toContain('Customer Code: N/A');
  });

  it('renders the matrix in upgrade mode for a subscribed venue', async () => {
    render(<Billing />);
    await awaitOverviewSettled();

    expect(screen.getByTestId('plan-cta-pro')).toBeDisabled();
    expect(screen.getByTestId('plan-cta-pro')).toHaveTextContent(
      'Current Plan'
    );
    expect(screen.getByTestId('plan-cta-enterprise')).toHaveTextContent(
      'Upgrade Now'
    );
  });

  it('shows the trial state with a plain matrix for unsubscribed venues', async () => {
    mockOutletContext = {
      activeVenue: { id: 'venue-1', subscriptionTier: 'trial' },
    };
    getBillingOverview.mockResolvedValue({
      subscription: null,
      transactions: [],
    });
    render(<Billing />);
    await awaitOverviewSettled();

    expect(screen.getByTestId('billing-current-plan')).toHaveTextContent(
      'Free Trial'
    );
    expect(
      screen.queryByTestId('billing-active-badge')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('plan-cta-pro')).toHaveTextContent('Choose Pro');
  });

  it('disables checkout and prompts venue creation without a venue', async () => {
    mockOutletContext = { activeVenue: null };
    getBillingOverview.mockResolvedValue({
      subscription: null,
      transactions: [],
    });
    render(<Billing />);
    await awaitOverviewSettled();

    expect(screen.getByText('Create your venue card')).toBeInTheDocument();
    expect(screen.getByTestId('plan-cta-starter')).toBeDisabled();
    expect(screen.getByTestId('plan-cta-pro')).toBeDisabled();
    expect(screen.getByTestId('plan-cta-enterprise')).toBeDisabled();
  });
});
