import React, { forwardRef } from 'react';
import { OrbitRings, RING, SegmentedRule } from './Decor';

// The authenticated dashboard's design kit.
//
// Every surface behind the TopNav renders on the Landing page's dark band
// (#262626 canvas, white type, Space Grotesk headings over Space Mono
// body) with the same gradient decoration: orbit rings bleeding off the
// edges, segmented gradient rules bracketing each heading, and brand-warm
// gradient CTAs. Like Landing and the Marketing Overview, these are
// literal brand values — the dashboard does NOT follow the light/dark
// theme toggle, so nothing here uses the semantic CSS-var tokens.

// --- Surfaces ---------------------------------------------------------------

// The frosted glass panel every card on the dashboard is built from.
export const PANEL =
  'rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm';

// Add to PANEL on anything clickable or hoverable.
export const PANEL_HOVER = 'transition-colors hover:border-white/25';

// Inset well — a panel *inside* a panel (nested forms, search results).
export const WELL = 'rounded-xl border border-white/10 bg-black/20 p-4';

// --- Background ring sets ----------------------------------------------------

// Large decorative ellipses drawn with Decor's gradient-stroke technique.
// `brand-fade` rings read as pale light catching the canvas; the warm and
// cool ramps add a single colour accent. Each set is tuned to leave the
// page's content column clear: `split` hugs the outer edges, `column`
// arcs over a centred column, and so on.
export const RING_SETS = {
  overview: [
    `${RING} -left-32 top-8 h-[420px] w-[420px] bg-brand-fade`,
    `${RING} left-[22%] -top-16 h-[480px] w-[480px] bg-brand-fade`,
    `${RING} right-[6%] -top-24 h-[520px] w-[520px] bg-brand-fade`,
    `${RING} right-[18%] top-64 h-[440px] w-[440px] bg-brand-fade`,
    `${RING} -right-16 top-[30rem] h-[400px] w-[400px] bg-brand-fade`,
  ],
  split: [
    `${RING} -left-40 -top-24 h-[560px] w-[600px] rotate-[16deg] bg-brand-fade`,
    `${RING} -left-24 top-[34rem] h-[480px] w-[520px] rotate-[-12deg] bg-brand-warm`,
    `${RING} -right-40 top-4 h-[600px] w-[640px] rotate-[-20deg] bg-brand-fade`,
    `${RING} -right-24 top-[38rem] h-[460px] w-[500px] rotate-[24deg] bg-brand-cool`,
  ],
  column: [
    `${RING} left-1/2 -top-40 h-[620px] w-[820px] -translate-x-1/2 rotate-[-10deg] bg-brand-fade`,
    `${RING} -left-32 top-[26rem] h-[520px] w-[560px] rotate-[18deg] bg-brand-warm`,
    `${RING} -right-36 top-[14rem] h-[560px] w-[600px] rotate-[-16deg] bg-brand-cool`,
  ],
  panel: [
    `${RING} -left-36 -top-20 h-[520px] w-[560px] rotate-[12deg] bg-brand-fade`,
    `${RING} left-[35%] -top-32 h-[560px] w-[620px] rotate-[-8deg] bg-brand-fade`,
    `${RING} -right-28 top-[8rem] h-[540px] w-[580px] rotate-[22deg] bg-brand-fade`,
    `${RING} right-[12%] top-[42rem] h-[480px] w-[520px] rotate-[-18deg] bg-brand-cool`,
  ],
};

// --- Page shell --------------------------------------------------------------

// The dark canvas every dashboard route sits on. `overflow-hidden` is
// load-bearing: the rings deliberately bleed past the content column and
// would otherwise push the document sideways on narrow viewports.
//
// Renders a <div> by default because DashboardLayout already owns the
// page's <main>; standalone routes (the admin console) pass as="main".
export function PageShell({
  as: Tag = 'div',
  rings = RING_SETS.overview,
  width = 'max-w-[1600px]',
  className = '',
  children,
}) {
  return (
    <Tag
      className={`relative min-h-screen flex-1 overflow-hidden bg-brand-ink px-6 py-10 text-white lg:px-12 ${className}`}
    >
      <OrbitRings rings={rings} className="opacity-30" />
      <div className={`relative mx-auto flex w-full flex-col gap-8 ${width}`}>
        {children}
      </div>
    </Tag>
  );
}

// Landing's SectionCopy, adapted for a page header: gradient rule, display
// heading, mono body. `actions` sits opposite the title from `sm` up.
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
  variant = 'warm',
  children,
}) {
  return (
    <header className="flex flex-col gap-5">
      <SegmentedRule variant={variant} />
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          {eyebrow && (
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/50">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-2 font-display text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-white/60 sm:text-base">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {actions}
          </div>
        )}
      </div>
      {children}
    </header>
  );
}

// Landing's gradient headline treatment.
export function GradientText({ variant = 'warm', className = '', children }) {
  const ramp = variant === 'cool' ? 'bg-brand-cool' : 'bg-brand-warm';
  return (
    <span className={`${ramp} bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  );
}

// A panel heading — used by every card so titles stay on one scale.
export function PanelTitle({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 font-mono text-sm text-white/60">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-3">{actions}</div>}
    </div>
  );
}

// --- Buttons -----------------------------------------------------------------

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-display font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink disabled:cursor-not-allowed disabled:opacity-50';

const BTN_VARIANTS = {
  primary: 'bg-brand-warm text-white hover:brightness-110',
  cool: 'bg-brand-cool text-white hover:brightness-110',
  outline:
    'border border-white/40 text-white hover:border-white hover:bg-white/5',
  ghost: 'text-white/60 hover:text-white',
  danger:
    'border border-brand-pink/60 bg-brand-pink/15 text-brand-pink hover:bg-brand-pink/25',
};

const BTN_SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

// String builder for non-button elements (react-router <Link>, <a>).
export function brandButton(variant = 'primary', size = 'md', extra = '') {
  return [
    BTN_BASE,
    BTN_VARIANTS[variant] || BTN_VARIANTS.primary,
    BTN_SIZES[size] || BTN_SIZES.md,
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

export function BrandButton({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={brandButton(variant, size, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

// --- Form controls -----------------------------------------------------------

// `[color-scheme:dark]` makes the native date/time pickers and the select
// popup render dark instead of a white flash; `[&>option]` covers the
// option list, which can't inherit the select's colours on its own.
export const CONTROL =
  'w-full rounded-lg border border-white/25 bg-white/[0.06] px-4 py-2.5 font-mono text-sm text-white placeholder:text-white/40 transition-colors [color-scheme:dark] focus:border-brand-pink focus:outline-none focus:ring-1 focus:ring-brand-pink/50 disabled:cursor-not-allowed disabled:opacity-50';

export function BrandLabel({ className = '', children, ...rest }) {
  return (
    <label
      className={`block font-mono text-xs font-bold uppercase tracking-wider text-white/50 ${className}`}
      {...rest}
    >
      {children}
    </label>
  );
}

export const BrandInput = forwardRef(function BrandInput(
  { className = '', ...rest },
  ref
) {
  return <input ref={ref} className={`${CONTROL} ${className}`} {...rest} />;
});

export const BrandTextarea = forwardRef(function BrandTextarea(
  { className = '', ...rest },
  ref
) {
  return <textarea ref={ref} className={`${CONTROL} ${className}`} {...rest} />;
});

export const BrandSelect = forwardRef(function BrandSelect(
  { className = '', children, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      className={`${CONTROL} [&>option]:bg-brand-ink [&>option]:text-white ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
});

// Outlined dropdown from the comp: a native <select> under a styled shell,
// so keyboard and screen-reader support come free and there is no
// outside-click handling to get wrong. `label` is the visible text — pass
// the selected option's label when it should track the selection.
export function Dropdown({ label, value, onChange, options, className = '' }) {
  return (
    <label
      className={`relative inline-flex h-11 min-w-[10rem] items-center rounded border border-white/40 px-4 font-mono text-sm text-white transition-colors focus-within:border-brand-pink hover:border-white ${className}`}
    >
      <span className="pointer-events-none flex-1 truncate">{label}</span>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
        className="pointer-events-none ml-3 h-4 w-4 shrink-0"
      >
        <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" />
      </svg>
      <select
        value={value}
        onChange={onChange}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// --- Chips -------------------------------------------------------------------

const CHIP_BASE =
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider';

const CHIP_TONES = {
  neutral: 'border-white/20 bg-white/10 text-white/70',
  success: 'border-brand-green/40 bg-brand-green/15 text-brand-green',
  warn: 'border-brand-orange/40 bg-brand-orange/15 text-brand-orange',
  danger: 'border-brand-pink/40 bg-brand-pink/15 text-brand-pink',
  cool: 'border-brand-blue/40 bg-brand-blue/15 text-brand-blue',
};

export function chipClasses(tone = 'neutral', extra = '') {
  return `${CHIP_BASE} ${CHIP_TONES[tone] || CHIP_TONES.neutral} ${extra}`.trim();
}

export function Chip({ tone = 'neutral', className = '', children, ...rest }) {
  return (
    <span className={chipClasses(tone, className)} {...rest}>
      {children}
    </span>
  );
}

// --- Empty / loading states --------------------------------------------------

export function BrandSpinner({ className = '' }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-brand-pink ${className}`}
    />
  );
}

export function BrandEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  ...rest
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-white/25 bg-white/[0.04] p-12 text-center backdrop-blur-sm ${className}`}
      {...rest}
    >
      {Icon && (
        <Icon className="mx-auto h-12 w-12 text-brand-orange" aria-hidden="true" />
      )}
      <h3 className="mt-4 font-display text-xl font-bold text-white">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md font-mono text-sm text-white/60">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export { SegmentedRule, OrbitRings, RING };
