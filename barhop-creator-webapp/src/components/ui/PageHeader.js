import React from 'react';

export default function PageHeader({
  title,
  subtitle,
  actions,
  divider = true,
  className = '',
  ...rest
}) {
  return (
    <header
      className={`flex flex-wrap items-start justify-between gap-4 ${divider ? 'border-b border-edge pb-6' : ''} ${className}`}
      {...rest}
    >
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-content">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-content-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
