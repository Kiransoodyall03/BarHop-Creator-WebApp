// Platform-level constants surfaced in compliance/billing UI.
//
// TODO: every value below is a PLACEHOLDER — replace with BarHop's real
// registered company details, support inbox, and hosted PAIA manual
// before launch. The ECTA Section 43 card in Settings renders these
// verbatim as statutory e-commerce disclosures.

export const SUPPORT_EMAIL = 'support@barhop.app';

export const PLATFORM_LEGAL = {
  providerName: 'BarHop Technologies (Pty) Ltd',
  cipcRegistrationNumber: '2024/000000/07',
  physicalAddress: '00 Placeholder Street, Sandton, Johannesburg, 2196',
  contactEmail: SUPPORT_EMAIL,
  disputeResolution:
    'Billing and service disputes are handled by our support desk within ' +
    '5 business days, per our Terms of Service. Unresolved disputes may be ' +
    'referred to the Consumer Goods & Services Ombud (CGSO).',
  paiaManualUrl: '/legal/paia-manual.pdf',
};
