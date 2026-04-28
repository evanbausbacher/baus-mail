'use client';

import React, { useState } from 'react';
import { useDomains } from '@/hooks/useDomains';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

/**
 * Desktop sidebar domain switcher. On mobile, the drawer renders its own
 * domain list so this component is desktop-only.
 */
export function DomainSwitcher() {
  const { domains, activeDomain, setActiveDomain, addDomain } = useDomains();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainApiKey, setNewDomainApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDomainChange = (domainId: string) => {
    const domain = domains.find((d) => d.id === domainId);
    if (domain) setActiveDomain(domain);
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await addDomain(newDomainName, newDomainApiKey);
      setIsAddModalOpen(false);
      setNewDomainName('');
      setNewDomainApiKey('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSelector = domains.length > 0;

  return (
    <div className="px-4 py-3 border-b border-line">
      {showSelector ? (
        <Select
          options={domains.map((d) => ({ value: d.id, label: d.name }))}
          value={activeDomain?.id || ''}
          onChange={(e) => handleDomainChange(e.target.value)}
        />
      ) : null}

      <Button
        variant="ghost"
        onClick={() => setIsAddModalOpen(true)}
        className="w-full mt-2 text-sm"
      >
        {showSelector ? '+ Add mailbox' : 'Add first mailbox'}
      </Button>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add mailbox"
        fullScreenOnMobile={false}
      >
        <form onSubmit={handleAddDomain} className="space-y-4">
          <Input
            label="Domain"
            type="text"
            placeholder="example.com"
            value={newDomainName}
            onChange={(e) => setNewDomainName(e.target.value)}
            required
          />
          <Input
            label="Resend API key"
            type="password"
            placeholder="re_xxxxxxxxxxxxx"
            value={newDomainApiKey}
            onChange={(e) => setNewDomainApiKey(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="primary" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Adding…' : 'Add mailbox'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
