'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useDomains } from '@/hooks/useDomains';
import type { Domain } from '@/types/domain';
import { Trash2 } from 'lucide-react';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  const { domains, error } = useDomains();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        <section>
          <div className="mb-3">
            <h3 className="text-base font-semibold text-ink">Mailboxes</h3>
            <p className="text-xs text-ink-subtle mt-0.5">
              Domains are configured with RESEND_DOMAIN_API_KEYS on the server.
            </p>
          </div>

          {error && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {domains.length === 0 ? (
            <div className="rounded-xl border border-line bg-canvas/30 px-4 py-6 text-center text-sm text-ink-muted">
              No mailboxes configured.
            </div>
          ) : (
            <ul className="space-y-2">
              {domains.map((domain) => (
                <DomainRow key={domain.id} domain={domain} />
              ))}
            </ul>
          )}
        </section>

        <section className="pt-2 border-t border-line">
          <h3 className="text-base font-semibold text-ink mb-2">Account</h3>
          <Link
            href="/api/auth/signout"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium border border-line bg-surface hover:bg-line/40 text-ink"
          >
            Sign out
          </Link>
        </section>
      </div>
    </Modal>
  );
}

function DomainRow({ domain }: { domain: Domain }) {
  const { deleteDomain } = useDomains();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDelete = async () => {
    setSaving(true);
    setError(null);
    try {
      await deleteDomain(domain.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
      setSaving(false);
    }
  };

  return (
    <li className="rounded-xl border border-line bg-surface overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-ink truncate">{domain.name}</div>
          <div className="text-xs text-ink-subtle truncate">
            Server configured mailbox
          </div>
        </div>

        {!confirmingDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmingDelete(true)}
            className="text-red-600 hover:bg-red-50"
            tooltip="Delete cached mailbox data"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={saving}>
              Delete
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setConfirmingDelete(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {confirmingDelete && (
        <div className="border-t border-line bg-canvas/30 px-4 py-3 text-xs leading-5 text-ink-subtle">
          This deletes cached email and sync data. The mailbox will reappear while it remains in RESEND_DOMAIN_API_KEYS.
        </div>
      )}

      {error && <p className="px-4 pb-3 text-sm text-red-600">{error}</p>}
    </li>
  );
}
