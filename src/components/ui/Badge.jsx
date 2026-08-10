import React from 'react';
import clsx from 'clsx';

const TONES = {
  neutral: 'bg-bg-hover text-text-muted border-border-light',
  primary: 'bg-primary/10 text-primary-light border-primary/30',
  success: 'bg-success/10 text-success-light border-success/30',
  danger: 'bg-danger/10 text-danger-light border-danger/30',
  warning: 'bg-warning/10 text-warning-light border-warning/30',
  accent: 'bg-accent/10 text-accent-light border-accent/30',
};

const SIZES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export default function Badge({ children, tone = 'neutral', size = 'md', dot = false, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        TONES[tone],
        SIZES[size],
        className,
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
