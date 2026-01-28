'use client';

import { Modal } from '@/components/ui/Modal';
import { ComposeForm } from '@/components/compose/ComposeForm';
import type { ComposeDraft } from '@/lib/compose/draft';

export function ComposeModal({
  isOpen,
  onClose,
  initial,
}: {
  isOpen: boolean;
  onClose: () => void;
  initial: ComposeDraft;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ComposeForm initial={initial} onClose={onClose} />
    </Modal>
  );
}
