'use client';

import React, { useState } from 'react';
import { useDomains } from '@/hooks/useDomains';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Trash2 } from 'lucide-react';

/**
 * Desktop sidebar domain switcher. Domains come from RESEND_DOMAIN_API_KEYS;
 * deleting clears cached local data until the next config sync recreates it.
 */
export function DomainSwitcher() {
  const { domains, activeDomain, setActiveDomain, deleteDomain, error } = useDomains();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDomainChange = (domainId: string) => {
    const domain = domains.find((d) => d.id === domainId);
    if (domain) setActiveDomain(domain);
  };

  const handleDeleteDomain = async () => {
    if (!activeDomain) return;

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteDomain(activeDomain.id);
      setIsConfirmOpen(false);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete domain');
    } finally {
      setIsDeleting(false);
    }
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
      <div className="flex items-center gap-2">
        <Select
          options={domains.map((d) => ({ value: d.id, label: d.name }))}
          value={activeDomain?.id || ''}
          onChange={(e) => handleDomainChange(e.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="md"
          className="shrink-0 px-3 text-red-600 hover:bg-red-50"
          tooltip="Delete cached domain data"
          disabled={!activeDomain}
          onClick={() => {
            setDeleteError(null);
            setIsConfirmOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => {
          if (!isDeleting) setIsConfirmOpen(false);
        }}
        title="Delete mailbox data"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Delete all cached email and sync data for{' '}
            <span className="font-medium text-ink">{activeDomain?.name}</span>?
          </p>
          <p className="text-xs leading-5 text-ink-subtle">
            The mailbox will reappear while it remains in RESEND_DOMAIN_API_KEYS.
          </p>

          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isDeleting}
              onClick={() => setIsConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={isDeleting || !activeDomain}
              onClick={handleDeleteDomain}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
