'use client';

import type { Email } from '@/types/email';
import { Button } from '@/components/ui/Button';
import { useEmailActions } from '@/hooks/useEmailActions';
import { Star, Trash2, AlertOctagon, MailOpen, Mail } from 'lucide-react';

export function EmailActions({ email }: { email: Email }) {
  const { isActing, toggleStar, toggleSpam, toggleRead, trash } = useEmailActions();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" onClick={() => toggleStar(email)} disabled={isActing} aria-label="Star">
        <Star className="w-4 h-4" fill={email.isStarred ? 'currentColor' : 'none'} />
      </Button>
      <Button variant="ghost" onClick={() => toggleRead(email)} disabled={isActing} aria-label="Mark read/unread">
        {email.isRead ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
      </Button>
      <Button variant="ghost" onClick={() => toggleSpam(email)} disabled={isActing} aria-label="Spam">
        <AlertOctagon className="w-4 h-4" />
      </Button>
      <Button variant="ghost" onClick={() => trash(email)} disabled={isActing} aria-label="Delete">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

