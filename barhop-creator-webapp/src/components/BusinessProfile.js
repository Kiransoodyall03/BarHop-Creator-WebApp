import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import { updateBusinessProfile } from '../firebase/userService';
import {
  BrandButton,
  BrandInput,
  BrandLabel,
  PANEL,
  PanelTitle,
} from './ui/Brand';

// SARS VAT numbers are exactly 10 digits and always start with '4'.
const VAT_REGEX = /^4\d{9}$/;
// CIPC company registration numbers follow YYYY/NNNNNN/NN.
const CIPC_REGEX = /^\d{4}\/\d{6}\/\d{2}$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

function Field({
  label,
  testId,
  value,
  onChange,
  placeholder,
  help,
  error,
  type = 'text',
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <BrandLabel>{label}</BrandLabel>
      <BrandInput
        type={type}
        data-testid={testId}
        className={error ? 'border-brand-pink' : ''}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <p
          data-testid={`${testId}-error`}
          className="font-mono text-xs text-brand-pink"
        >
          {error}
        </p>
      ) : (
        help && <p className="font-mono text-xs text-white/45">{help}</p>
      )}
    </div>
  );
}

// Settings → Business Profile: the regulatory anchor form. Reads legacy
// wizard field names (registeredName/registrationNumber/vatNumber) as
// fallbacks and saves the canonical compliance fields going forward.
function BusinessProfile() {
  const { currentUser, refreshUser } = useAuth();
  const { showError, showSuccess } = useError();
  const profile = currentUser?.businessProfile || {};

  const [form, setForm] = useState({
    tradingName: profile.tradingName || '',
    phone: profile.phone || '',
    email: profile.email || '',
    website: profile.website || '',
    instagram: profile.instagram || '',
    registeredLegalName:
      profile.registeredLegalName || profile.registeredName || '',
    cipcRegistrationNumber:
      profile.cipcRegistrationNumber || profile.registrationNumber || '',
    sarsVatNumber: profile.sarsVatNumber || profile.vatNumber || '',
    informationOfficerName: profile.informationOfficerName || '',
    informationOfficerEmail: profile.informationOfficerEmail || '',
    informationOfficerPhone: profile.informationOfficerPhone || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const setField = (field) => (value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const next = {};
    if (!form.tradingName.trim()) {
      next.tradingName = 'Trading name is required.';
    }
    if (!form.registeredLegalName.trim()) {
      next.registeredLegalName = 'The CIPC registered entity name is required.';
    }
    if (
      form.cipcRegistrationNumber &&
      !CIPC_REGEX.test(form.cipcRegistrationNumber)
    ) {
      next.cipcRegistrationNumber =
        'Must match the CIPC format YYYY/NNNNNN/NN (e.g. 2019/123456/07).';
    }
    if (form.sarsVatNumber && !VAT_REGEX.test(form.sarsVatNumber)) {
      next.sarsVatNumber =
        'A SARS VAT number is exactly 10 digits and starts with 4.';
    }
    if (!form.informationOfficerName.trim()) {
      next.informationOfficerName =
        'An Information Officer is required under POPIA.';
    }
    if (!EMAIL_REGEX.test(form.informationOfficerEmail)) {
      next.informationOfficerEmail =
        'A valid Information Officer email is required.';
    }
    if (!form.informationOfficerPhone.trim()) {
      next.informationOfficerPhone =
        'An Information Officer phone number is required.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showError('Please fix the highlighted fields before saving.');
      return;
    }
    setSaving(true);
    try {
      await updateBusinessProfile(currentUser.uid, {
        ...profile,
        ...form,
        // Backend webhooks own this flag — never let a form save flip it.
        ficaVerified: profile.ficaVerified ?? false,
      });
      await refreshUser();
      showSuccess('Business profile saved.');
    } catch (err) {
      showError('Failed to save your business profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      data-testid="business-profile-form"
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
    >
      <section className={PANEL}>
        <PanelTitle
          title="Public Venue Information"
          subtitle="How your business presents to guests and on invoices."
        />
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="Trading Name"
            testId="bp-trading-name"
            value={form.tradingName}
            onChange={setField('tradingName')}
            placeholder="Neon Nights"
            error={errors.tradingName}
          />
          <Field
            label="Business Phone"
            testId="bp-phone"
            value={form.phone}
            onChange={setField('phone')}
            placeholder="+27 82 123 4567"
          />
          <Field
            label="Business Email"
            testId="bp-email"
            value={form.email}
            onChange={setField('email')}
            placeholder="hello@neonnights.co.za"
          />
          <Field
            label="Website"
            testId="bp-website"
            value={form.website}
            onChange={setField('website')}
            placeholder="https://neonnights.co.za"
          />
          <Field
            label="Instagram"
            testId="bp-instagram"
            value={form.instagram}
            onChange={setField('instagram')}
            placeholder="@neonnights"
          />
        </div>
      </section>

      <section className={PANEL}>
        <PanelTitle
          title="Corporate & Financial Identity (FICA)"
          subtitle="Statutory identity used for tax invoices, FICA verification, and POPIA/PAIA compliance."
        />
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field
            label="Registered Legal Name"
            testId="bp-legal-name"
            value={form.registeredLegalName}
            onChange={setField('registeredLegalName')}
            placeholder="Neon Nights Entertainment (Pty) Ltd"
            help="The entity name exactly as registered with the CIPC."
            error={errors.registeredLegalName}
          />
          <Field
            label="CIPC Registration Number"
            testId="bp-cipc"
            value={form.cipcRegistrationNumber}
            onChange={setField('cipcRegistrationNumber')}
            placeholder="2019/123456/07"
            help="Format: YYYY/NNNNNN/NN."
            error={errors.cipcRegistrationNumber}
          />
          <Field
            label="SARS VAT Number"
            testId="bp-vat"
            value={form.sarsVatNumber}
            onChange={setField('sarsVatNumber')}
            placeholder="4XXXXXXXXX"
            help="Your 10-digit VAT number is required to generate legally compliant tax invoices for your subscription."
            error={errors.sarsVatNumber}
          />
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <h3 className="font-display text-base font-bold text-white">
            Information Officer (POPIA / PAIA)
          </h3>
          <p className="mt-1 font-mono text-xs text-white/60">
            An Information Officer is required by law under the POPIA Act to
            handle data subject requests on behalf of your business.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <Field
              label="Full Name"
              testId="bp-io-name"
              value={form.informationOfficerName}
              onChange={setField('informationOfficerName')}
              placeholder="Thandi Mokoena"
              error={errors.informationOfficerName}
            />
            <Field
              label="Email"
              testId="bp-io-email"
              value={form.informationOfficerEmail}
              onChange={setField('informationOfficerEmail')}
              placeholder="privacy@neonnights.co.za"
              error={errors.informationOfficerEmail}
            />
            <Field
              label="Phone"
              testId="bp-io-phone"
              value={form.informationOfficerPhone}
              onChange={setField('informationOfficerPhone')}
              placeholder="+27 82 123 4567"
              error={errors.informationOfficerPhone}
            />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-4">
        <BrandButton
          type="submit"
          size="lg"
          data-testid="bp-save"
          disabled={saving}
          className="px-8"
        >
          {saving ? 'Saving…' : 'Save Business Profile'}
        </BrandButton>
      </div>
    </form>
  );
}

export default BusinessProfile;
