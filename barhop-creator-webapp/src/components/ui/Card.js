import React from 'react';

export default function Card({
  as: Tag = 'div',
  padding = 'p-8',
  interactive = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'rounded-2xl border border-edge bg-surface-raised shadow-card',
    padding,
    interactive &&
      'transition duration-200 hover:-translate-y-0.5 hover:border-edge-strong hover:shadow-card-hover motion-reduce:transform-none',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
