'use client';

import React, { useState } from 'react';
import { useDomains } from '@/hooks/useDomains';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function DomainSwitcher() {
  const { domains, activeDomain, setActiveDomain, addDomain } = useDomains();
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
      setNewDomainName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (domains.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <div className="space-y-2 text-sm text-gray-700">
          <p className="font-medium text-gray-900">Configure a domain</p>
          <p>
            Add the domain and its Resend API key to the server-only
            RESEND_DOMAIN_API_KEYS environment variable, then register the same
            domain here.
          </p>
          <code className="block whitespace-pre-wrap bg-gray-100 px-3 py-2 text-xs text-gray-800">
            {'{"example.com":"<resend-api-key-for-example.com>"}'}
          </code>
        </div>

        <form onSubmit={handleAddDomain} className="space-y-3">
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

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Registering...' : 'Register Domain'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Select
        options={domains.map((d) => ({
          value: d.id,
          label: d.name,
        }))}
        value={activeDomain?.id || ''}
        onChange={(e) => handleDomainChange(e.target.value)}
      />
    </div>
  );
}
