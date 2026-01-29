'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Something went wrong',
    };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('UI crashed:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-xl w-full bg-white border border-gray-200 p-6 space-y-3">
          <div className="text-xl font-bold text-gray-900">Something went wrong</div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {this.state.errorMessage}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Reload
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

