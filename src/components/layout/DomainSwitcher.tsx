'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronDown } from 'lucide-react';
import { useDomains } from '@/hooks/useDomains';
import { DomainAvatar } from '@/components/domain/DomainAvatar';

/**
 * Desktop sidebar domain switcher. Domains come from RESEND_DOMAIN_API_KEYS;
 * deleting clears cached local data until the next config sync recreates it.
 */
export function DomainSwitcher() {
  const { domains, activeDomain, setActiveDomain, error } = useDomains();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const handleDomainChange = (domainId: string) => {
    const domain = domains.find((d) => d.id === domainId);
    if (domain) {
      setActiveDomain(domain);
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  if (domains.length === 0) {
    return (
      <div className="px-4 py-3 border-b border-line">
        <p className="text-sm font-medium text-ink">No mailboxes configured</p>
        <p className="mt-1 text-xs leading-5 text-ink-subtle">
          Set <span className="font-mono text-ink-muted">RESEND_DOMAIN_API_KEYS</span> on the server.
        </p>
        {error && <p className="mt-2 text-xs leading-5 text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative px-4 py-3 border-b border-line">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex h-11 w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 text-left text-sm text-ink transition-colors hover:bg-line/30"
      >
        {activeDomain ? (
          <>
            <DomainAvatar domain={activeDomain} className="h-7 w-7 text-xs" />
            <span className="min-w-0 flex-1 truncate font-medium">{activeDomain.name}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-ink-muted">Select mailbox</span>
        )}
        <ChevronDown
          className={clsx('h-4 w-4 shrink-0 text-ink-muted transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="absolute left-4 right-4 top-[calc(100%-8px)] z-30 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
          {domains.map((domain) => {
            const selected = activeDomain?.id === domain.id;
            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => handleDomainChange(domain.id)}
                className={clsx(
                  'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors',
                  selected ? 'bg-accent/10 text-accent' : 'text-ink hover:bg-line/40'
                )}
              >
                <DomainAvatar
                  domain={domain}
                  className={clsx('h-8 w-8 text-xs', selected ? 'bg-accent/15 text-accent' : 'bg-line text-ink-muted')}
                />
                <span className="min-w-0 flex-1 truncate font-medium">{domain.name}</span>
                {selected && <Check className="h-4 w-4 shrink-0 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
