'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDomains } from '@/hooks/useDomains';
import { useFolders } from '@/hooks/useFolders';
import type { Domain } from '@/types/domain';
import type { MailFolder } from '@/types/folder';
import { DomainAvatar } from '@/components/domain/DomainAvatar';
import { Check, Folder, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react';

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
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
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
  const { updateDomain, deleteDomain } = useDomains();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [fromAddresses, setFromAddresses] = useState(domain.fromAddresses);

  useEffect(() => {
    setFromAddresses(domain.fromAddresses);
  }, [domain.fromAddresses]);

  const handleIconChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.');
      return;
    }

    if (file.size > 256 * 1024) {
      setError('Icon must be 256 KB or smaller.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const iconUrl = await readFileAsDataUrl(file);
      await updateDomain(domain.id, { iconUrl });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload icon');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveIcon = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateDomain(domain.id, { iconUrl: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove icon');
    } finally {
      setSaving(false);
    }
  };

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

  const handleSetDefault = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateDomain(domain.id, { isDefault: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update default mailbox');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFromAddresses = async () => {
    const addresses = fromAddresses
      .map((address) => address.trim())
      .filter(Boolean);

    if (addresses.length === 0) {
      setError('Add at least one from address.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateDomain(domain.id, { fromAddresses: addresses });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save from addresses');
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="border-b border-line last:border-b-0 bg-surface">
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <DomainAvatar domain={domain} className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div className="min-w-0 truncate text-sm font-medium text-ink">{domain.name}</div>
              {domain.isDefault && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                  <Check className="h-3 w-3" />
                  Default
                </span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-ink-subtle">
              Server configured mailbox
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={handleIconChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="h-9 w-9"
            tooltip="Upload mailbox icon"
          >
            <Upload className="w-4 h-4" />
          </Button>
          {domain.iconUrl && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemoveIcon}
              disabled={saving}
              className="h-9 w-9"
              tooltip="Remove mailbox icon"
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          {!confirmingDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setConfirmingDelete(true)}
              className="h-9 w-9 text-red-600 hover:bg-red-50"
              tooltip="Delete cached mailbox data"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex flex-col items-end gap-1">
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
      </div>

        <div className="mt-4 space-y-4 pl-0 sm:pl-[52px]">
          <FromAddressEditor
            domainName={domain.name}
            addresses={fromAddresses}
            onChange={setFromAddresses}
            onSave={handleSaveFromAddresses}
            disabled={saving}
          />

          <Button
            type="button"
            variant={domain.isDefault ? 'secondary' : 'ghost'}
            size="sm"
            onClick={handleSetDefault}
            disabled={saving || domain.isDefault}
            className="w-full justify-center sm:w-auto"
          >
            {domain.isDefault ? 'Default mailbox' : 'Make default'}
          </Button>
        </div>
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

function FromAddressEditor({
  domainName,
  addresses,
  onChange,
  onSave,
  disabled,
}: {
  domainName: string;
  addresses: string[];
  onChange: (addresses: string[]) => void;
  onSave: () => void;
  disabled: boolean;
}) {
  const setAddress = (index: number, value: string) => {
    onChange(addresses.map((address, i) => (i === index ? value : address)));
  };

  const removeAddress = (index: number) => {
    const next = addresses.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : ['']);
  };

  const addAddress = () => {
    onChange([...addresses, '']);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium text-ink-muted">From addresses</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addAddress}
          disabled={disabled || addresses.length >= 20}
          className="min-h-8 px-2 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {addresses.map((address, index) => (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_40px] gap-2">
            <input
              type="text"
              inputMode="email"
              autoCapitalize="none"
              value={address}
              onChange={(e) => setAddress(index, e.target.value)}
              placeholder={`Your Name <support@${domainName}>`}
              className="h-10 min-w-0 rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeAddress(index)}
              disabled={disabled}
              className="h-10 w-10 text-ink-muted"
              tooltip="Remove from address"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onSave}
        disabled={disabled}
        className="w-full justify-center sm:w-auto"
      >
        <Save className="h-4 w-4" />
        Save addresses
      </Button>
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read icon'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read icon'));
    reader.readAsDataURL(file);
  });
}
