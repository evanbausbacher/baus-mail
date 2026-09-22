'use client';

import { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, X } from 'lucide-react';
import type { ComposeDraft } from '@/lib/compose/draft';
import { ComposeForm } from './ComposeForm';

interface DesktopComposeWindowProps {
  isOpen: boolean;
  onClose: () => void;
  initial: ComposeDraft;
}

function getComposeTitle(initial: ComposeDraft): string {
  if (initial.mode === 'reply') return 'Reply';
  if (initial.mode === 'replyAll') return 'Reply All';
  if (initial.mode === 'forward') return 'Forward';
  return 'New message';
}

function OpenComposeWindow({ anchor, initial, onClose }: Omit<DesktopComposeWindowProps, 'isOpen'> & { anchor: HTMLElement }) {
  const [expanded, setExpanded] = useState(false);
  const [bounds, setBounds] = useState<DOMRect | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useLayoutEffect(() => {
    const measure = () => {
      const next = anchor.getBoundingClientRect();
      setBounds((previous) => previous && previous.x === next.x && previous.y === next.y
        && previous.width === next.width && previous.height === next.height ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(anchor);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [anchor]);

  useLayoutEffect(() => {
    if (!expanded) return;
    const root = rootRef.current;
    const dialog = dialogRef.current;
    if (!root || !dialog) return;
    const previousOverflow = document.body.style.overflow;
    const siblings = Array.from(document.body.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement && element !== root
    );
    const previousInert = siblings.map((element) => element.inert);
    siblings.forEach((element) => { element.inert = true; });
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]'
    )).filter((element) => element.getClientRects().length > 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setExpanded(false);
        toggleRef.current?.focus({ preventScroll: true });
      } else if (event.key === 'Tab') {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (!dialog.contains(event.target as Node)) toggleRef.current?.focus({ preventScroll: true });
    };
    if (!dialog.contains(document.activeElement)) toggleRef.current?.focus({ preventScroll: true });
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocus);
    return () => {
      siblings.forEach((element, index) => { element.inert = previousInert[index]; });
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocus);
    };
  }, [expanded]);

  if (!bounds) return null;
  const toggleLabel = expanded ? 'Restore compose window' : 'Expand compose window';

  return createPortal(
    <div ref={rootRef} className={`pointer-events-none fixed inset-0 ${expanded ? 'z-50' : 'z-30'}`}>
      <div aria-hidden="true" className={expanded ? 'pointer-events-auto absolute inset-0 bg-ink/40' : 'hidden'} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal={expanded || undefined}
        aria-labelledby={titleId}
        className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_18px_48px_rgba(15,23,42,0.18)]"
        style={expanded ? {
          width: 'min(1120px, calc(100vw - 64px))', height: 'calc(100dvh - 64px)',
          left: '50%', top: '32px', transform: 'translateX(-50%)',
        } : {
          width: Math.min(640, Math.max(0, bounds.width - 48)),
          height: Math.min(window.innerHeight * 0.78, 760, Math.max(0, bounds.height - 48)),
          right: window.innerWidth - bounds.right + 24,
          bottom: window.innerHeight - bounds.bottom + 24,
        }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-line bg-canvas/60 px-5 py-3">
          <div id={titleId} className="text-sm font-semibold text-ink">{getComposeTitle(initial)}</div>
          <div className="flex items-center gap-1">
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-label={toggleLabel}
              title={toggleLabel}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-line/50 hover:text-ink"
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              title="Close"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-line/50 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <ComposeForm initial={initial} mode="desktop" onClose={onClose} />
      </div>
    </div>,
    document.body
  );
}

export function DesktopComposeWindow({ isOpen, onClose, initial }: DesktopComposeWindowProps) {
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <div ref={setAnchor} className="pointer-events-none absolute inset-0" aria-hidden="true" />
      {isOpen && anchor ? <OpenComposeWindow anchor={anchor} initial={initial} onClose={onClose} /> : null}
    </>
  );
}
