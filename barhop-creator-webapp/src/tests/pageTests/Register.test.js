import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '../../pages/Register.js';
import { useAuth } from '../../context/AuthContext.js';
import { registerWithEmail } from '../../firebase/authService.js';
import {
  createUserDocument,
  saveBusinessProfile,
} from '../../firebase/userService.js';
import { callCreatePaystackSubaccount } from '../../firebase/venueService.js';

jest.mock(
  'react-router-dom',
  () => ({
    Link: function MockLink({ children, to }) {
      return <a href={to}>{children}</a>;
    },
  }),
  { virtual: true }
);

jest.mock('react-google-button', () => ({
  __esModule: true,
  default: function MockGoogleButton({ onClick }) {
    return (
      <button type="button" data-testid="google-button" onClick={onClick}>
        Sign in with Google
      </button>
    );
  },
}));

jest.mock('../../context/AuthContext');
// Factory mocks so the real modules (which initialize Firebase at import
// time) never load inside Jest.
jest.mock('../../firebase/authService', () => ({
  registerWithEmail: jest.fn(),
  loginWithGoogle: jest.fn(),
  logout: jest.fn(),
}));
jest.mock('../../firebase/userService', () => ({
  createUserDocument: jest.fn(),
  saveBusinessProfile: jest.fn(),
}));
jest.mock('../../firebase/venueService', () => ({
  callCreatePaystackSubaccount: jest.fn(),
}));

const changeInput = (testId, value) =>
  fireEvent.change(screen.getByTestId(testId), { target: { value } });

const fillPersonalStep = () => {
  changeInput('first-name-input', 'Jane');
  changeInput('last-name-input', 'Doe');
  changeInput('email-input', 'jane@example.com');
  changeInput('password-input', 'password123');
  changeInput('confirm-password-input', 'password123');
};

const fillOwnerStep = () => {
  changeInput('owner-phone-input', '+27821234567');
  changeInput('business-role-select', 'Owner');
};

const fillBusinessStep = () => {
  changeInput('registered-name-input', 'Neon Nights Club (Pty) Ltd');
  changeInput('category-select', 'Nightclub');
  changeInput('year-established-input', '2018');
  changeInput('street-input', '12 Long Street');
  changeInput('city-input', 'Cape Town');
  changeInput('province-select', 'Western Cape');
  changeInput('postal-code-input', '8001');
};

const clickContinue = () => fireEvent.click(screen.getByTestId('next-button'));

describe('Register Page - Business Owner Onboarding Wizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: null });
  });

  it('starts on the personal details step with all four step tabs', () => {
    render(<Register />);

    expect(screen.getByTestId('step-panel-personal')).toBeInTheDocument();
    expect(screen.getByTestId('step-tab-personal')).toBeInTheDocument();
    expect(screen.getByTestId('step-tab-owner')).toBeInTheDocument();
    expect(screen.getByTestId('step-tab-business')).toBeInTheDocument();
    expect(screen.getByTestId('step-tab-verify')).toBeInTheDocument();
  });

  it('blocks advancing when passwords do not match', () => {
    render(<Register />);

    fillPersonalStep();
    changeInput('confirm-password-input', 'different');
    clickContinue();

    expect(screen.getByTestId('register-error')).toHaveTextContent(
      /Passwords do not match/i
    );
    expect(screen.getByTestId('step-panel-personal')).toBeInTheDocument();
  });

  it('walks forward and backward through the steps', () => {
    render(<Register />);

    fillPersonalStep();
    clickContinue();
    expect(screen.getByTestId('step-panel-owner')).toBeInTheDocument();

    fillOwnerStep();
    clickContinue();
    expect(screen.getByTestId('step-panel-business')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('back-button'));
    expect(screen.getByTestId('step-panel-owner')).toBeInTheDocument();
    // Values survive the round trip
    expect(screen.getByTestId('owner-phone-input')).toHaveValue(
      '+27821234567'
    );
  });

  it('requires business details before reaching verification', () => {
    render(<Register />);

    fillPersonalStep();
    clickContinue();
    fillOwnerStep();
    clickContinue();
    clickContinue(); // nothing filled in on the business step

    expect(screen.getByTestId('register-error')).toHaveTextContent(
      /registered business name/i
    );
    expect(screen.getByTestId('step-panel-business')).toBeInTheDocument();
  });

  it('creates the account, saves the profile and verifies via Paystack on finish', async () => {
    registerWithEmail.mockResolvedValueOnce({ user: { uid: 'new-user-1' } });
    createUserDocument.mockResolvedValueOnce();
    saveBusinessProfile.mockResolvedValueOnce();
    callCreatePaystackSubaccount.mockResolvedValueOnce({
      success: true,
      subaccountCode: 'ACCT_123',
    });

    render(<Register />);

    fillPersonalStep();
    clickContinue();
    fillOwnerStep();
    clickContinue();
    fillBusinessStep();
    clickContinue();

    expect(screen.getByTestId('step-panel-verify')).toBeInTheDocument();
    changeInput('bank-select', '470010');
    changeInput('account-number-input', '1234567890');
    fireEvent.click(screen.getByTestId('verify-button'));

    await waitFor(() => {
      expect(screen.getByTestId('registration-complete')).toBeInTheDocument();
    });

    expect(registerWithEmail).toHaveBeenCalledWith(
      'jane@example.com',
      'password123'
    );
    expect(createUserDocument).toHaveBeenCalledWith(
      { uid: 'new-user-1' },
      { firstName: 'Jane', lastName: 'Doe' }
    );
    expect(saveBusinessProfile).toHaveBeenCalledWith(
      'new-user-1',
      expect.objectContaining({
        phone: '+27821234567',
        businessRole: 'Owner',
        businessProfile: expect.objectContaining({
          registeredName: 'Neon Nights Club (Pty) Ltd',
          category: 'Nightclub',
          yearEstablished: 2018,
          address: expect.objectContaining({
            city: 'Cape Town',
            province: 'Western Cape',
            postalCode: '8001',
          }),
        }),
      })
    );
    expect(callCreatePaystackSubaccount).toHaveBeenCalledWith({
      businessName: 'Neon Nights Club (Pty) Ltd',
      settlementBank: '470010',
      accountNumber: '1234567890',
    });
  });

  it('surfaces a Paystack failure and stays on the verification step', async () => {
    registerWithEmail.mockResolvedValueOnce({ user: { uid: 'new-user-1' } });
    createUserDocument.mockResolvedValueOnce();
    saveBusinessProfile.mockResolvedValue();
    callCreatePaystackSubaccount.mockRejectedValueOnce(
      new Error('Could not resolve account name.')
    );

    render(<Register />);

    fillPersonalStep();
    clickContinue();
    fillOwnerStep();
    clickContinue();
    fillBusinessStep();
    clickContinue();
    changeInput('bank-select', '470010');
    changeInput('account-number-input', '1234567890');
    fireEvent.click(screen.getByTestId('verify-button'));

    await waitFor(() => {
      expect(screen.getByTestId('register-error')).toHaveTextContent(
        /Could not resolve account name/i
      );
    });
    expect(screen.getByTestId('step-panel-verify')).toBeInTheDocument();
    expect(screen.queryByTestId('registration-complete')).not.toBeInTheDocument();

    // Retrying must not create a second auth account
    callCreatePaystackSubaccount.mockResolvedValueOnce({ success: true });
    changeInput('account-number-input', '9876543210');
    fireEvent.click(screen.getByTestId('verify-button'));

    await waitFor(() => {
      expect(screen.getByTestId('registration-complete')).toBeInTheDocument();
    });
    expect(registerWithEmail).toHaveBeenCalledTimes(1);
  });

  it('resumes a signed-in but unverified owner at the owner details step', () => {
    useAuth.mockReturnValue({
      currentUser: {
        uid: 'user123',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        verificationStatus: 'UNVERIFIED',
      },
    });

    render(<Register />);

    expect(screen.getByTestId('step-panel-owner')).toBeInTheDocument();
    expect(
      screen.getByText(/Completing registration as/i)
    ).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });
});
