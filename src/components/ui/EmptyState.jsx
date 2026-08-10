import React from 'react';
import { Inbox } from 'lucide-react';
import clsx from 'clsx';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description,
  action,
  className,
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center gap-3 py-12 px-6',
        className,
      )}
    >
      <span className="w-12 h-12 rounded-full bg-bg-hover text-text-dim flex items-center justify-center">
        <Icon size={22} strokeWidth={1.6} />
      </span>
      <h3 className="font-display font-semibold text-text text-base mt-1">{title}</h3>
      {description && <p className="text-sm text-text-muted max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}