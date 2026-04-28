'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useDomains } from '@/hooks/useDomains';
import type { MailFolder } from '@/types/folder';

function hydrateFolder(raw: unknown): MailFolder {
  const base = raw as Omit<MailFolder, 'createdAt' | 'updatedAt'> & {
    createdAt: unknown;
    updatedAt: unknown;
  };

  const toDate = (value: unknown) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return new Date(String(value));
  };

  return {
    ...base,
    createdAt: toDate(base.createdAt),
    updatedAt: toDate(base.updatedAt),
  };
}

interface FolderContextType {
  folders: MailFolder[];
  isLoading: boolean;
  error: string | null;
  refreshFolders: () => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export function FolderProvider({ children }: { children: React.ReactNode }) {
  const { activeDomain } = useDomains();
  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFolders = useCallback(async () => {
    if (!activeDomain) {
      setFolders([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/folders?${new URLSearchParams({ domainId: activeDomain.id })}`);
      if (!response.ok) throw new Error('Failed to load folders');
      const data = await response.json();
      setFolders((data.folders || []).map(hydrateFolder));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load folders');
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeDomain]);

  useEffect(() => {
    refreshFolders();
  }, [refreshFolders]);

  const createFolder = useCallback(
    async (name: string) => {
      if (!activeDomain) throw new Error('Select a mailbox first');
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: activeDomain.id, name }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.details || data?.error || 'Failed to create folder');
      }
      await refreshFolders();
    },
    [activeDomain, refreshFolders]
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.details || data?.error || 'Failed to rename folder');
      }
      await refreshFolders();
    },
    [refreshFolders]
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.details || data?.error || 'Failed to delete folder');
      }
      await refreshFolders();
    },
    [refreshFolders]
  );

  const value: FolderContextType = {
    folders,
    isLoading,
    error,
    refreshFolders,
    createFolder,
    renameFolder,
    deleteFolder,
  };

  return React.createElement(FolderContext.Provider, { value }, children);
}

export function useFolders() {
  const context = useContext(FolderContext);
  if (context === undefined) {
    throw new Error('useFolders must be used within a FolderProvider');
  }
  return context;
}
