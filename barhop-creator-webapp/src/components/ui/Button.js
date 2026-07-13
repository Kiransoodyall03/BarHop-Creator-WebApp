import React from 'react';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-hover hover:shadow-glow-primary',
  secondary:
    'border border-edge-strong text-content hover:border-primary/60 hover:text-primary',
  ghost: 'text-content-muted hover:bg-content/5 hover:text-content',
  danger: 'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20',
};

const SIZES = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3',
};

// String builder for non-button elements (e.g. react-router <Link>).
export function buttonClasses(variant = 'primary', size = 'md', extra = '') {
  return [BASE, VARIANTS[variant] || VARIANTS.primary, SIZES[size] || SIZES.md, extra]
    .filter(Boolean)
    .join(' ');
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
