import React from 'react';

const SIZES = {
  sm: 'h-5 w-5',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-edge border-t-primary ${SIZES[size] || SIZES.md} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <Spinner />
    </div>
  );
}
