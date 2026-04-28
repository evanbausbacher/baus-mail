'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDomains } from '@/hooks/useDomains';
import { useFolders } from '@/hooks/useFolders';
import type { Domain } from '@/types/domain';
import type { MailFolder } from '@/types/folder';
import { Folder, Pencil, Trash2 } from 'lucide-react';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  const { domains, error } = useDomains();
  const { folders, createFolder } = useFolders();
  const [newFolderName, setNewFolderName] = useState('');
  const [folderError, setFolderError] = useState<string | null>(null);
  const [savingFolder, setSavingFolder] = useState(false);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setSavingFolder(true);
    setFolderError(null);
    try {
      await createFolder(newFolderName);
      setNewFolderName('');
    } catch (e) {
      setFolderError(e instanceof Error ? e.message : 'Failed to create folder');
    } finally {
      setSavingFolder(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="sm">
      <div className="space-y-7 lg:space-y-6">
        <section>
          <div className="mb-3 px-1">
            <h3 className="text-[15px] font-semibold text-ink">Mailboxes</h3>
            <p className="text-xs leading-5 text-ink-subtle mt-0.5">
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
            <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
              {domains.map((domain) => (
                <DomainRow key={domain.id} domain={domain} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 px-1">
            <h3 className="text-[15px] font-semibold text-ink">Folders</h3>
            <p className="text-xs leading-5 text-ink-subtle mt-0.5">
              Custom folders are local to this mailbox.
            </p>
          </div>

          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <div className="flex-1">
              <Input
                label="New folder"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Receipts"
                className="h-11 text-sm"
              />
            </div>
            <Button type="button" size="md" className="h-11 min-h-0 px-4" onClick={handleCreateFolder} disabled={savingFolder || !newFolderName.trim()}>
              Add
            </Button>
          </div>

          {folderError && <p className="mt-2 text-sm text-red-600">{folderError}</p>}

          {folders.length > 0 ? (
            <ul className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
              {folders.map((folder) => (
                <FolderRow key={folder.id} folder={folder} />
              ))}
            </ul>
          ) : (
            <div className="mt-3 rounded-2xl border border-line bg-canvas/40 px-4 py-4 text-center text-sm text-ink-muted">
              No custom folders yet.
            </div>
          )}
        </section>

        <section>
          <h3 className="text-[15px] font-semibold text-ink mb-3 px-1">Account</h3>
          <Link
            href="/api/auth/signout"
            className="inline-flex h-11 items-center justify-center px-4 rounded-xl text-sm font-medium border border-line bg-surface hover:bg-line/40 text-ink"
          >
            Sign out
          </Link>
        </section>
      </div>
    </Modal>
  );
}

function FolderRow({ folder }: { folder: MailFolder }) {
  const { renameFolder, deleteFolder } = useFolders();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(folder.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRename = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await renameFolder(folder.id, name);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to rename folder');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError(null);
    try {
      await deleteFolder(folder.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete folder');
      setSaving(false);
    }
  };

  return (
    <li className="border-b border-line last:border-b-0 bg-surface">
      <div className="flex items-center gap-3 px-4 py-3 min-h-[58px]">
        <Folder className="w-4 h-4 text-ink-muted shrink-0" />
        {editing ? (
          <input
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        ) : (
          <div className="min-w-0 flex-1 text-sm font-medium text-ink truncate">{folder.name}</div>
        )}
        {editing ? (
          <>
            <Button type="button" size="sm" onClick={handleRename} disabled={saving || !name.trim()}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setEditing(false); setName(folder.name); }} disabled={saving}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)} disabled={saving} tooltip="Rename folder">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleDelete} disabled={saving} className="text-red-600 hover:bg-red-50" tooltip="Delete folder">
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
      {error && <p className="px-4 pb-3 text-sm text-red-600">{error}</p>}
    </li>
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
    <li className="border-b border-line last:border-b-0 bg-surface">
      <div className="flex items-center gap-3 px-4 py-3 min-h-[58px]">
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
