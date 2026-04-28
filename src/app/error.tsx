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
  const showDetails = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-xl w-full bg-surface rounded-2xl border border-line shadow-ios p-6 space-y-3">
        <div className="text-xl font-semibold text-ink">Something went wrong</div>
        <div className="text-sm text-ink-muted whitespace-pre-wrap">
          {showDetails
            ? error.message
            : 'The request could not be completed. Check the server logs for details.'}
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
