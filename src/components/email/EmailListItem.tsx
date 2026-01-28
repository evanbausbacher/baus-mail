'use client';

import clsx from 'clsx';
import { Star } from 'lucide-react';
import type { Email } from '@/types/email';
import { useEmails } from '@/components/providers/EmailProvider';
import { Checkbox } from '@/components/ui/Checkbox';
import { formatDate } from '@/lib/utils/date-helpers';
import { formatEmailAddress, getEmailPreview } from '@/lib/utils/email-helpers';
import { useEmailActions } from '@/hooks/useEmailActions';

interface EmailListItemProps {
  email: Email;
}

export function EmailListItem({ email }: EmailListItemProps) {
  const { selectedEmails, toggleEmailSelection, selectedEmail, setSelectedEmail } = useEmails();
  const { toggleStar, isActing } = useEmailActions();

  const isSelected = selectedEmails.has(email.id);
  const isActive = selectedEmail?.id === email.id;

  const primaryLine =
    email.type === 'sent'
      ? `To: ${email.to?.length ? formatEmailAddress(email.to[0]) : '(none)'}`
      : formatEmailAddress(email.from);

  const preview = getEmailPreview(email.text ?? null, email.html ?? null, 90);

  return (
    <div
      className={clsx(
        'px-4 py-3 border-b border-gray-200 cursor-pointer select-none',
        isActive ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'
      )}
      onClick={() => setSelectedEmail(email)}
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onChange={() => toggleEmailSelection(email.id)}
            aria-label="Select email"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={clsx('text-sm truncate', email.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold')}>
                {primaryLine}
              </div>
              <div className={clsx('text-sm truncate', email.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold')}>
                {email.subject?.trim() ? email.subject : '(No subject)'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-1 hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStar(email);
                }}
                disabled={isActing}
                aria-label={email.isStarred ? 'Unstar' : 'Star'}
              >
                <Star className="w-4 h-4 text-gray-900" fill={email.isStarred ? 'currentColor' : 'none'} />
              </button>
              <div className="text-xs text-gray-500 whitespace-nowrap">{formatDate(email.createdAt)}</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 truncate mt-1">{preview}</div>
        </div>
      </div>
    </div>
  );
}
