'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useDomains } from '@/hooks/useDomains';
import { X } from 'lucide-react';

interface AddDomainSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDomainSheet({ isOpen, onClose }: AddDomainSheetProps) {
  const { addDomain } = useDomains();
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [aliases, setAliases] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setApiKey('');
    setAliasInput('');
    setAliases([]);
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const addAlias = () => {
    const trimmed = aliasInput.trim();
    if (!trimmed) return;
    if (aliases.includes(trimmed)) return;
    setAliases((prev) => [...prev, trimmed]);
    setAliasInput('');
  };

  const removeAlias = (a: string) => {
    setAliases((prev) => prev.filter((x) => x !== a));
  };

  const handleAliasKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addAlias();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Capture any pending typed alias before submit
      const pending = aliasInput.trim();
      const finalAliases = pending && !aliases.includes(pending) ? [...aliases, pending] : aliases;
      await addDomain(name.trim(), apiKey.trim(), finalAliases.length ? finalAliases : undefined);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add mailbox');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add mailbox">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Domain"
          type="text"
          placeholder="example.com"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
        <Input
          label="Resend API key"
          type="password"
          placeholder="re_xxxxxxxxxxxx"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1.5">
            Send-as addresses (optional)
          </label>
          <p className="text-xs text-ink-subtle mb-2">
            Add the addresses you&apos;ll send from. The first one becomes the default.
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="evan@example.com"
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              onKeyDown={handleAliasKey}
              className="flex-1"
            />
            <Button type="button" variant="secondary" onClick={addAlias} disabled={!aliasInput.trim()}>
              Add
            </Button>
          </div>
          {aliases.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {aliases.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-line/40 text-sm text-ink"
                >
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

        <div className="flex gap-2 pt-2">
          <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
            {submitting ? 'Adding…' : 'Add mailbox'}
          </Button>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
