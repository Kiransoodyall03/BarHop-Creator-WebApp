import React from 'react';
import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL, PLATFORM_LEGAL } from '../data/platform';

// Public, standalone legal page served at /privacy.
//
// Intentionally NOT wired into the Neon Sunset theme tokens: this policy
// must read as a plain, professional, black-and-white document regardless
// of the app's light/dark accent styling, so it uses explicit neutral
// gray/black/white classes only.

const LAST_UPDATED = 'July 19, 2026';

const SECTIONS = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'information-we-collect', title: '2. Information We Collect' },
  { id: 'how-we-use', title: '3. How We Use Your Information' },
  { id: 'legal-basis', title: '4. Legal Basis for Processing' },
  { id: 'sharing', title: '5. How We Share Information' },
  { id: 'retention', title: '6. Data Retention' },
  { id: 'security', title: '7. Data Security' },
  { id: 'your-rights', title: '8. Your Rights' },
  { id: 'children', title: '9. Children’s Privacy' },
  { id: 'international', title: '10. International Transfers' },
  { id: 'changes', title: '11. Changes to This Policy' },
  { id: 'contact', title: '12. Contact Us' },
];

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mt-12 text-xl font-semibold text-black">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-gray-700">
        {children}
      </div>
    </section>
  );
}

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-gray-700">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-black"
          >
            BarHop
          </Link>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
            Legal
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24">
        {/* Title block */}
        <div className="border-b border-gray-200 py-12">
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-gray-500">
            Last updated: {LAST_UPDATED}
          </p>
          <p className="mt-6 text-[15px] leading-7 text-gray-700">
            This Privacy Policy explains how {PLATFORM_LEGAL.providerName}
            {' '}(“BarHop”, “we”, “us”, or “our”) collects, uses, and protects
            your personal information when you use the BarHop mobile
            application and related services (collectively, the “Service”).
          </p>
        </div>

        {/* Table of contents */}
        <nav aria-label="Table of contents" className="py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            Contents
          </p>
          <ol className="mt-4 space-y-2 text-[15px]">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-gray-600 underline-offset-4 transition hover:text-black hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Section id="introduction" title="1. Introduction">
          <p>
            We are committed to protecting your privacy and handling your
            personal information responsibly and transparently. This policy
            applies to all users of the BarHop mobile application. By
            downloading, accessing, or using the Service, you acknowledge that
            you have read and understood this Privacy Policy.
          </p>
          <p>
            We process personal information in accordance with the Protection
            of Personal Information Act, 2013 (“POPIA”) and other applicable
            data-protection laws.
          </p>
        </Section>

        <Section id="information-we-collect" title="2. Information We Collect">
          <p>We collect the following categories of information:</p>
          <h3 className="pt-2 text-base font-semibold text-black">
            Information you provide to us
          </h3>
          <ul className="list-disc space-y-2 pl-5 marker:text-gray-400">
            <li>
              <span className="font-medium text-gray-900">Account data</span> —
              name, email address, phone number, and password when you create
              an account.
            </li>
            <li>
              <span className="font-medium text-gray-900">Profile data</span> —
              optional details such as a profile photo, date of birth, and
              preferences.
            </li>
            <li>
              <span className="font-medium text-gray-900">
                Bookings &amp; reservations
              </span>{' '}
              — venues, tables, events, and party details you reserve or
              interact with.
            </li>
            <li>
              <span className="font-medium text-gray-900">
                Payment information
              </span>{' '}
              — processed securely by our third-party payment provider. We do
              not store full card numbers on our servers.
            </li>
            <li>
              <span className="font-medium text-gray-900">Communications</span>{' '}
              — messages, feedback, and support requests you send us.
            </li>
          </ul>

          <h3 className="pt-2 text-base font-semibold text-black">
            Information collected automatically
          </h3>
          <ul className="list-disc space-y-2 pl-5 marker:text-gray-400">
            <li>
              <span className="font-medium text-gray-900">Device data</span> —
              device model, operating system, unique device identifiers, and
              app version.
            </li>
            <li>
              <span className="font-medium text-gray-900">Usage data</span> —
              features used, pages viewed, and interactions within the app.
            </li>
            <li>
              <span className="font-medium text-gray-900">
                Location data
              </span>{' '}
              — with your permission, approximate or precise location to help
              you discover nearby venues. You can disable this at any time in
              your device settings.
            </li>
            <li>
              <span className="font-medium text-gray-900">Log data</span> — IP
              address, access times, and diagnostic information.
            </li>
          </ul>
        </Section>

        <Section id="how-we-use" title="3. How We Use Your Information">
          <p>We use your personal information to:</p>
          <ul className="list-disc space-y-2 pl-5 marker:text-gray-400">
            <li>Provide, operate, and maintain the Service.</li>
            <li>
              Process bookings, reservations, and payments, and send related
              confirmations.
            </li>
            <li>
              Personalize your experience and recommend relevant venues and
              events.
            </li>
            <li>
              Communicate with you about your account, updates, and support
              enquiries.
            </li>
            <li>
              Send marketing communications where you have consented (you may
              opt out at any time).
            </li>
            <li>
              Detect, prevent, and address fraud, abuse, and security issues.
            </li>
            <li>Comply with legal obligations and enforce our terms.</li>
          </ul>
        </Section>

        <Section id="legal-basis" title="4. Legal Basis for Processing">
          <p>
            We process your personal information where we have a lawful basis
            to do so, including: your consent; the performance of a contract
            with you; compliance with a legal obligation; the protection of
            your legitimate interests or those of a third party; and our own
            legitimate business interests, balanced against your rights.
          </p>
        </Section>

        <Section id="sharing" title="5. How We Share Information">
          <p>
            We do not sell your personal information. We share it only in the
            following circumstances:
          </p>
          <ul className="list-disc space-y-2 pl-5 marker:text-gray-400">
            <li>
              <span className="font-medium text-gray-900">Venues</span> — when
              you make a booking, we share the details necessary to fulfil your
              reservation with the relevant venue.
            </li>
            <li>
              <span className="font-medium text-gray-900">
                Service providers
              </span>{' '}
              — trusted partners who perform services on our behalf, such as
              payment processing, cloud hosting, and analytics, under
              confidentiality obligations.
            </li>
            <li>
              <span className="font-medium text-gray-900">
                Legal &amp; safety
              </span>{' '}
              — where required by law, regulation, legal process, or to protect
              the rights, property, or safety of BarHop, our users, or others.
            </li>
            <li>
              <span className="font-medium text-gray-900">
                Business transfers
              </span>{' '}
              — in connection with a merger, acquisition, or sale of assets,
              subject to this policy.
            </li>
          </ul>
        </Section>

        <Section id="retention" title="6. Data Retention">
          <p>
            We retain your personal information only for as long as necessary to
            fulfil the purposes described in this policy, comply with our legal
            obligations, resolve disputes, and enforce our agreements. When
            information is no longer required, we securely delete or anonymize
            it.
          </p>
        </Section>

        <Section id="security" title="7. Data Security">
          <p>
            We implement appropriate technical and organizational measures —
            including encryption in transit, access controls, and secure
            infrastructure — to protect your personal information against
            unauthorized access, loss, or misuse. No method of transmission or
            storage is completely secure, and we cannot guarantee absolute
            security.
          </p>
        </Section>

        <Section id="your-rights" title="8. Your Rights">
          <p>
            Subject to applicable law, you have the right to:
          </p>
          <ul className="list-disc space-y-2 pl-5 marker:text-gray-400">
            <li>Access the personal information we hold about you.</li>
            <li>Request correction of inaccurate or incomplete information.</li>
            <li>Request deletion of your personal information.</li>
            <li>Object to or restrict certain processing.</li>
            <li>Withdraw consent where processing is based on consent.</li>
            <li>Lodge a complaint with a supervisory authority.</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-medium text-black underline underline-offset-4"
            >
              {SUPPORT_EMAIL}
            </a>
            . In South Africa, you may also contact the Information Regulator.
          </p>
        </Section>

        <Section id="children" title="9. Children’s Privacy">
          <p>
            The Service is intended for users who are of legal age to access
            licensed venues in their jurisdiction. We do not knowingly collect
            personal information from children. If you believe a child has
            provided us with personal information, please contact us so we can
            delete it.
          </p>
        </Section>

        <Section id="international" title="10. International Transfers">
          <p>
            Your information may be processed and stored on servers located
            outside your country of residence. Where we transfer personal
            information across borders, we take steps to ensure it receives an
            adequate level of protection in line with applicable law.
          </p>
        </Section>

        <Section id="changes" title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. When we make
            material changes, we will update the “Last updated” date above and,
            where appropriate, notify you within the app. Your continued use of
            the Service after changes take effect constitutes acceptance of the
            revised policy.
          </p>
        </Section>

        <Section id="contact" title="12. Contact Us">
          <p>
            If you have questions or concerns about this Privacy Policy or how
            we handle your personal information, please contact us:
          </p>
          <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-6 text-[15px] leading-7">
            <p className="font-medium text-black">
              {PLATFORM_LEGAL.providerName}
            </p>
            <p>{PLATFORM_LEGAL.physicalAddress}</p>
            <p>
              Email:{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-black underline underline-offset-4"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
            <p className="text-gray-500">
              Registration No: {PLATFORM_LEGAL.cipcRegistrationNumber}
            </p>
          </div>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="mx-auto flex max-w-3xl flex-col items-start justify-between gap-2 px-6 py-8 text-sm text-gray-500 sm:flex-row sm:items-center">
          <span>
            © {new Date().getFullYear()} {PLATFORM_LEGAL.providerName}. All
            rights reserved.
          </span>
          <Link
            to="/"
            className="text-gray-600 underline-offset-4 transition hover:text-black hover:underline"
          >
            Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default PrivacyPolicy;
