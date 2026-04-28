'use client';

import React from 'react';
import { useDomains } from '@/hooks/useDomains';
import { Select } from '@/components/ui/Select';

/**
 * Desktop sidebar domain switcher. Domains come from RESEND_DOMAIN_API_KEYS;
 * deleting clears cached local data until the next config sync recreates it.
 */
export function DomainSwitcher() {
  const { domains, activeDomain, setActiveDomain, error } = useDomains();

  const handleDomainChange = (domainId: string) => {
    const domain = domains.find((d) => d.id === domainId);
    if (domain) setActiveDomain(domain);
  };

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
    <div className="px-4 py-3 border-b border-line">
      <Select
        options={domains.map((d) => ({ value: d.id, label: d.name }))}
        value={activeDomain?.id || ''}
        onChange={(e) => handleDomainChange(e.target.value)}
      />
    </div>
  );
}
