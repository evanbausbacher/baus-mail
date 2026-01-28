'use client';

import { DomainProvider } from '@/components/providers/DomainProvider';
import { EmailProvider } from '@/components/providers/EmailProvider';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Home() {
  return (
    <DomainProvider>
      <EmailProvider>
        <MainLayout />
      </EmailProvider>
    </DomainProvider>
  );
}
