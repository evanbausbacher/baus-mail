'use client';

import { Skeleton } from '@/components/ui/Skeleton';

export function EmailListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="rounded-2xl border border-line bg-surface p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

