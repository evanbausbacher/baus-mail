'use client';

import { DomainProvider } from '@/components/providers/DomainProvider';
import { EmailProvider } from '@/components/providers/EmailProvider';
import { AppShell } from '@/components/layout/AppShell';
import { FolderProvider } from '@/hooks/useFolders';

export function BausMailApp() {
  return (
    <DomainProvider>
      <FolderProvider>
        <EmailProvider>
          <AppShell />
        </EmailProvider>
      </FolderProvider>
    </DomainProvider>
  );
}
