'use client';

import clsx from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-gray-200 animate-pulse', className)} />
  );
}

