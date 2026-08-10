import React from 'react';
import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-primary hover:bg-primary-dark text-white shadow-glow-primary',
  secondary: 'bg-bg-surface hover:bg-bg-hover text-text border border-border-light',
  ghost: 'hover:bg-bg-hover text-text-muted hover:text-text',
  danger: 'bg-danger hover:bg-danger-light text-white',
  success: 'bg-success hover:bg-success-light text-white',
  outline: 'border border-primary text-primary hover:bg-primary hover:text-white',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-12 px-6 text-base rounded-lg',
  icon: 'h-10 w-10 rounded-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:scale-[0.98]',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
