'use client';

import React, { useState } from 'react';
import { useDomains } from '@/hooks/useDomains';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export function DomainSwitcher() {
  const { domains, activeDomain, setActiveDomain, addDomain } = useDomains();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDomainChange = (domainId: string) => {
    const domain = domains.find((d) => d.id === domainId);
    if (domain) {
      setActiveDomain(domain);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await addDomain(newDomainName);
      setIsAddModalOpen(false);
      setNewDomainName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (domains.length === 0) {
    return (
      <div className="p-4">
        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full"
        >
          Add First Domain
        </Button>

        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Domain"
        >
          <form onSubmit={handleAddDomain} className="space-y-4">
            <Input
              label="Domain Name"
              type="text"
              placeholder="example.com"
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              required
            />

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Adding...' : 'Add Domain'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <Select
        options={domains.map((d) => ({
          value: d.id,
          label: d.name,
        }))}
        value={activeDomain?.id || ''}
        onChange={(e) => handleDomainChange(e.target.value)}
      />

      <Button
        variant="ghost"
        onClick={() => setIsAddModalOpen(true)}
        className="w-full text-sm"
      >
        + Add Domain
      </Button>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Domain"
      >
        <form onSubmit={handleAddDomain} className="space-y-4">
          <Input
            label="Domain Name"
            type="text"
            placeholder="example.com"
            value={newDomainName}
            onChange={(e) => setNewDomainName(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add Domain'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
