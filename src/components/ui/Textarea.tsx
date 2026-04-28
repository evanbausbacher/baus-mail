'use client';

import React from 'react';
import clsx from 'clsx';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-ink-muted mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={clsx(
          'w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink',
          'placeholder:text-ink-subtle text-base resize-y',
          'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60',
          'disabled:bg-line/30 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-200 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
