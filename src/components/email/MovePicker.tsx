'use client';

import { Archive, Inbox, ShieldAlert, Trash2, Folder } from 'lucide-react';
import { ActionSheet, ActionSheetButton } from '@/components/ui/ActionSheet';
import { useFolders } from '@/hooks/useFolders';
import { useEmailActions } from '@/hooks/useEmailActions';
import { useEmails } from '@/components/providers/EmailProvider';

interface MovePickerProps {
  isOpen: boolean;
  emailIds: string[];
  onClose: () => void;
}

export function MovePicker({ isOpen, emailIds, onClose }: MovePickerProps) {
  const { folders } = useFolders();
  const { act, moveToFolder } = useEmailActions();
  const { setCurrentView } = useEmails();

  const run = async (fn: () => Promise<void>) => {
    await fn();
    onClose();
  };

  return (
    <ActionSheet isOpen={isOpen} title="Move to" onClose={onClose}>
      <ActionSheetButton
        onClick={() => run(async () => {
          await act(emailIds, 'moveToInbox', { clearSelection: true });
          setCurrentView('inbox');
        })}
      >
        <span className="inline-flex items-center gap-3"><Inbox className="w-4 h-4" />Inbox</span>
      </ActionSheetButton>
      <ActionSheetButton
        onClick={() => run(async () => {
          await act(emailIds, 'archive', { clearSelection: true });
          setCurrentView('archive');
        })}
      >
        <span className="inline-flex items-center gap-3"><Archive className="w-4 h-4" />Archive</span>
      </ActionSheetButton>
      <ActionSheetButton onClick={() => run(() => act(emailIds, 'spam', { clearSelection: true }))}>
        <span className="inline-flex items-center gap-3"><ShieldAlert className="w-4 h-4" />Junk</span>
      </ActionSheetButton>
      <ActionSheetButton tone="danger" onClick={() => run(() => act(emailIds, 'delete', { clearSelection: true }))}>
        <span className="inline-flex items-center gap-3"><Trash2 className="w-4 h-4" />Trash</span>
      </ActionSheetButton>
      {folders.map((folder) => (
        <ActionSheetButton
          key={folder.id}
          onClick={() => run(async () => {
            await moveToFolder(emailIds, folder.id, { clearSelection: true });
            setCurrentView(`folder:${folder.id}`);
          })}
        >
          <span className="inline-flex items-center gap-3"><Folder className="w-4 h-4" />{folder.name}</span>
        </ActionSheetButton>
      ))}
    </ActionSheet>
  );
}
