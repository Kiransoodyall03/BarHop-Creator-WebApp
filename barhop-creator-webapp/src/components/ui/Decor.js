import React from 'react';

// Shared brand decoration for the fixed-palette surfaces — which is now
// every surface in the app. Everything here is a literal brand value from
// tailwind.config.js.
//
// Two kits build on this module: `ui/Marketing.js` (the public Landing,
// Login and Register pages — white chrome over alternating dark/light
// bands) and `ui/Brand.js` (the authenticated dashboard — one dark
// canvas). Landing's former local copies of SegmentedRule, OrbitRings /
// RING and Logo were folded back onto this module, so this is the single
// definition of the ring geometry and the mask technique.

// --- Segmented gradient rule -------------------------------------------------

// A single gradient bar punched out by a hard-stop mask, so it works
// unchanged on both dark and light backgrounds. The -webkit- prefix is
// still required by Safari. Kept as literal strings for Tailwind's scanner.
const RULE_MASK =
  '[mask-image:linear-gradient(to_right,#000_0_38%,transparent_38%_42%,#000_42%_43.5%,transparent_43.5%_47%,#000_47%_51%,transparent_51%_55%,#000_55%_56.5%,transparent_56.5%_60%,#000_60%_100%)] ' +
  '[-webkit-mask-image:linear-gradient(to_right,#000_0_38%,transparent_38%_42%,#000_42%_43.5%,transparent_43.5%_47%,#000_47%_51%,transparent_51%_55%,#000_55%_56.5%,transparent_56.5%_60%,#000_60%_100%)]';

export function SegmentedRule({ variant = 'warm', className = '' }) {
  const ramp = variant === 'cool' ? 'bg-brand-cool' : 'bg-brand-warm';
  return (
    <div
      aria-hidden="true"
      className={`h-[3px] w-full ${ramp} ${RULE_MASK} ${className}`}
    />
  );
}

// --- Orbit rings -------------------------------------------------------------

// A gradient stroke that follows border-radius, which `border-color`
// can't express. Paint the ramp across the whole border-box behind a
// transparent border, then mask the padding-box back out so only the 3px
// band survives. `border-image` is the obvious alternative but it ignores
// border-radius and would draw a rectangle; filling an inner disc with
// the band colour would occlude whatever sits behind the ring.
//
// Longhands rather than the `mask` shorthand: the shorthand resets
// mask-composite, and Tailwind emits each arbitrary property as its own
// rule with no guaranteed source order.
export const RING =
  'absolute rounded-[50%] border-[3px] border-transparent ' +
  '[mask-image:linear-gradient(#fff_0_0),linear-gradient(#fff_0_0)] [mask-clip:padding-box,border-box] [mask-composite:exclude] ' +
  '[-webkit-mask-image:linear-gradient(#fff_0_0),linear-gradient(#fff_0_0)] [-webkit-mask-clip:padding-box,border-box] [-webkit-mask-composite:xor]';

// Ring geometry is authored at desktop size; scaling the whole group
// keeps it in proportion on small screens instead of a 760px ellipse
// reading as a straight line across a phone-width column. Scaling also
// thins the 3px borders to hairlines, which is what you want that small.
//
// Each breakpoint needs its own `group-hover` scale when `hover` is on: a
// bare `group-hover:scale-*` outranks `sm:`/`lg:` on specificity and
// would otherwise snap the rings back to phone size on hover at desktop.
const RING_HOVER =
  'transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[0.56] sm:group-hover:scale-[0.84] lg:group-hover:scale-110';

export function OrbitRings({ rings, className = '', hover = false }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 scale-[0.5] sm:scale-75 lg:scale-100 ${hover ? RING_HOVER : ''} ${className}`}
    >
      {rings.map((ring, i) => (
        // eslint-disable-next-line react/no-array-index-key -- static list, never reordered
        <span key={i} className={ring} />
      ))}
    </div>
  );
}

// --- Logo --------------------------------------------------------------------

export const LOGO_SRC = '/assets/Logo.png';

// Logo.png ships with a lot of transparent padding — the wordmark only
// occupies roughly 4%–81% across and 44%–76% down the canvas, so a plain
// `h-10 w-auto` would render the mark at ~13px. `box` is the visible crop
// window; `art` oversizes and offsets the image inside it so the mark
// fills that window. If the logo is ever re-exported tightly cropped,
// this collapses to a single <img className="h-10 w-auto" />.
export function Logo({ box, art }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden ${box}`}>
      <img
        src={LOGO_SRC}
        alt="BarHop"
        className={`absolute max-w-none ${art}`}
      />
    </span>
  );
}
