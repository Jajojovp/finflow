import React from 'react';
import clsx from 'clsx';

export function Skeleton({ className, rounded = 'rounded-lg' }) {
  return <div className={clsx('animate-pulse bg-bg-hover', rounded, className)} />;
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={clsx('h-3', i === lines - 1 && 'w-2/3')} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-bg-surface border border-border rounded-lg p-5 space-y-4">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <SkeletonText lines={2} />
    </div>
  );
}

export default Skeleton;