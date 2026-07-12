import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BusinessProfile from '../../components/BusinessProfile';
import { useAuth } from '../../context/AuthContext.js';
import { useError } from '../../context/ErrorContext.js';
import { updateBusinessProfile } from '../../firebase/userService.js';

jest.mock('../../context/AuthContext');
jest.mock('../../context/ErrorContext');
// Factory mock so the real module (which initializes Firebase at import
// time) never loads inside Jest.
jest.mock('../../firebase/userService', () => ({
  updateBusinessProfile: jest.fn(),
}));

const setInput = (testId, value) =>
  fireEvent.change(screen.getByTestId(testId), { target: { value } });

describe('BusinessProfile - regulatory anchor form', () => {
  const mockShowError = jest.fn();
  const mockShowSuccess = jest.fn();
  const mockRefreshUser = jest.fn();

  const legacyProfile = {
    tradingName: 'Neon Nights',
    registeredName: 'Neon Nights Legacy (Pty) Ltd',
    registrationNumber: '2019/123456/07',
    vatNumber: '4123456789',
    category: 'Nightclub',
    ficaVerified: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    updateBusinessProfile.mockResolvedValue();
    useAuth.mockReturnValue({
      currentUser: { uid: 'user123', businessProfile: legacyProfile },
      refreshUser: mockRefreshUser,
    });
    useError.mockReturnValue({
      showError: mockShowError,
      showSuccess: mockShowSuccess,
    });
  });

  const fillInformationOfficer = () => {
    setInput('bp-io-name', 'Thandi Mokoena');
    setInput('bp-io-email', 'privacy@neon.co.za');
    setInput('bp-io-phone', '+27821234567');
  };

  it('seeds the form from legacy wizard field names', () => {
    render(<BusinessProfile />);

    expect(screen.getByTestId('bp-legal-name')).toHaveValue(
      'Neon Nights Legacy (Pty) Ltd'
    );
    expect(screen.getByTestId('bp-cipc')).toHaveValue('2019/123456/07');
    expect(screen.getByTestId('bp-vat')).toHaveValue('4123456789');
  });

  it('rejects a SARS VAT number that does not match ^4\\d{9}$', async () => {
    render(<BusinessProfile />);
    fillInformationOfficer();
    setInput('bp-vat', '1234567890');

    fireEvent.click(screen.getByTestId('bp-save'));

    expect(await screen.findByTestId('bp-vat-error')).toHaveTextContent(
      'exactly 10 digits and starts with 4'
    );
    expect(updateBusinessProfile).not.toHaveBeenCalled();
    expect(mockShowError).toHaveBeenCalled();
  });

  it('rejects a CIPC number outside the YYYY/NNNNNN/NN format', async () => {
    render(<BusinessProfile />);
    fillInformationOfficer();
    setInput('bp-cipc', '12345');

    fireEvent.click(screen.getByTestId('bp-save'));

    expect(await screen.findByTestId('bp-cipc-error')).toHaveTextContent(
      'YYYY/NNNNNN/NN'
    );
    expect(updateBusinessProfile).not.toHaveBeenCalled();
  });

  it('requires the POPIA Information Officer fields', async () => {
    render(<BusinessProfile />);

    fireEvent.click(screen.getByTestId('bp-save'));

    expect(await screen.findByTestId('bp-io-name-error')).toHaveTextContent(
      'POPIA'
    );
    expect(screen.getByTestId('bp-io-email-error')).toBeInTheDocument();
    expect(screen.getByTestId('bp-io-phone-error')).toBeInTheDocument();
    expect(updateBusinessProfile).not.toHaveBeenCalled();
  });

  it('saves canonical compliance fields and refreshes the user', async () => {
    render(<BusinessProfile />);
    fillInformationOfficer();
    setInput('bp-legal-name', 'Neon Nights Entertainment (Pty) Ltd');
    setInput('bp-vat', '4987654321');

    fireEvent.click(screen.getByTestId('bp-save'));

    await waitFor(() =>
      expect(updateBusinessProfile).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          tradingName: 'Neon Nights',
          registeredLegalName: 'Neon Nights Entertainment (Pty) Ltd',
          cipcRegistrationNumber: '2019/123456/07',
          sarsVatNumber: '4987654321',
          informationOfficerName: 'Thandi Mokoena',
          informationOfficerEmail: 'privacy@neon.co.za',
          informationOfficerPhone: '+27821234567',
          // The form must never flip the webhook-owned FICA flag.
          ficaVerified: false,
          // Untouched existing profile data is preserved.
          category: 'Nightclub',
        })
      )
    );
    expect(mockRefreshUser).toHaveBeenCalled();
    expect(mockShowSuccess).toHaveBeenCalledWith('Business profile saved.');
  });
});
