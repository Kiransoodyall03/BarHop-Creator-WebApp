import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GoogleButton from 'react-google-button';
import { CheckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import {
  registerWithEmail,
  loginWithGoogle,
  logout,
} from '../firebase/authService';
import {
  createUserDocument,
  saveBusinessProfile,
} from '../firebase/userService';
import { callCreatePaystackSubaccount } from '../firebase/venueService';
import { useAuth } from '../context/AuthContext';
import {
  AUTH_RINGS,
  CARD_LAYERS,
  FIELD,
  FIELD_LABEL,
  GradientLine,
  MarketingNav,
  MarketingPage,
  MarketingSection,
  OrDivider,
  OrbitRings,
  SectionCopy,
  SlabCard,
  marketingButton,
} from '../components/ui/Marketing';

// Public onboarding wizard, built from the Landing page's kit: white nav
// and footer bracketing a dark band, a centred copy block over gradient
// orbit rings, and the four-step form on a white slab card stacked over
// offset colour slabs. Centred rather than beside the copy because the
// business step's three-column address row needs the full column width.

const labelClass = FIELD_LABEL;
const inputClass = FIELD;
const sectionHeadingClass =
  'mt-2 border-b border-brand-hairline pb-2 font-display text-sm font-bold uppercase tracking-wider text-brand-pink';
const btnPrimaryClass = marketingButton('warm', 'lg');
const btnSecondaryClass = marketingButton('outline', 'lg');

// Paystack settlement bank codes for South Africa.
const SA_BANKS = [
  { code: '250655', name: 'FNB (First National Bank)' },
  { code: '051001', name: 'Standard Bank' },
  { code: '470010', name: 'Capitec Bank' },
  { code: '198765', name: 'Nedbank' },
  { code: '632005', name: 'Absa Bank' },
  { code: '580105', name: 'Investec' },
  { code: '430000', name: 'TymeBank' },
  { code: '679000', name: 'Discovery Bank' },
];

const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
];

const BUSINESS_ROLES = [
  'Owner',
  'Co-owner / Partner',
  'Director',
  'General Manager',
  'Marketing Manager',
  'Other',
];

const BUSINESS_CATEGORIES = [
  'Bar',
  'Nightclub',
  'Restaurant & Bar',
  'Pub / Tavern',
  'Cocktail Lounge',
  'Brewery / Taproom',
  'Wine Bar',
  'Other',
];

const LOCATION_COUNTS = ['1', '2-5', '6+'];
const CAPACITY_RANGES = ['Under 50', '50-150', '150-400', '400+'];

const STEPS = [
  { id: 'personal', label: 'Personal Details' },
  { id: 'owner', label: 'Owner Details' },
  { id: 'business', label: 'Business Details' },
  { id: 'verify', label: 'Verification' },
];

const initialForm = {
  // Personal (account)
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  // Owner
  ownerPhone: '',
  businessRole: '',
  // Business
  registeredName: '',
  tradingName: '',
  category: '',
  registrationNumber: '',
  vatNumber: '',
  yearEstablished: '',
  locationsCount: '1',
  capacity: '',
  businessPhone: '',
  businessEmail: '',
  website: '',
  instagram: '',
  street: '',
  city: '',
  province: '',
  postalCode: '',
  // Verification (Paystack subaccount)
  settlementBank: '',
  accountNumber: '',
};

const PHONE_PATTERN = /^\+?[0-9\s-]{9,15}$/;

function validateStep(stepId, form, hasAccount) {
  switch (stepId) {
    case 'personal': {
      if (hasAccount) return '';
      if (!form.firstName.trim() || !form.lastName.trim())
        return 'Please enter your first and last name.';
      if (!form.email.trim()) return 'Please enter your email address.';
      if (form.password.length < 8)
        return 'Password must be at least 8 characters.';
      if (form.password !== form.confirmPassword)
        return 'Passwords do not match.';
      return '';
    }
    case 'owner': {
      if (!PHONE_PATTERN.test(form.ownerPhone.trim()))
        return 'Please enter a valid phone number.';
      if (!form.businessRole) return 'Please select your role at the business.';
      return '';
    }
    case 'business': {
      if (!form.registeredName.trim())
        return 'Please enter your registered business name.';
      if (!form.category) return 'Please select a business category.';
      const year = Number(form.yearEstablished);
      const currentYear = new Date().getFullYear();
      if (!year || year < 1900 || year > currentYear)
        return `Please enter a valid year established (1900–${currentYear}).`;
      if (!form.street.trim() || !form.city.trim() || !form.province)
        return 'Please complete the business address.';
      if (!/^\d{4}$/.test(form.postalCode.trim()))
        return 'Please enter a valid 4-digit postal code.';
      return '';
    }
    case 'verify': {
      if (!form.settlementBank) return 'Please select your bank.';
      if (!/^\d{6,12}$/.test(form.accountNumber.trim()))
        return 'Please enter a valid account number (digits only).';
      return '';
    }
    default:
      return '';
  }
}

// Everything the dashboard/app can use later about this business, saved
// onto users/{uid} before verification runs.
function buildBusinessProfile(form) {
  return {
    phone: form.ownerPhone.trim(),
    businessRole: form.businessRole,
    businessProfile: {
      registeredName: form.registeredName.trim(),
      tradingName: form.tradingName.trim(),
      category: form.category,
      registrationNumber: form.registrationNumber.trim(),
      vatNumber: form.vatNumber.trim(),
      yearEstablished: Number(form.yearEstablished),
      locationsCount: form.locationsCount,
      capacity: form.capacity,
      phone: form.businessPhone.trim(),
      email: form.businessEmail.trim(),
      website: form.website.trim(),
      instagram: form.instagram.trim(),
      address: {
        street: form.street.trim(),
        city: form.city.trim(),
        province: form.province,
        postalCode: form.postalCode.trim(),
      },
    },
  };
}

// A signed-in but unverified owner (e.g. verification failed last
// session, or a Google sign-up) resumes the wizard with whatever they
// already saved prefilled.
function prefillFromUser(user) {
  if (!user) return initialForm;
  const bp = user.businessProfile || {};
  const addr = bp.address || {};
  return {
    ...initialForm,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    ownerPhone: user.phone || '',
    businessRole: user.businessRole || '',
    registeredName: bp.registeredName || '',
    tradingName: bp.tradingName || '',
    category: bp.category || '',
    registrationNumber: bp.registrationNumber || '',
    vatNumber: bp.vatNumber || '',
    yearEstablished: bp.yearEstablished ? String(bp.yearEstablished) : '',
    locationsCount: bp.locationsCount || initialForm.locationsCount,
    capacity: bp.capacity || '',
    businessPhone: bp.phone || '',
    businessEmail: bp.email || '',
    website: bp.website || '',
    instagram: bp.instagram || '',
    street: addr.street || '',
    city: addr.city || '',
    province: addr.province || '',
    postalCode: addr.postalCode || '',
  };
}

function friendlyError(err) {
  switch (err?.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 8 characters.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    default:
      break;
  }
  // httpsCallable surfaces an unreachable endpoint (e.g. the Functions
  // emulator not running) as a bare 'internal' error — translate it.
  if (err?.code === 'functions/internal' && err?.message === 'internal') {
    return (
      'Could not reach the verification service. If you are testing ' +
      'locally, start the emulator first: ' +
      'firebase emulators:start --only functions'
    );
  }
  return err?.message || 'Something went wrong. Please try again.';
}

function Field({ label, optional, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>
        {label}
        {optional && (
          <span className="ml-1 normal-case text-brand-hairline">
            (optional)
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function StepTabs({ currentStep, hasAccount, onStepClick }) {
  return (
    <div className="mt-8 flex items-center" data-testid="step-tabs">
      {STEPS.map((s, index) => {
        const isDone =
          index < currentStep || (s.id === 'personal' && hasAccount);
        const isActive = index === currentStep;
        // Only completed steps are clickable (never forward, and never
        // back to account creation once the account exists).
        const clickable =
          isDone && index < currentStep && !(s.id === 'personal' && hasAccount);
        return (
          <React.Fragment key={s.id}>
            {index > 0 && (
              <div
                className={`h-px flex-1 transition-colors ${
                  index <= currentStep ? 'bg-brand-pink' : 'bg-brand-hairline'
                }`}
              />
            )}
            <button
              type="button"
              data-testid={`step-tab-${s.id}`}
              onClick={() => clickable && onStepClick(index)}
              disabled={!clickable}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-xs font-bold transition ${
                isActive
                  ? 'text-brand-pink'
                  : isDone
                    ? 'text-brand-green'
                    : 'text-brand-hairline'
              } ${clickable ? 'cursor-pointer hover:bg-black/5' : 'cursor-default'}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                  isActive
                    ? 'border-transparent bg-brand-warm text-white'
                    : isDone
                      ? 'border-brand-green/60 bg-brand-green/10'
                      : 'border-brand-hairline'
                }`}
              >
                {isDone && !isActive ? (
                  <CheckIcon className="h-3.5 w-3.5" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="max-sm:hidden">{s.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Register() {
  const { currentUser } = useAuth();

  // A signed-in owner already has an account, so they resume at the
  // Owner Details step (AuthContext resolves before routes render, so
  // currentUser is stable by the time this mounts).
  const [step, setStep] = useState(currentUser ? 1 : 0);
  const [direction, setDirection] = useState('fwd');
  const [form, setForm] = useState(() => prefillFromUser(currentUser));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Set once the Firebase account exists mid-flow, so a failed
  // verification attempt can be retried without re-creating the account.
  const [createdUid, setCreatedUid] = useState(null);
  const [completed, setCompleted] = useState(false);

  const hasAccount = !!currentUser || !!createdUid;

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const goTo = (index) => {
    setError('');
    setDirection(index < step ? 'back' : 'fwd');
    setStep(index);
  };

  const handleNext = () => {
    const message = validateStep(STEPS[step].id, form, hasAccount);
    if (message) return setError(message);
    goTo(step + 1);
  };

  const handleBack = () => goTo(step - 1);

  const handleGoogle = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { user } = await loginWithGoogle();
      await createUserDocument(user);
      // Names/email come from the Google profile; if this account is
      // already verified the route guard redirects to the dashboard.
      setDirection('fwd');
      setStep(1);
    } catch (err) {
      console.error('Google sign-in error:', err.code, err.message);
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCreatedUid(null);
    setForm(initialForm);
    setStep(0);
    setError('');
  };

  const handleVerify = async () => {
    setError('');
    const message = validateStep('verify', form, hasAccount);
    if (message) return setError(message);

    setSubmitting(true);
    try {
      // 1. Ensure the Firebase account exists — createPaystackSubaccount
      //    is an authenticated callable, so this must happen first.
      let uid = currentUser?.uid ?? createdUid;
      if (!uid) {
        const { user } = await registerWithEmail(
          form.email.trim(),
          form.password
        );
        setCreatedUid(user.uid);
        await createUserDocument(user, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        });
        uid = user.uid;
      }

      // 2. Persist owner + business details (idempotent merge, safe to
      //    re-run when the user retries after a failed verification).
      await saveBusinessProfile(uid, buildBusinessProfile(form));

      // 3. Paystack validates the bank account synchronously; success
      //    flips users/{uid}.verificationStatus to VERIFIED and the
      //    route guard then moves us to the dashboard.
      const result = await callCreatePaystackSubaccount({
        businessName: form.registeredName.trim(),
        settlementBank: form.settlementBank,
        accountNumber: form.accountNumber.trim(),
      });
      if (!result?.success) {
        throw new Error('Verification failed. Please check your details.');
      }

      setForm((f) => ({ ...f, accountNumber: '' }));
      setCompleted(true);
    } catch (err) {
      console.error('Registration/verification error:', err.code, err.message);
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderPersonalStep = () => (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <Field label="First Name">
          <input
            className={inputClass}
            type="text"
            name="firstName"
            placeholder="Jane"
            value={form.firstName}
            onChange={handleChange}
            data-testid="first-name-input"
          />
        </Field>
        <Field label="Last Name">
          <input
            className={inputClass}
            type="text"
            name="lastName"
            placeholder="Doe"
            value={form.lastName}
            onChange={handleChange}
            data-testid="last-name-input"
          />
        </Field>
      </div>
      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          name="email"
          placeholder="jane@example.com"
          value={form.email}
          onChange={handleChange}
          data-testid="email-input"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <Field label="Password">
          <input
            className={inputClass}
            type="password"
            name="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={handleChange}
            data-testid="password-input"
          />
        </Field>
        <Field label="Confirm Password">
          <input
            className={inputClass}
            type="password"
            name="confirmPassword"
            placeholder="Repeat your password"
            value={form.confirmPassword}
            onChange={handleChange}
            data-testid="confirm-password-input"
          />
        </Field>
      </div>

      <div className="my-2">
        <OrDivider />
      </div>
      <div className="flex justify-center">
        <GoogleButton
          type="light"
          onClick={handleGoogle}
          disabled={submitting}
        />
      </div>
    </div>
  );

  const renderOwnerStep = () => (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-sm text-brand-muted">
        Tell us about you as the person responsible for this business.
        We&apos;ll use these details if we need to contact you about your
        venue or payouts.
      </p>
      <Field label="Mobile Number">
        <input
          className={inputClass}
          type="tel"
          name="ownerPhone"
          placeholder="+27 82 123 4567"
          value={form.ownerPhone}
          onChange={handleChange}
          data-testid="owner-phone-input"
        />
      </Field>
      <Field label="Your Role at the Business">
        <select
          className={inputClass}
          name="businessRole"
          value={form.businessRole}
          onChange={handleChange}
          data-testid="business-role-select"
        >
          <option value="" disabled>
            Select your role
          </option>
          {BUSINESS_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );

  const renderBusinessStep = () => (
    <div className="flex flex-col gap-4">
      <h3 className={sectionHeadingClass}>Identity</h3>
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <Field label="Registered Business Name">
          <input
            className={inputClass}
            type="text"
            name="registeredName"
            placeholder="e.g. Neon Nights Club (Pty) Ltd"
            value={form.registeredName}
            onChange={handleChange}
            data-testid="registered-name-input"
          />
        </Field>
        <Field label="Trading Name" optional>
          <input
            className={inputClass}
            type="text"
            name="tradingName"
            placeholder="If different from registered name"
            value={form.tradingName}
            onChange={handleChange}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <Field label="Category">
          <select
            className={inputClass}
            name="category"
            value={form.category}
            onChange={handleChange}
            data-testid="category-select"
          >
            <option value="" disabled>
              Select a category
            </option>
            {BUSINESS_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Year Established">
          <input
            className={inputClass}
            type="number"
            name="yearEstablished"
            placeholder="e.g. 2018"
            value={form.yearEstablished}
            onChange={handleChange}
            data-testid="year-established-input"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <Field label="CIPC Registration No." optional>
          <input
            className={inputClass}
            type="text"
            name="registrationNumber"
            placeholder="e.g. 2018/123456/07"
            value={form.registrationNumber}
            onChange={handleChange}
          />
        </Field>
        <Field label="VAT Number" optional>
          <input
            className={inputClass}
            type="text"
            name="vatNumber"
            placeholder="e.g. 4123456789"
            value={form.vatNumber}
            onChange={handleChange}
          />
        </Field>
      </div>

      <h3 className={sectionHeadingClass}>Contact &amp; Online Presence</h3>
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <Field label="Business Phone" optional>
          <input
            className={inputClass}
            type="tel"
            name="businessPhone"
            placeholder="+27 21 555 0100"
            value={form.businessPhone}
            onChange={handleChange}
          />
        </Field>
        <Field label="Business Email" optional>
          <input
            className={inputClass}
            type="email"
            name="businessEmail"
            placeholder="bookings@yourvenue.co.za"
            value={form.businessEmail}
            onChange={handleChange}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <Field label="Website" optional>
          <input
            className={inputClass}
            type="url"
            name="website"
            placeholder="https://yourvenue.co.za"
            value={form.website}
            onChange={handleChange}
          />
        </Field>
        <Field label="Instagram" optional>
          <input
            className={inputClass}
            type="text"
            name="instagram"
            placeholder="@yourvenue"
            value={form.instagram}
            onChange={handleChange}
          />
        </Field>
      </div>

      <h3 className={sectionHeadingClass}>Location</h3>
      <Field label="Street Address">
        <input
          className={inputClass}
          type="text"
          name="street"
          placeholder="12 Long Street"
          value={form.street}
          onChange={handleChange}
          data-testid="street-input"
        />
      </Field>
      <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
        <Field label="City">
          <input
            className={inputClass}
            type="text"
            name="city"
            placeholder="Cape Town"
            value={form.city}
            onChange={handleChange}
            data-testid="city-input"
          />
        </Field>
        <Field label="Province">
          <select
            className={inputClass}
            name="province"
            value={form.province}
            onChange={handleChange}
            data-testid="province-select"
          >
            <option value="" disabled>
              Select province
            </option>
            {SA_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Postal Code">
          <input
            className={inputClass}
            type="text"
            name="postalCode"
            placeholder="8001"
            value={form.postalCode}
            onChange={handleChange}
            data-testid="postal-code-input"
          />
        </Field>
      </div>

      <h3 className={sectionHeadingClass}>Scale</h3>
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <Field label="Number of Locations">
          <select
            className={inputClass}
            name="locationsCount"
            value={form.locationsCount}
            onChange={handleChange}
          >
            {LOCATION_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Venue Capacity" optional>
          <select
            className={inputClass}
            name="capacity"
            value={form.capacity}
            onChange={handleChange}
          >
            <option value="">Select capacity</option>
            {CAPACITY_RANGES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-sm text-brand-muted">
        To keep BarHop exclusive to real venue owners, we verify your
        business bank account through Paystack, our secure South African
        payments partner. Your details for{' '}
        <span className="font-display font-bold text-black">
          {form.registeredName || 'your business'}
        </span>{' '}
        are validated directly with your bank — this also enables payouts
        for future ticket sales.
      </p>
      <Field label="Bank">
        <select
          className={inputClass}
          name="settlementBank"
          value={form.settlementBank}
          onChange={handleChange}
          data-testid="bank-select"
        >
          <option value="" disabled>
            Select your bank
          </option>
          {SA_BANKS.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Business Account Number">
        <input
          className={inputClass}
          type="text"
          name="accountNumber"
          placeholder="Account Number"
          value={form.accountNumber}
          onChange={handleChange}
          data-testid="account-number-input"
        />
      </Field>
      <p className="font-mono text-xs text-brand-hairline">
        Your banking details are sent directly to Paystack and are never
        stored on BarHop servers.
      </p>
    </div>
  );

  const stepRenderers = [
    renderPersonalStep,
    renderOwnerStep,
    renderBusinessStep,
    renderVerifyStep,
  ];

  if (completed) {
    return (
      <MarketingPage nav={<MarketingNav links={[]} cta={null} />}>
        <MarketingSection tone="dark" className="flex justify-center">
          <OrbitRings rings={AUTH_RINGS.wide} />
          <div className="relative w-full max-w-md">
            <SlabCard
              layers={CARD_LAYERS.cool}
              className="text-center"
              data-testid="registration-complete"
            >
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-brand-green" />
              <h1 className="mt-4 font-display text-2xl font-bold text-black">
                Business Verified
              </h1>
              <p className="mt-2 font-mono text-sm text-brand-muted">
                Your bank account was confirmed through Paystack. Taking you to
                your dashboard…
              </p>
              <div
                role="status"
                aria-label="Loading"
                className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-2 border-brand-hairline border-t-brand-pink"
              />
            </SlabCard>
          </div>
        </MarketingSection>
      </MarketingPage>
    );
  }

  const isVerifyStep = STEPS[step].id === 'verify';
  const canGoBack = step > (currentUser || createdUid ? 1 : 0);

  return (
    <MarketingPage
      // Already on /register, so the nav drops its Get Started CTA.
      nav={<MarketingNav links={[{ label: 'Login', to: '/login' }]} cta={null} />}
    >
      <MarketingSection tone="dark">
        <OrbitRings rings={AUTH_RINGS.wide} />

        <div className="relative mx-auto flex max-w-3xl flex-col gap-12 sm:gap-16">
          <SectionCopy
            as="h1"
            tone="dark"
            variant="cool"
            center
            heading={
              <>
                Join as a
                <br />
                <GradientLine variant="cool">Venue Owner</GradientLine>
              </>
            }
          >
            BarHop is exclusive to verified business owners — set up your
            account and verify your venue in four quick steps.
          </SectionCopy>

          <SlabCard layers={CARD_LAYERS.cool}>
            {currentUser && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-hairline bg-[#F0F0F0] px-4 py-3 font-mono text-sm text-brand-muted">
                <span>
                  Completing registration as{' '}
                  <span className="font-display font-bold text-black">
                    {currentUser.email}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="font-display font-bold text-brand-pink hover:underline"
                >
                  Sign out
                </button>
              </div>
            )}

            <StepTabs
              currentStep={step}
              hasAccount={hasAccount}
              onStepClick={goTo}
            />

            {error && (
              <div
                className="mt-4 rounded-lg border border-brand-pink/50 bg-brand-pink/10 px-4 py-3 font-mono text-sm text-brand-pink"
                data-testid="register-error"
              >
                {error}
              </div>
            )}

            <form
              className="mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (isVerifyStep) handleVerify();
                else handleNext();
              }}
            >
              <div
                key={step}
                data-testid={`step-panel-${STEPS[step].id}`}
                className={
                  direction === 'back'
                    ? 'animate-step-back'
                    : 'animate-step-fwd'
                }
              >
                {stepRenderers[step]()}
              </div>

              <div className="mt-8 flex items-center justify-between gap-4">
                {canGoBack ? (
                  <button
                    type="button"
                    className={btnSecondaryClass}
                    onClick={handleBack}
                    disabled={submitting}
                    data-testid="back-button"
                  >
                    Back
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  className={btnPrimaryClass}
                  disabled={submitting}
                  data-testid={isVerifyStep ? 'verify-button' : 'next-button'}
                >
                  {isVerifyStep
                    ? submitting
                      ? 'Validating with your bank…'
                      : 'Verify & Finish'
                    : 'Continue'}
                </button>
              </div>
            </form>

            {!currentUser && (
              <p className="mt-6 text-center font-mono text-sm text-brand-muted">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-display font-bold text-brand-pink hover:underline"
                >
                  Sign in
                </Link>
              </p>
            )}
          </SlabCard>
        </div>
      </MarketingSection>
    </MarketingPage>
  );
}

export default Register;
