import React from 'react';

const VARIANTS = {
  neutral: 'bg-content/10 text-content-muted',
  primary: 'border border-primary/30 bg-primary/15 text-primary',
  gold: 'border border-secondary/30 bg-secondary/15 text-secondary',
  success: 'border border-success/30 bg-success/15 text-success',
  danger: 'border border-danger/30 bg-danger/15 text-danger',
};

export default function Badge({
  variant = 'neutral',
  className = '',
  children,
  ...rest
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${VARIANTS[variant] || VARIANTS.neutral} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
