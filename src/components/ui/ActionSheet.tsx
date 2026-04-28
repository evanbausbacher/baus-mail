'use client';

import React, { useEffect } from 'react';
import clsx from 'clsx';

interface ActionSheetProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function ActionSheet({ isOpen, title, onClose, children }: ActionSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:flex lg:items-center lg:justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/35" />
      <div
        className={clsx(
          'absolute inset-x-0 bottom-0 bg-surface shadow-sheet pb-safe',
          'rounded-t-2xl overflow-hidden lg:relative lg:inset-auto lg:w-full lg:max-w-sm lg:rounded-2xl'
        )}
      >
        {title && (
          <div className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-ink-subtle border-b border-line">
            {title}
          </div>
        )}
        <div className="p-2">{children}</div>
        <div className="p-2 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-xl text-accent font-semibold hover:bg-line/30"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function ActionSheetButton({
  children,
  onClick,
  tone = 'default',
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'w-full h-12 rounded-xl px-4 text-left text-[15px] font-medium hover:bg-line/30',
        tone === 'danger' ? 'text-red-600' : 'text-ink'
      )}
    >
      {children}
    </button>
  );
}
