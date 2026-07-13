import React from 'react';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  ...rest
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-edge-strong bg-surface-raised p-12 text-center ${className}`}
      {...rest}
    >
      {Icon && <Icon className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />}
      <h3 className="mt-4 font-display text-lg font-semibold text-content">
        {title}
      </h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-content-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
