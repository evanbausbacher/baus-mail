import React from 'react';
import clsx from 'clsx';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-ink-muted mb-1.5">
          {label}
        </label>
      )}
      <select
        className={clsx(
          'w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink',
          'text-base appearance-none',
          'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60',
          'disabled:bg-line/30 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-200 focus:border-red-500',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
