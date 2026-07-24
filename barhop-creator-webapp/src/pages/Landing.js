import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Band,
  GradientLine,
  MarketingPage,
  OrbitRings,
  RING,
  SectionCopy,
  SegmentedRule,
  marketingButton,
} from '../components/ui/Marketing';

// The public marketing page. Chrome, bands, copy blocks and the ring /
// rule geometry all come from components/ui/Marketing.js, which Login and
// Register share — everything left in this file is specific to this
// page's artwork.

// Art the user exports from Figma. Each slot degrades to a labelled
// placeholder of the same aspect ratio until the file is dropped in, so
// adding the real asset never shifts the layout.
const ASSETS = {
  person: '/assets/hero-person.png',
  venueCard: '/assets/shot-venue-card.png',
  dashboard: '/assets/shot-dashboard.png',
  pricing: '/assets/shot-pricing.png',
};

// Offset colour slabs that peek out from behind each product screenshot.
// Written as literal class strings so Tailwind's scanner picks them up.
// Offsets halve below `sm` so the slabs don't eat the narrow gutters, and
// grow ~40% on `group` hover so the stack fans open behind the
// screenshot. Marketing.js's CARD_LAYERS are the static equivalent for
// the auth forms, which don't take a hover.
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

function Landing() {
  return (
    <MarketingPage>
      {/* 1 — Hero */}
      <Band
        tone="dark"
        copy={
          <SectionCopy
            as="h1"
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
            <OrbitRings rings={RINGS.venueCard} hover />
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
            <OrbitRings rings={RINGS.dashboard} hover />
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
            <OrbitRings rings={RINGS.person} hover />
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
              <Link to="/register" className={marketingButton('warm', 'lg')}>
                Get Started
              </Link>
            </div>
            <SegmentedRule variant="cool" />
          </div>
        }
        visual={
          <>
            <OrbitRings rings={RINGS.pricing} hover />
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
    </MarketingPage>
  );
}

export default Landing;
