'use client';

import { Skeleton } from '@/components/ui/Skeleton';

export function EmailListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="border border-gray-200 bg-white p-3 space-y-2">
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

