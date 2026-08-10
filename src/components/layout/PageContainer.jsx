import React from 'react';
import clsx from 'clsx';

export default function PageContainer({ title, description, actions, children, className, maxWidth = 'full' }) {
  const widthClass = maxWidth === 'full' ? 'w-full' : 'max-w-4xl mx-auto';
  return (
    <div className={clsx('px-4 sm:px-6 py-6', widthClass, className)}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            {title && <h2 className="font-display font-bold text-text text-xl sm:text-2xl">{title}</h2>}
            {description && <p className="text-sm text-text-muted mt-1 max-w-2xl">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}