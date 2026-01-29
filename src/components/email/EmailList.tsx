'use client';

import { useMemo } from 'react';
import { useDomains } from '@/hooks/useDomains';
import { useEmails } from '@/components/providers/EmailProvider';
import { EmailListItem } from '@/components/email/EmailListItem';
import { Checkbox } from '@/components/ui/Checkbox';
import { EmailListSkeleton } from '@/components/email/EmailListSkeleton';

export function EmailList() {
  const { activeDomain } = useDomains();
  const { emails, isLoading, error, selectedEmails, selectAllEmails, clearSelection } = useEmails();

  const allSelected = useMemo(() => {
    return emails.length > 0 && selectedEmails.size === emails.length;
  }, [emails.length, selectedEmails.size]);

  if (!activeDomain) {
    return (
      <div className="p-6 text-sm text-gray-600">
        Select a domain to view emails.
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Checkbox
          checked={allSelected}
          onChange={(e) => {
            if (e.target.checked) selectAllEmails();
            else clearSelection();
          }}
          label="Select all"
        />
        <div className="text-xs text-gray-500">
          {emails.length} email{emails.length === 1 ? '' : 's'}
        </div>
      </div>

      {isLoading ? (
        <EmailListSkeleton />
      ) : error ? (
        <div className="p-6 text-sm text-red-700">
          {error}
        </div>
      ) : emails.length === 0 ? (
        <div className="p-6 text-sm text-gray-600">
          No emails found.
        </div>
      ) : (
        <div>
          {emails.map((email) => (
            <EmailListItem key={email.id} email={email} />
          ))}
        </div>
      )}
    </div>
  );
}
