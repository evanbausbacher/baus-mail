import React from 'react';
import clsx from 'clsx';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        className={clsx(
          'w-5 h-5 rounded-md border-2 border-line bg-surface',
          'checked:bg-accent checked:border-accent',
          'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-0',
          'cursor-pointer',
          className
        )}
        {...props}
      />
      {label && <span className="text-sm text-ink-muted">{label}</span>}
    </label>
  );
}
