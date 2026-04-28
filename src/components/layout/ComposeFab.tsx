'use client';

import { PenSquare } from 'lucide-react';

interface ComposeFabProps {
  onCompose: () => void;
  visible?: boolean;
}

export function ComposeFab({ onCompose, visible = true }: ComposeFabProps) {
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={onCompose}
      aria-label="Compose new email"
      className="lg:hidden fixed right-5 bottom-5 z-30 h-14 w-14 rounded-full bg-accent text-white shadow-fab inline-flex items-center justify-center active:scale-95 transition-transform"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <PenSquare className="w-6 h-6" />
    </button>
  );
}
