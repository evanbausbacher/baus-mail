'use client';

import { DomainProvider } from '@/components/providers/DomainProvider';
import { EmailProvider } from '@/components/providers/EmailProvider';
import { PollingProvider } from '@/components/providers/PollingProvider';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Home() {
  return (
    <DomainProvider>
      <EmailProvider>
        <PollingProvider>
          <MainLayout />
        </PollingProvider>
      </EmailProvider>
    </DomainProvider>
  );
}
