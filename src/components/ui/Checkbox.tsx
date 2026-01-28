import React from 'react';
import clsx from 'clsx';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className={clsx(
          'w-4 h-4 border-2 border-gray-300 bg-white',
          'checked:bg-accent checked:border-accent',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
          'cursor-pointer',
          className
        )}
        {...props}
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
