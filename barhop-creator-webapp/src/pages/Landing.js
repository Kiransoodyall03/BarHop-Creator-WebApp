import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../data/platform';

// Public marketing page — a fixed-brand layout that deliberately does NOT
// use the app's semantic theme tokens. It renders identically whether the
// creator app is in light or dark mode, so every colour here is a literal
// brand value from tailwind.config.js (`brand.*`, `bg-brand-warm/cool`).

// Art the user exports from Figma. Each slot degrades to a labelled
// placeholder of the same aspect ratio until the file is dropped in, so
// adding the real asset never shifts the layout.
const ASSETS = {
  logo: '/assets/Logo.png',
  person: '/assets/hero-person.png',
  venueCard: '/assets/shot-venue-card.png',
  dashboard: '/assets/shot-dashboard.png',
  pricing: '/assets/shot-pricing.png',
};

const FOOTER = {
  about: 'The About us Description',
  // TODO: replace with BarHop's real support number before launch.
  phone: '+27 00 000 0000',
  socials: {
    facebook: 'https://facebook.com/barhop',
    instagram: 'https://instagram.com/barhop',
    linkedin: 'https://linkedin.com/company/barhop',
    x: 'https://x.com/barhop',
    youtube: 'https://youtube.com/@barhop',
  },
};

// Offset colour slabs that peek out from behind each product screenshot.
// Written as literal class strings so Tailwind's scanner picks them up.
// Offsets halve below `sm` so the slabs don't eat the narrow gutters, and
// grow ~40% on `group` hover so the stack fans open behind the screenshot.
const SLAB =
  'absolute inset-0 rounded-2xl transition-transform duration-300 motion-reduce:transition-none sm:rounded-[28px]';

const LAYERS = {
  venueCard: [
    `${SLAB} translate-x-5 -translate-y-5 bg-brand-orange group-hover:translate-x-7 group-hover:-translate-y-7 sm:translate-x-10 sm:-translate-y-10 sm:group-hover:translate-x-14 sm:group-hover:-translate-y-14`,
    `${SLAB} translate-x-2.5 -translate-y-2.5 bg-brand-pink group-hover:translate-x-3.5 group-hover:-translate-y-3.5 sm:translate-x-5 sm:-translate-y-5 sm:group-hover:translate-x-7 sm:group-hover:-translate-y-7`,
  ],
  dashboard: [
    `${SLAB} -translate-x-5 -translate-y-5 bg-brand-blue group-hover:-translate-x-7 group-hover:-translate-y-7 sm:-translate-x-10 sm:-translate-y-10 sm:group-hover:-translate-x-14 sm:group-hover:-translate-y-14`,
    `${SLAB} -translate-x-2.5 -translate-y-2.5 bg-brand-green group-hover:-translate-x-3.5 group-hover:-translate-y-3.5 sm:-translate-x-5 sm:-translate-y-5 sm:group-hover:-translate-x-7 sm:group-hover:-translate-y-7`,
  ],
  pricing: [
    `${SLAB} -translate-x-5 -translate-y-5 bg-brand-green group-hover:-translate-x-7 group-hover:-translate-y-7 sm:-translate-x-10 sm:-translate-y-10 sm:group-hover:-translate-x-14 sm:group-hover:-translate-y-14`,
    `${SLAB} -translate-x-2.5 -translate-y-2.5 bg-brand-blue group-hover:-translate-x-3.5 group-hover:-translate-y-3.5 sm:-translate-x-5 sm:-translate-y-5 sm:group-hover:-translate-x-7 sm:group-hover:-translate-y-7`,
  ],
};

// Decorative orbit rings. Ellipses (rounded-[50%] on a non-square box),
// rotated to read as rings circling the artwork.
//
// The stroke is a gradient, which `border-color` can't express. The trick:
// paint the ramp across the whole border-box behind a transparent border,
// then mask the padding-box back out so only the 3px band survives.
// `border-image` is the obvious alternative but it ignores border-radius
// and would draw a rectangle; filling an inner disc with the band colour
// would occlude whatever sits behind the ring. Longhands are used rather
// than the `mask` shorthand because the shorthand resets mask-composite,
// and Tailwind emits each arbitrary property as its own unordered rule.
const RING =
  'absolute rounded-[50%] border-[3px] border-transparent ' +
  '[mask-image:linear-gradient(#fff_0_0),linear-gradient(#fff_0_0)] [mask-clip:padding-box,border-box] [mask-composite:exclude] ' +
  '[-webkit-mask-image:linear-gradient(#fff_0_0),linear-gradient(#fff_0_0)] [-webkit-mask-clip:padding-box,border-box] [-webkit-mask-composite:xor]';

// Warm rings run pink→orange, cool rings blue→green.
const RINGS = {
  venueCard: [
    `${RING} -right-24 -top-16 h-[440px] w-[440px] rotate-[18deg] bg-brand-cool`,
    `${RING} -bottom-24 -right-8 h-[400px] w-[480px] rotate-[-12deg] bg-brand-cool`,
  ],
  dashboard: [
    `${RING} -left-24 -top-16 h-[300px] w-[300px] rotate-[12deg] bg-brand-warm`,
    `${RING} -bottom-24 -left-12 h-[380px] w-[420px] rotate-[-20deg] bg-brand-warm`,
  ],
  person: [
    `${RING} left-1/2 top-1/2 h-[540px] w-[760px] -translate-x-1/2 -translate-y-1/2 rotate-[-26deg] bg-brand-warm`,
    `${RING} left-1/2 top-1/2 h-[500px] w-[720px] -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] bg-brand-cool`,
    `${RING} left-1/2 top-1/2 h-[460px] w-[680px] -translate-x-1/2 -translate-y-1/2 rotate-[14deg] bg-brand-cool`,
    `${RING} left-1/2 top-1/2 h-[300px] w-[420px] -translate-x-[70%] -translate-y-[85%] rotate-[-40deg] bg-brand-warm`,
  ],
  pricing: [
    `${RING} -left-28 -top-20 h-[360px] w-[420px] rotate-[16deg] bg-brand-cool`,
    `${RING} -bottom-28 -left-16 h-[420px] w-[480px] rotate-[-14deg] bg-brand-cool`,
    `${RING} -right-20 top-1/4 h-[300px] w-[340px] rotate-[28deg] bg-brand-cool`,
  ],
};

// The segmented gradient divider that brackets every copy block. A single
// gradient bar punched out by a hard-stop mask, so it works unchanged on
// both the dark and the light bands. -webkit- prefix is still required by
// Safari. Kept as literal strings for Tailwind's scanner.
const RULE_MASK =
  '[mask-image:linear-gradient(to_right,#000_0_38%,transparent_38%_42%,#000_42%_43.5%,transparent_43.5%_47%,#000_47%_51%,transparent_51%_55%,#000_55%_56.5%,transparent_56.5%_60%,#000_60%_100%)] ' +
  '[-webkit-mask-image:linear-gradient(to_right,#000_0_38%,transparent_38%_42%,#000_42%_43.5%,transparent_43.5%_47%,#000_47%_51%,transparent_51%_55%,#000_55%_56.5%,transparent_56.5%_60%,#000_60%_100%)]';

function SegmentedRule({ variant = 'warm' }) {
  const ramp = variant === 'cool' ? 'bg-brand-cool' : 'bg-brand-warm';
  return (
    <div aria-hidden="true" className={`h-[3px] w-full ${ramp} ${RULE_MASK}`} />
  );
}

// Renders a user-supplied export, falling back to a same-size placeholder
// panel (labelled with the missing path) if the file isn't there yet.
function AssetImage({ src, alt, aspect, className = '', fit = 'cover' }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex ${aspect} w-full items-center justify-center rounded-[28px] border-2 border-dashed border-brand-hairline bg-brand-ink/90 p-4 text-center font-mono text-xs text-brand-hairline ${className}`}
      >
        {src}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`${aspect} w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
    />
  );
}

// A product screenshot sitting in front of its offset colour slabs.
function Showcase({ src, alt, aspect, layers }) {
  return (
    <div className="relative w-full">
      {layers.map((layer) => (
        <div key={layer} aria-hidden="true" className={layer} />
      ))}
      <AssetImage
        src={src}
        alt={alt}
        aspect={aspect}
        className="relative rounded-2xl shadow-lg transition duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_20px_45px_rgba(0,0,0,0.35)] motion-reduce:transition-none sm:rounded-[28px]"
      />
    </div>
  );
}

// The ring geometry below is authored at desktop size; scaling the whole
// group keeps it in proportion on small screens instead of a 760px ellipse
// reading as a straight line across a 327px column. Scaling also thins the
// 3px borders to hairlines, which is what you want at phone size.
//
// Each breakpoint needs its own `group-hover` scale: a bare
// `group-hover:scale-*` outranks `sm:`/`lg:` on specificity and would
// otherwise snap the rings back to phone size on hover at desktop.
function OrbitRings({ rings }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 scale-[0.5] transition-transform duration-500 group-hover:scale-[0.56] motion-reduce:transition-none sm:scale-75 sm:group-hover:scale-[0.84] lg:scale-100 lg:group-hover:scale-110"
    >
      {rings.map((ring, i) => (
        // eslint-disable-next-line react/no-array-index-key -- static list, never reordered
        <span key={i} className={ring} />
      ))}
    </div>
  );
}

// One full-bleed band. Text always comes first when stacked on mobile;
// `reverse` puts the visual on the left from `lg` up.
function Band({ tone = 'dark', reverse = false, copy, visual }) {
  const shell =
    tone === 'dark' ? 'bg-brand-ink text-white' : 'bg-[#F0F0F0] text-black';

  // `overflow-hidden` is load-bearing: the orbit rings and the offset slabs
  // are meant to bleed past the content column, and without clipping here
  // they push the whole document sideways on narrow viewports.
  return (
    <section className={`overflow-hidden ${shell}`}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 py-16 sm:gap-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-20 lg:px-12 lg:py-32">
        <div className={reverse ? 'lg:order-2' : ''}>{copy}</div>
        {/* `group` is the hover root for the whole visual: the screenshot
            lifts, the colour slabs fan further out, and the orbit rings
            widen — all driven from hovering anywhere over the artwork. */}
        <div className={`group relative ${reverse ? 'lg:order-1' : ''}`}>
          {visual}
        </div>
      </div>
    </section>
  );
}

function SectionCopy({ tone = 'dark', variant = 'warm', heading, children }) {
  const body = tone === 'dark' ? 'text-white/85' : 'text-brand-muted';
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <SegmentedRule variant={variant} />
      <h2 className="font-display text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.5rem]">
        {heading}
      </h2>
      <div
        className={`font-mono text-base leading-relaxed sm:text-lg lg:text-xl ${body}`}
      >
        {children}
      </div>
      <SegmentedRule variant={variant} />
    </div>
  );
}

function GradientLine({ variant = 'warm', children }) {
  const ramp = variant === 'cool' ? 'bg-brand-cool' : 'bg-brand-warm';
  return (
    <span className={`${ramp} bg-clip-text text-transparent`}>{children}</span>
  );
}

// Logo.png ships with a lot of transparent padding — the wordmark only
// occupies roughly 4%–81% across and 44%–76% down the canvas, so a plain
// `h-10 w-auto` would render the mark at ~13px. `box` is the visible crop
// window; `art` oversizes and offsets the image inside it so the mark
// fills that window. If the logo is ever re-exported tightly cropped,
// this collapses to a single <img className="h-10 w-auto" />.
function Logo({ box, art }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${box}`}>
      <img
        src={ASSETS.logo}
        alt="BarHop"
        className={`absolute max-w-none ${art}`}
      />
    </span>
  );
}

function Navbar() {
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

        <Link
          to="/login"
          className="flex items-center whitespace-nowrap px-3 font-display text-sm font-bold text-brand-ink transition-colors hover:text-brand-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-pink sm:px-8 sm:text-xl lg:text-[18px]"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="flex items-center whitespace-nowrap bg-brand-warm px-3.5 font-display text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white sm:px-10 sm:text-xl lg:text-[18px]"
        >
          Get Started
        </Link>
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

function Footer() {
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

function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* 1 — Hero */}
      <Band
        tone="dark"
        copy={
          <SectionCopy
            tone="dark"
            variant="warm"
            heading={
              <>
                The All-In-One Solution to
                <br />
                <GradientLine variant="warm">Advertising In Bed</GradientLine>
              </>
            }
          >
            Smart, adaptable solution built to solve overly complex and
            difficult advertisement needs, we help you deliver what you want
            straight to your target audience in a format they know
          </SectionCopy>
        }
        visual={
          <>
            <OrbitRings rings={RINGS.venueCard} />
            <div className="relative mx-auto w-full max-w-[380px]">
              <Showcase
                src={ASSETS.venueCard}
                alt="A BarHop venue card as it appears in the consumer app"
                aspect="aspect-[424/524]"
                layers={LAYERS.venueCard}
              />
            </div>
          </>
        }
      />

      {/* 2 — Analytics */}
      <Band
        tone="light"
        reverse
        copy={
          <SectionCopy
            tone="light"
            variant="cool"
            heading={
              <>
                Receive Real-Time
                <br />
                <GradientLine variant="cool">Data and Analytics</GradientLine>
              </>
            }
          >
            Whether you&rsquo;re taking your business to the next level or
            launching a new tea shop, our data and analytics collected and given
            to you will transform how you can manage your advertisements and
            evolve in an evolving market.
          </SectionCopy>
        }
        visual={
          <>
            <OrbitRings rings={RINGS.dashboard} />
            <div className="relative mx-auto w-full max-w-[560px]">
              <Showcase
                src={ASSETS.dashboard}
                alt="The BarHop analytics dashboard showing the discovery funnel and swipe activity"
                aspect="aspect-[1000/693]"
                layers={LAYERS.dashboard}
              />
            </div>
          </>
        }
      />

      {/* 3 — Instant delivery */}
      <Band
        tone="dark"
        copy={
          <SectionCopy
            tone="dark"
            variant="warm"
            heading={
              <>
                Get Started Today with
                <br />
                <GradientLine variant="warm">Instant Delivery</GradientLine>
              </>
            }
          >
            <strong className="font-display font-bold text-white">
              Create
            </strong>
            ,{' '}
            <strong className="font-display font-bold text-white">
              Customize
            </strong>{' '}
            and{' '}
            <strong className="font-display font-bold text-white">WOW</strong>{' '}
            with our venue cards, which function the exact same as profile cards
            in dating apps. Upon creation your venue card will be{' '}
            <strong className="font-display font-bold text-white">
              Instantly
            </strong>{' '}
            on everyone&rsquo;s phone in their venue card stack.
          </SectionCopy>
        }
        visual={
          <>
            <OrbitRings rings={RINGS.person} />
            <div className="relative mx-auto w-full max-w-[420px]">
              <AssetImage
                src={ASSETS.person}
                alt=""
                aspect="aspect-[4/5]"
                fit="contain"
                className="relative transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-[1.03] motion-reduce:transition-none"
              />
            </div>
          </>
        }
      />

      {/* 4 — Pricing */}
      <Band
        tone="light"
        reverse
        copy={
          <div className="flex flex-col gap-6 sm:gap-8">
            <SegmentedRule variant="cool" />
            <h2 className="font-display text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl lg:text-right lg:text-[3.5rem]">
              Your Budget
              <br />
              <GradientLine variant="cool">Your Choice</GradientLine>
              <br />
              <GradientLine variant="warm">Your Business</GradientLine>
            </h2>
            <p className="font-mono text-base leading-relaxed text-brand-muted sm:text-lg lg:text-xl">
              Our focus for subscriptions is full transparency; allowing you to
              cancel your subscription with ease and{' '}
              <strong className="font-display font-bold text-black">
                no loopholes
              </strong>
              . We offer annual and monthly subscriptions at 3 tiers which scale
              with your needs as your business grows.
            </p>
            <div className="flex lg:justify-end">
              <Link
                to="/register"
                className="rounded-lg bg-brand-warm px-8 py-3 font-display text-lg font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2"
              >
                Get Started
              </Link>
            </div>
            <SegmentedRule variant="cool" />
          </div>
        }
        visual={
          <>
            <OrbitRings rings={RINGS.pricing} />
            <div className="relative mx-auto w-full max-w-[560px]">
              <Showcase
                src={ASSETS.pricing}
                alt="BarHop's three subscription tiers: Starter, Pro, and Enterprise"
                aspect="aspect-[980/750]"
                layers={LAYERS.pricing}
              />
            </div>
          </>
        }
      />

      <Footer />
    </div>
  );
}

export default Landing;
