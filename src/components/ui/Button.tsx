import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
  tooltip?: string;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  tooltip,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all ' +
    'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover shadow-sm',
    secondary: 'bg-surface text-ink border border-line hover:bg-line/40',
    ghost: 'bg-transparent text-ink-muted hover:bg-line/40',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-9',
    md: 'px-4 py-2 text-sm min-h-11',
    lg: 'px-6 py-3 text-base min-h-12',
    icon: 'h-11 w-11 p-0',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  );
}
