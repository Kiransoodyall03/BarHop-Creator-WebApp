import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FeatureLocked from '../../components/FeatureLocked';

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

describe('FeatureLocked - psychological upsell wrapper', () => {
  const childClick = jest.fn();

  const renderLocked = (props = {}) =>
    render(
      <FeatureLocked
        requiredTier="pro"
        featureName="VIP Table Management"
        {...props}
      >
        <button type="button" data-testid="premium-child" onClick={childClick}>
          Premium action
        </button>
      </FeatureLocked>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockOutletContext = {
      activeVenue: { id: 'venue-1', subscriptionTier: 'starter' },
    };
  });

  it('renders the padlock overlay with an Upgrade Now link when locked', () => {
    renderLocked();

    expect(screen.getByTestId('feature-locked-overlay')).toBeInTheDocument();
    expect(screen.getByText('Unlock VIP Table Management')).toBeInTheDocument();
    expect(screen.getByText(/Included in the Pro plan/i)).toBeInTheDocument();
    expect(screen.getByTestId('feature-locked-upgrade')).toHaveAttribute(
      'href',
      '/plans'
    );
  });

  it('makes the blurred children non-interactive when locked', () => {
    renderLocked();

    const content = screen.getByTestId('feature-locked-content');
    expect(content).toHaveAttribute('aria-hidden', 'true');
    expect(content.className).toContain('pointer-events-none');
    expect(content.className).toContain('blur-[8px]');
  });

  it('uses the custom description when provided', () => {
    renderLocked({ description: 'Capture deposits before the rush.' });
    expect(
      screen.getByText('Capture deposits before the rush.')
    ).toBeInTheDocument();
  });

  it('accepts capitalized requiredTier values', () => {
    renderLocked({ requiredTier: 'Pro' });
    expect(screen.getByTestId('feature-locked-overlay')).toBeInTheDocument();
  });

  it('renders children untouched when the tier has access', () => {
    mockOutletContext = {
      activeVenue: { id: 'venue-1', subscriptionTier: 'pro' },
    };
    renderLocked();

    expect(
      screen.queryByTestId('feature-locked-overlay')
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('premium-child'));
    expect(childClick).toHaveBeenCalled();
  });

  it('enterprise inherits pro access', () => {
    mockOutletContext = {
      activeVenue: { id: 'venue-1', subscriptionTier: 'enterprise' },
    };
    renderLocked();
    expect(
      screen.queryByTestId('feature-locked-overlay')
    ).not.toBeInTheDocument();
  });

  it('compact variant keeps children visible but captures clicks', () => {
    renderLocked({ variant: 'compact', featureName: 'Premium Card Styling' });

    expect(screen.getByTestId('feature-locked-compact')).toBeInTheDocument();
    expect(screen.getByText(/Pro feature/i)).toBeInTheDocument();
    expect(screen.getByTestId('feature-locked-upgrade')).toHaveAttribute(
      'href',
      '/plans'
    );

    fireEvent.click(screen.getByTestId('premium-child'));
    expect(childClick).not.toHaveBeenCalled();
  });
});
