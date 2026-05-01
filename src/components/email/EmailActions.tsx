'use client';

import type { Email } from '@/types/email';
import { Button } from '@/components/ui/Button';
import { useEmailActions } from '@/hooks/useEmailActions';
import { Archive, Star, Trash2, AlertOctagon, MailOpen, Mail, Copy, Check } from 'lucide-react';

type CopyState = 'idle' | 'success' | 'error';

interface EmailActionsProps {
  email: Email;
  onCopyForLlm?: () => void;
  copyState?: CopyState;
}

export function EmailActions({
  email,
  onCopyForLlm,
  copyState = 'idle',
}: EmailActionsProps) {
  const { isActing, toggleStar, toggleSpam, toggleRead, trash, archive } = useEmailActions();
  const copyLabel = copyState === 'success' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy';

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {onCopyForLlm ? (
        <Button
          variant={copyState === 'error' ? 'danger' : copyState === 'success' ? 'primary' : 'secondary'}
          size="sm"
          onClick={onCopyForLlm}
          aria-label="Copy thread for LLM"
          tooltip="Copy thread for LLM"
          className="shrink-0"
        >
          {copyState === 'success' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copyLabel}</span>
        </Button>
      ) : null}
      <Button variant="ghost" onClick={() => toggleStar(email)} disabled={isActing} aria-label="Star" tooltip={email.isStarred ? 'Unstar' : 'Star'}>
        <Star className="w-4 h-4" fill={email.isStarred ? 'currentColor' : 'none'} />
      </Button>
      <Button variant="ghost" onClick={() => toggleRead(email)} disabled={isActing} aria-label="Mark read/unread" tooltip={email.isRead ? 'Mark as unread' : 'Mark as read'}>
        {email.isRead ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
      </Button>
      <Button variant="ghost" onClick={() => toggleSpam(email)} disabled={isActing} aria-label="Spam" tooltip={email.isSpam ? 'Not spam' : 'Mark as spam'}>
        <AlertOctagon className="w-4 h-4" />
      </Button>
      <Button variant="ghost" onClick={() => archive(email)} disabled={isActing} aria-label="Archive" tooltip={email.isArchived ? 'Unarchive' : 'Archive'}>
        <Archive className="w-4 h-4" />
      </Button>
      <Button variant="ghost" onClick={() => trash(email)} disabled={isActing} aria-label="Delete" tooltip="Delete">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
