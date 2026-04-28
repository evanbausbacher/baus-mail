'use client';

import { DomainProvider } from '@/components/providers/DomainProvider';
import { EmailProvider } from '@/components/providers/EmailProvider';
import { PollingProvider } from '@/components/providers/PollingProvider';
import { AppShell } from '@/components/layout/AppShell';

export function BausMailApp() {
  return (
    <DomainProvider>
      <EmailProvider>
        <PollingProvider>
          <AppShell />
        </PollingProvider>
      </EmailProvider>
    </DomainProvider>
  );
}
