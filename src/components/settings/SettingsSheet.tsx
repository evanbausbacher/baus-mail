'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useDomains } from '@/hooks/useDomains';
import type { Domain } from '@/types/domain';
import { ChevronDown, ChevronRight, Plus, Trash2, X } from 'lucide-react';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDomain: () => void;
}

export function SettingsSheet({ isOpen, onClose, onAddDomain }: SettingsSheetProps) {
  const { domains } = useDomains();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-ink">Mailboxes</h3>
              <p className="text-xs text-ink-subtle mt-0.5">Manage your domains and send-as addresses.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={onAddDomain}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>

          {domains.length === 0 ? (
            <div className="rounded-xl border border-line bg-canvas/30 px-4 py-6 text-center text-sm text-ink-muted">
              No mailboxes yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {domains.map((domain) => (
                <DomainRow
                  key={domain.id}
                  domain={domain}
                  expanded={expandedId === domain.id}
                  onToggle={() => setExpandedId((prev) => (prev === domain.id ? null : domain.id))}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="pt-2 border-t border-line">
          <h3 className="text-base font-semibold text-ink mb-2">Account</h3>
          <a
            href="/api/auth/signout"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium border border-line bg-surface hover:bg-line/40 text-ink"
          >
            Sign out
          </a>
        </section>
      </div>
    </Modal>
  );
}

function DomainRow({
  domain,
  expanded,
  onToggle,
}: {
  domain: Domain;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { updateDomain, deleteDomain } = useDomains();
  const initial = useMemo(() => domain.aliases ?? [], [domain.aliases]);
  const [aliases, setAliases] = useState<string[]>(initial);
  const [aliasInput, setAliasInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setAliases(initial);
  }, [initial]);

  const dirty = useMemo(() => {
    if (aliases.length !== initial.length) return true;
    return aliases.some((a, i) => a !== initial[i]);
  }, [aliases, initial]);

  const addAlias = () => {
    const v = aliasInput.trim();
    if (!v || aliases.includes(v)) return;
    setAliases((prev) => [...prev, v]);
    setAliasInput('');
  };

  const removeAlias = (a: string) => {
    setAliases((prev) => prev.filter((x) => x !== a));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateDomain(domain.id, { aliases });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
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

  return (
    <li className="rounded-xl border border-line bg-surface overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-line/30"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-ink-muted shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-ink truncate">{domain.name}</div>
          <div className="text-xs text-ink-subtle truncate">
            {(domain.aliases?.length ?? 0) > 0
              ? `${domain.aliases!.length} send-as ${domain.aliases!.length === 1 ? 'address' : 'addresses'}`
              : 'No send-as addresses'}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-line bg-canvas/30">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1.5">
              Send-as addresses
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="you@domain.com"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addAlias();
                  }
                }}
                className="flex-1"
              />
              <Button type="button" variant="secondary" onClick={addAlias} disabled={!aliasInput.trim()}>
                Add
              </Button>
            </div>
            {aliases.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {aliases.map((a, i) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-line/50 text-sm text-ink"
                  >
                    {i === 0 && (
                      <span className="text-[10px] uppercase tracking-wide text-ink-muted mr-1">default</span>
                    )}
                    {a}
                    <button
                      type="button"
                      onClick={() => removeAlias(a)}
                      className="h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-line"
                      aria-label={`Remove ${a}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!dirty || saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            {!confirmingDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(true)}
                className="text-red-600 hover:bg-red-50 ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                Remove mailbox
              </Button>
            ) : (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-ink-muted">Are you sure?</span>
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
      )}
    </li>
  );
}
