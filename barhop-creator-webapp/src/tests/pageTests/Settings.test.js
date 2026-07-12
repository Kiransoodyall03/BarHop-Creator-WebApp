import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Settings from '../../pages/Settings.js';
import { useAuth } from '../../context/AuthContext.js';

let mockOutletContext = { activeVenue: null };
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

jest.mock('../../context/AuthContext');
// The tab bodies pull in Firebase-backed services — stub them out; each
// has its own dedicated component test.
jest.mock(
  '../../components/BusinessProfile',
  () =>
    function MockBusinessProfile() {
      return <div data-testid="mock-business-profile-form" />;
    }
);
jest.mock(
  '../../components/Billing',
  () =>
    function MockBilling() {
      return <div data-testid="mock-billing" />;
    }
);

const baseProfile = {
  tradingName: 'Neon Nights',
  registeredLegalName: 'Neon Nights (Pty) Ltd',
  informationOfficerName: 'Thandi Mokoena',
  informationOfficerEmail: 'privacy@neon.co.za',
  informationOfficerPhone: '+27821234567',
  ficaVerified: false,
};

const mockUser = (profileOverrides = {}) => ({
  uid: 'user123',
  displayName: 'Jane Doe',
  email: 'jane@example.com',
  provider: 'email',
  businessRole: 'Owner',
  businessProfile: { ...baseProfile, ...profileOverrides },
});

describe('Settings - Compliance & Verification Hub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOutletContext = {
      activeVenue: { id: 'venue-1', categories: ['club'] },
    };
    mockSearchParams = new URLSearchParams();
    useAuth.mockReturnValue({ currentUser: mockUser() });
  });

  it('defaults to the General tab with account details', () => {
    render(<Settings />);

    expect(screen.getByTestId('account-card')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByTestId('verification-verified')).toBeInTheDocument();
  });

  it('opens the tab named in the ?tab= query param', () => {
    mockSearchParams = new URLSearchParams('tab=billing');
    render(<Settings />);

    expect(screen.getByTestId('mock-billing')).toBeInTheDocument();
  });

  it('switches to the Business Profile tab', () => {
    render(<Settings />);

    fireEvent.click(screen.getByTestId('settings-tab-business'));
    expect(
      screen.getByTestId('mock-business-profile-form')
    ).toBeInTheDocument();
  });

  it('renders ECTA, POPIA and ARB compliance content on the legal tab', () => {
    render(<Settings />);
    fireEvent.click(screen.getByTestId('settings-tab-legal'));

    // Section A — ECTA S43 platform disclosures
    expect(screen.getByText('ECTA Section 43 Disclosures')).toBeInTheDocument();
    expect(
      screen.getByText('BarHop Technologies (Pty) Ltd')
    ).toBeInTheDocument();

    // Section B — POPIA/PAIA with the registered Information Officer
    expect(screen.getByText('Thandi Mokoena')).toBeInTheDocument();
    expect(screen.getByTestId('paia-manual-link')).toBeInTheDocument();
    expect(screen.getByTestId('popia-deletion-link')).toHaveAttribute(
      'href',
      expect.stringContaining('POPIA')
    );

    // Section C — ARB alcohol code with the 15% height requirement
    expect(screen.getByTestId('arb-card')).toHaveTextContent('15%');
    expect(screen.getByTestId('arb-card')).toHaveTextContent(
      'ARB Alcohol Advertising Code'
    );
  });

  it('shows the amber FICA pending badge when unverified', () => {
    render(<Settings />);
    fireEvent.click(screen.getByTestId('settings-tab-legal'));

    expect(screen.getByTestId('fica-badge-pending')).toHaveTextContent(
      'Verification Pending — Action Required for Payouts'
    );
    expect(screen.queryByTestId('fica-badge-verified')).not.toBeInTheDocument();
  });

  it('shows the green FICA badge when verified', () => {
    useAuth.mockReturnValue({
      currentUser: mockUser({ ficaVerified: true }),
    });
    render(<Settings />);
    fireEvent.click(screen.getByTestId('settings-tab-legal'));

    expect(screen.getByTestId('fica-badge-verified')).toHaveTextContent(
      'Verified'
    );
  });

  it('renders the FPB X18 warning only for adult entertainment venues', () => {
    render(<Settings />);
    fireEvent.click(screen.getByTestId('settings-tab-legal'));
    expect(screen.queryByTestId('fpb-warning')).not.toBeInTheDocument();
  });

  it('renders the FPB X18 warning for adult entertainment venues', () => {
    mockOutletContext = {
      activeVenue: {
        id: 'venue-1',
        categories: ['club', 'adult entertainment'],
      },
    };
    render(<Settings />);
    fireEvent.click(screen.getByTestId('settings-tab-legal'));

    expect(screen.getByTestId('fpb-warning')).toHaveTextContent(
      'FPB X18 Verification Required'
    );
  });

  it('prompts for an Information Officer and deep-links to the profile tab', () => {
    useAuth.mockReturnValue({
      currentUser: mockUser({
        informationOfficerName: '',
        informationOfficerEmail: '',
        informationOfficerPhone: '',
      }),
    });
    render(<Settings />);
    fireEvent.click(screen.getByTestId('settings-tab-legal'));

    expect(screen.getByTestId('popia-missing')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Add one in your Business Profile'));
    expect(
      screen.getByTestId('mock-business-profile-form')
    ).toBeInTheDocument();
  });
});
