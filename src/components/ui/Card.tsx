import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('bg-white border border-gray-200 p-6 shadow-sm', className)}>
      {children}
    </div>
  );
}
