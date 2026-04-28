'use client';

import { DomainProvider } from '@/components/providers/DomainProvider';
import { EmailProvider } from '@/components/providers/EmailProvider';
import { PollingProvider } from '@/components/providers/PollingProvider';
import { AppShell } from '@/components/layout/AppShell';
import { FolderProvider } from '@/hooks/useFolders';

export function BausMailApp() {
  return (
    <DomainProvider>
      <FolderProvider>
        <EmailProvider>
          <PollingProvider>
            <AppShell />
          </PollingProvider>
        </EmailProvider>
      </FolderProvider>
    </DomainProvider>
  );
}
