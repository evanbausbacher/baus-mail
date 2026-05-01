'use client';

import { Modal } from '@/components/ui/Modal';
import type { ComposeDraft } from '@/lib/compose/draft';
import { ComposeForm } from './ComposeForm';

interface ComposeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initial: ComposeDraft;
}

function getComposeTitle(initial: ComposeDraft): string {
  if (initial.mode === 'reply') return 'Reply';
  if (initial.mode === 'replyAll') return 'Reply All';
  if (initial.mode === 'forward') return 'Forward';
  return 'New message';
}

export function ComposeSheet({ isOpen, onClose, initial }: ComposeSheetProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getComposeTitle(initial)} size="lg">
      <ComposeForm initial={initial} mode="mobile" onClose={onClose} />
    </Modal>
  );
}
