'use client';

import React, { useState } from 'react';
import { useDomains } from '@/hooks/useDomains';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Trash2 } from 'lucide-react';

export function DomainSwitcher() {
  const { domains, activeDomain, setActiveDomain, deleteDomain, error } = useDomains();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDomainChange = (domainId: string) => {
    const domain = domains.find((d) => d.id === domainId);
    if (domain) {
      setActiveDomain(domain);
    }
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
      <div className="border-b border-gray-200 px-4 py-3">
        <p className="text-sm font-medium text-gray-900">No domains configured</p>
        <p className="mt-1 text-xs leading-5 text-gray-600">
          Set <span className="font-mono text-gray-800">RESEND_DOMAIN_API_KEYS</span> on the server to show domains here.
        </p>
        {error && (
          <p className="mt-2 text-xs leading-5 text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <Select
          options={domains.map((d) => ({
            value: d.id,
            label: d.name,
          }))}
          value={activeDomain?.id || ''}
          onChange={(e) => handleDomainChange(e.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="md"
          className="shrink-0 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
          tooltip="Delete domain data"
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
        title="Delete domain data"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Delete all cached email and sync data for{' '}
            <span className="font-medium text-gray-900">{activeDomain?.name}</span>?
          </p>
          <p className="text-xs leading-5 text-gray-500">
            The domain will remain available while it exists in RESEND_DOMAIN_API_KEYS.
          </p>

          {deleteError && (
            <p className="text-sm text-red-600">{deleteError}</p>
          )}

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
