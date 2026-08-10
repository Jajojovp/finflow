import React, { forwardRef, useId } from 'react';
import clsx from 'clsx';

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    icon,
    className,
    inputClassName,
    id,
    type = 'text',
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={clsx(
            'w-full h-10 rounded-lg bg-bg border text-text placeholder:text-text-dim',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            icon ? 'pl-9 pr-3' : 'px-3',
            error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-border',
            inputClassName,
          )}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-danger-light">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-text-dim">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
