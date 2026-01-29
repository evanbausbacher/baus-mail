'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-xl w-full bg-white border border-gray-200 p-6 space-y-3">
        <div className="text-xl font-bold text-gray-900">Something went wrong</div>
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {error.message}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button variant="secondary" onClick={reset}>
            Try again
          </Button>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    </div>
  );
}

