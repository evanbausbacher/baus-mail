'use client';

import React, { useEffect } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** When true, the modal becomes a full-screen sheet on mobile (default true). */
  fullScreenOnMobile?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  fullScreenOnMobile = true,
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'lg:max-w-md',
    md: 'lg:max-w-2xl',
    lg: 'lg:max-w-4xl',
    xl: 'lg:max-w-6xl',
  };

  const mobileLayout = fullScreenOnMobile
    ? 'inset-0 lg:inset-auto lg:max-h-[90vh]'
    : 'inset-x-4 top-10 bottom-10 lg:inset-auto lg:max-h-[90vh]';

  return (
    <div
      className="fixed inset-0 z-50 flex lg:items-center lg:justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet / Modal */}
      <div
        className={clsx(
          'absolute bg-surface shadow-ios w-full lg:w-auto',
          'flex flex-col overflow-hidden',
          'lg:rounded-2xl lg:relative lg:max-w-full lg:m-4',
          mobileLayout,
          sizes[size]
        )}
      >
        {(title || true) && (
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-line pt-safe">
            <h2 className="text-base lg:text-lg font-semibold text-ink truncate">{title ?? ''}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="h-9 w-9 inline-flex items-center justify-center rounded-full text-ink-muted hover:bg-line/40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 pb-safe">{children}</div>
      </div>
    </div>
  );
}
