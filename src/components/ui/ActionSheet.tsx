'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface ActionSheetProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function ActionSheet({ isOpen, title, onClose, children }: ActionSheetProps) {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] lg:flex lg:items-center lg:justify-center" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/35 backdrop-blur-[1px]" />
      <div
        className={clsx(
          'absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] bg-surface shadow-sheet',
          'max-h-[min(70dvh,440px)] overflow-y-auto rounded-2xl',
          'lg:relative lg:inset-auto lg:w-full lg:max-w-sm'
        )}
      >
        {title && (
          <div className="sticky top-0 bg-surface px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-ink-subtle border-b border-line">
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
    </div>,
    document.body
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
