import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('bg-surface border border-line p-6 rounded-2xl shadow-ios', className)}>
      {children}
    </div>
  );
}
