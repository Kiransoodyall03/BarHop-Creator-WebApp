import React, { forwardRef } from 'react';

const CONTROL =
  'w-full rounded-lg border border-edge bg-surface px-4 py-2.5 text-content placeholder:text-content-faint transition-colors focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50';

export function Label({ className = '', children, ...rest }) {
  return (
    <label
      className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider text-content-faint ${className}`}
      {...rest}
    >
      {children}
    </label>
  );
}

export const Input = forwardRef(function Input(
  { className = '', ...rest },
  ref
) {
  return <input ref={ref} className={`${CONTROL} ${className}`} {...rest} />;
});

export const Select = forwardRef(function Select(
  { className = '', children, ...rest },
  ref
) {
  return (
    <select ref={ref} className={`${CONTROL} ${className}`} {...rest}>
      {children}
    </select>
  );
});

export const Textarea = forwardRef(function Textarea(
  { className = '', ...rest },
  ref
) {
  return <textarea ref={ref} className={`${CONTROL} ${className}`} {...rest} />;
});
