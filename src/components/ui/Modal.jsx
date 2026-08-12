import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  className,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      if (dialog.open) dialog.close();
      document.body.style.overflow = '';
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => onClose?.();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in bg-transparent [&::backdrop]:bg-black/60 [&::backdrop]:backdrop-blur-sm"
    >
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-label="Close modal"
      />
      <div
        className={clsx(
          'relative w-full bg-bg-surface border border-border rounded-xl shadow-elevated',
          'animate-slide-up flex flex-col max-h-[90vh]',
          SIZES[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
          <div className="min-w-0">
            {title && <h2 className="font-display font-semibold text-text text-lg">{title}</h2>}
            {description && <p className="text-sm text-text-muted mt-1">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-1.5 rounded-md text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 p-5 border-t border-border">{footer}</div>}
      </div>
    </dialog>,
    document.body,
  );
}
