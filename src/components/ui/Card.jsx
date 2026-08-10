import React from 'react';
import clsx from 'clsx';

export default function Card({ children, className, padded = true, hover = false, ...rest }) {
  return (
    <div
      className={clsx(
        'bg-bg-surface border border-border rounded-lg shadow-card',
        'transition-all duration-200',
        hover && 'hover:border-border-light hover:shadow-elevated',
        padded && 'p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 mb-4', className)}>
      <div className="min-w-0">
        {title && <h3 className="font-display font-semibold text-text text-lg truncate">{title}</h3>}
        {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
