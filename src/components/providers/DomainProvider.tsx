'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Domain } from '@/types/domain';

interface DomainContextType {
  domains: Domain[];
  activeDomain: Domain | null;
  isLoading: boolean;
  error: string | null;
  setActiveDomain: (domain: Domain) => void;
  refreshDomains: () => Promise<void>;
  addDomain: (name: string) => Promise<Domain>;
  updateDomain: (id: string, updates: { name?: string; isActive?: boolean }) => Promise<void>;
  deleteDomain: (id: string) => Promise<void>;
}

const DomainContext = createContext<DomainContextType | undefined>(undefined);

export function DomainProvider({ children }: { children: React.ReactNode }) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [activeDomain, setActiveDomainState] = useState<Domain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch domains from API
  const refreshDomains = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/domains');
      if (!response.ok) {
        throw new Error('Failed to fetch domains');
      }

      const data = await response.json();
      setDomains(data.domains);

      setActiveDomainState((prev) => {
        if (!prev) return data.domains[0] || null;
        const stillExists = data.domains.some((d: Domain) => d.id === prev.id);
        return stillExists ? prev : (data.domains[0] || null);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch domains');
      console.error('Error fetching domains:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new domain
  const addDomain = useCallback(async (name: string): Promise<Domain> => {
    const response = await fetch('/api/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add domain');
    }

    const data = await response.json();
    await refreshDomains();
    return data.domain;
  }, [refreshDomains]);

  // Update a domain
  const updateDomain = useCallback(async (
    id: string,
    updates: { name?: string; isActive?: boolean }
  ) => {
    const response = await fetch(`/api/domains/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update domain');
    }

    await refreshDomains();
  }, [refreshDomains]);

  // Delete a domain
  const deleteDomain = useCallback(async (id: string) => {
    const response = await fetch(`/api/domains/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete domain');
    }

    await refreshDomains();
  }, [refreshDomains]);

  // Set active domain
  const setActiveDomain = useCallback((domain: Domain) => {
    setActiveDomainState(domain);
  }, []);

  // Initial load
  useEffect(() => {
    refreshDomains();
  }, [refreshDomains]);

  const value: DomainContextType = {
    domains,
    activeDomain,
    isLoading,
    error,
    setActiveDomain,
    refreshDomains,
    addDomain,
    updateDomain,
    deleteDomain,
  };

  return (
    <DomainContext.Provider value={value}>
      {children}
    </DomainContext.Provider>
  );
}

// Custom hook to use the domain context
export function useDomains() {
  const context = useContext(DomainContext);
  if (context === undefined) {
    throw new Error('useDomains must be used within a DomainProvider');
  }
  return context;
}
