import React from 'react';
import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../../data/platform';
import { Logo, OrbitRings, RING, SegmentedRule } from './Decor';

// The public site's design kit: Landing, Login and Register.
//
// A fixed-brand layout that deliberately does NOT use the app's semantic
// theme tokens — it renders identically whether or not the viewer's
// device prefers dark. Every colour is a literal brand value from
// tailwind.config.js (`brand.*`, `bg-brand-warm`/`bg-brand-cool`).
//
// The language is: white chrome (nav + footer) bracketing full-bleed
// bands that alternate between the #262626 ink and a #F0F0F0 light slab,
// segmented gradient rules bracketing every copy block, gradient
// headlines, and artwork stacked over offset colour slabs with orbit
// rings sweeping behind it.
//
// Import from react-router-dom is limited to <Link> on purpose: Register
// is unit-tested against a mock that provides nothing else.

// --- Chrome ------------------------------------------------------------------

const FOOTER = {
  about:
    'This business was soley started by myself, Kiran Soodyall with the intent of creating a project that people like myself can use with their friends. I hope it reaches similar groups of friends like my own and contributes in some way to make their lives more enjoyable; however small it may be.',
  // TODO: replace with BarHop's real support number before launch.
  phone: '+27 61 424 7839',
  socials: {
    facebook: 'https://facebook.com/barhop',
    instagram: 'https://instagram.com/barhop',
    linkedin: 'https://linkedin.com/company/barhop',
    x: 'https://x.com/barhop',
    youtube: 'https://youtube.com/@barhop',
  },
};

const NAV_LINK =
  'flex items-center whitespace-nowrap px-3 font-display text-sm font-bold text-brand-ink transition-colors hover:text-brand-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-pink sm:px-8 sm:text-xl lg:text-[18px]';

const NAV_CTA =
  'flex items-center whitespace-nowrap bg-brand-warm px-3.5 font-display text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white sm:px-10 sm:text-xl lg:text-[18px]';

// `links` are the plain text entries; `cta` is the single warm-gradient
// button on the right. Pages drop whichever entry points at themselves.
export function MarketingNav({
  links = [{ label: 'Login', to: '/login' }],
  cta = { label: 'Get Started', to: '/register' },
}) {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
      <nav className="flex h-16 items-stretch lg:h-[48px]">
        <Link
          to="/"
          className="flex items-center pl-4 pr-3 sm:pl-5 sm:pr-4 lg:pl-8"
        >
          <Logo
            box="h-[20px] w-[72px] sm:h-[26px] sm:w-[94px]"
            art="-left-[4px] -top-[27px] h-[62px] w-[93px] sm:-left-[5px] sm:-top-[35px] sm:h-[80px] sm:w-[120px]"
          />
        </Link>

        <div className="flex-1" />

        {links.map((link) => (
          <Link key={link.to} to={link.to} className={NAV_LINK}>
            {link.label}
          </Link>
        ))}
        {cta && (
          <Link to={cta.to} className={NAV_CTA}>
            {cta.label}
          </Link>
        )}
      </nav>
    </header>
  );
}

// Brand marks aren't in Heroicons, so these are inline simple-icons paths.
const SOCIALS = [
  {
    name: 'Facebook',
    href: FOOTER.socials.facebook,
    d: 'M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z',
  },
  {
    name: 'Instagram',
    href: FOOTER.socials.instagram,
    d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  },
  {
    name: 'LinkedIn',
    href: FOOTER.socials.linkedin,
    d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    name: 'X',
    href: FOOTER.socials.x,
    d: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z',
  },
  {
    name: 'YouTube',
    href: FOOTER.socials.youtube,
    d: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
];

export function MarketingFooter() {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Logo
            box="h-[28px] w-[100px] sm:h-[34px] sm:w-[123px]"
            art="-left-[5px] -top-[38px] h-[86px] w-[129px] sm:-left-[6px] sm:-top-[46px] sm:h-[105px] sm:w-[158px]"
          />

          <ul className="flex items-center gap-2 sm:gap-3">
            {SOCIALS.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition hover:bg-brand-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2 sm:h-9 sm:w-9"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
                  >
                    <path d={social.d} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <hr className="my-6 border-t border-brand-hairline sm:my-8" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          <div>
            <h3 className="font-mono text-xl font-normal text-black sm:text-2xl">
              About Us
            </h3>
            <p className="mt-3 font-mono text-base text-brand-muted sm:text-xl">
              {FOOTER.about}
            </p>
          </div>

          <div>
            <h3 className="font-mono text-xl font-normal text-black sm:text-2xl">
              Contact Us
            </h3>
            <ul className="mt-3 space-y-1 font-mono text-base text-brand-muted sm:text-xl">
              <li>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="hover:text-brand-pink hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${FOOTER.phone.replace(/\s/g, '')}`}
                  className="hover:text-brand-pink hover:underline"
                >
                  {FOOTER.phone}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-xl font-normal text-black sm:text-2xl">
              Legal
            </h3>
            <ul className="mt-3 space-y-1 font-mono text-base text-brand-muted sm:text-xl">
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-brand-pink hover:underline"
                >
                  Privacy Policy
                </Link>
              </li>
              {/* TODO: no /terms route exists yet — wire up once the page ships. */}
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Nav + bands + footer. Every public page is one of these.
export function MarketingPage({ nav, children }) {
  return (
    <div className="min-h-screen bg-white">
      {nav || <MarketingNav />}
      {children}
      <MarketingFooter />
    </div>
  );
}

// --- Bands -------------------------------------------------------------------

const TONES = {
  dark: 'bg-brand-ink text-white',
  light: 'bg-[#F0F0F0] text-black',
};

// `overflow-hidden` is load-bearing: the orbit rings and the offset slabs
// are meant to bleed past the content column, and without clipping here
// they push the whole document sideways on narrow viewports.

// One full-bleed band, single centred column. Used where the content is
// too wide to sit beside a copy block (the registration wizard).
export function MarketingSection({ tone = 'dark', className = '', children }) {
  return (
    <section className={`relative overflow-hidden ${TONES[tone]}`}>
      <div
        className={`relative mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20 lg:px-12 lg:py-24 ${className}`}
      >
        {children}
      </div>
    </section>
  );
}

// One full-bleed band, copy beside a visual. Text always comes first when
// stacked on mobile; `reverse` puts the visual on the left from `lg` up.
export function Band({ tone = 'dark', reverse = false, copy, visual }) {
  return (
    <section className={`overflow-hidden ${TONES[tone]}`}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 py-16 sm:gap-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-20 lg:px-12 lg:py-32">
        <div className={reverse ? 'lg:order-2' : ''}>{copy}</div>
        {/* `group` is the hover root for the whole visual: artwork lifts,
            colour slabs fan further out, and orbit rings widen — all
            driven from hovering anywhere over the artwork. */}
        <div className={`group relative ${reverse ? 'lg:order-1' : ''}`}>
          {visual}
        </div>
      </div>
    </section>
  );
}

// `as` picks the heading level: Landing's bands are sections of one page
// (h2), while Login/Register each headline their own page (h1).
export function SectionCopy({
  as: Heading = 'h2',
  tone = 'dark',
  variant = 'warm',
  heading,
  center = false,
  children,
}) {
  const body = tone === 'dark' ? 'text-white/85' : 'text-brand-muted';
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SegmentedRule variant={variant} />
      <Heading
        className={`font-display text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.5rem] ${center ? 'text-center' : ''}`}
      >
        {heading}
      </Heading>
      <div
        className={`font-mono text-base leading-relaxed sm:text-lg lg:text-xl ${body} ${center ? 'mx-auto max-w-2xl text-center' : ''}`}
      >
        {children}
      </div>
      <SegmentedRule variant={variant} />
    </div>
  );
}

export function GradientLine({ variant = 'warm', children }) {
  const ramp = variant === 'cool' ? 'bg-brand-cool' : 'bg-brand-warm';
  return (
    <span className={`${ramp} bg-clip-text text-transparent`}>{children}</span>
  );
}

// --- Cards over offset colour slabs ------------------------------------------

// Offset colour slabs that peek out from behind a card. Written as
// literal class strings so Tailwind's scanner picks them up. Offsets
// halve below `sm` so the slabs don't eat the narrow gutters.
const SLAB = 'absolute inset-0 rounded-2xl sm:rounded-[28px]';

export const CARD_LAYERS = {
  warm: [
    `${SLAB} translate-x-5 -translate-y-5 bg-brand-orange sm:translate-x-10 sm:-translate-y-10`,
    `${SLAB} translate-x-2.5 -translate-y-2.5 bg-brand-pink sm:translate-x-5 sm:-translate-y-5`,
  ],
  cool: [
    `${SLAB} translate-x-5 -translate-y-5 bg-brand-blue sm:translate-x-10 sm:-translate-y-10`,
    `${SLAB} translate-x-2.5 -translate-y-2.5 bg-brand-green sm:translate-x-5 sm:-translate-y-5`,
  ],
};

// The white panel a form sits on, stacked in front of its colour slabs —
// the same construction Landing uses for its product screenshots. Forms
// don't get the hover lift: nudging a card while someone is aiming at a
// text input is hostile.
export function SlabCard({ layers = CARD_LAYERS.warm, className = '', children, ...rest }) {
  return (
    <div className="relative w-full">
      {layers.map((layer) => (
        <div key={layer} aria-hidden="true" className={layer} />
      ))}
      <div
        className={`relative rounded-2xl bg-white p-6 text-black shadow-[0_20px_45px_rgba(0,0,0,0.35)] sm:rounded-[28px] sm:p-10 ${className}`}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}

// --- Orbit ring presets for the auth pages ------------------------------------

export const AUTH_RINGS = {
  // Sized for one column of a two-column Band (Login).
  column: [
    `${RING} -right-24 -top-16 h-[440px] w-[440px] rotate-[18deg] bg-brand-warm`,
    `${RING} -bottom-24 -right-8 h-[400px] w-[480px] rotate-[-12deg] bg-brand-cool`,
    `${RING} -left-28 top-1/4 h-[380px] w-[420px] rotate-[26deg] bg-brand-warm`,
  ],
  // Sized for a full-bleed band, anchored to both edges so the centred
  // column stays clear (Register).
  wide: [
    `${RING} -left-40 -top-24 h-[560px] w-[620px] rotate-[16deg] bg-brand-cool`,
    `${RING} -left-24 top-[45%] h-[480px] w-[540px] rotate-[-14deg] bg-brand-warm`,
    `${RING} -right-40 -top-16 h-[600px] w-[660px] rotate-[-22deg] bg-brand-cool`,
    `${RING} -right-28 top-[55%] h-[500px] w-[560px] rotate-[24deg] bg-brand-warm`,
  ],
};

// --- Form controls on a white slab card ---------------------------------------

export const FIELD =
  'w-full rounded-lg border border-brand-hairline bg-white px-4 py-3 font-mono text-sm text-black transition-colors placeholder:text-brand-hairline focus:border-brand-pink focus:outline-none focus:ring-1 focus:ring-brand-pink disabled:cursor-not-allowed disabled:opacity-50';

export const FIELD_LABEL =
  'font-mono text-xs font-bold uppercase tracking-wider text-brand-muted';

// A hard-stop "or" divider matching the segmented rule's language.
export function OrDivider() {
  return (
    <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-brand-hairline before:h-px before:flex-1 before:bg-brand-hairline after:h-px after:flex-1 after:bg-brand-hairline">
      or
    </div>
  );
}

// --- Buttons ------------------------------------------------------------------

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-display font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const BTN_VARIANTS = {
  warm: 'bg-brand-warm text-white hover:brightness-110',
  cool: 'bg-brand-cool text-white hover:brightness-110',
  outline:
    'border border-brand-hairline text-brand-ink hover:border-brand-pink hover:text-brand-pink',
};

const BTN_SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3 text-lg',
};

export function marketingButton(variant = 'warm', size = 'md', extra = '') {
  return [
    BTN_BASE,
    BTN_VARIANTS[variant] || BTN_VARIANTS.warm,
    BTN_SIZES[size] || BTN_SIZES.md,
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

export { SegmentedRule, OrbitRings, RING, Logo };
