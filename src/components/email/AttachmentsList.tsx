'use client';

import type { EmailAttachment } from '@/types/email';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, idx);
  const shown = idx === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${shown} ${units[idx]}`;
}

export function AttachmentsList({ attachments }: { attachments: EmailAttachment[] }) {
  if (!attachments.length) return null;

  return (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden">
      <div className="px-4 py-2 border-b border-line text-sm font-semibold text-ink">
        Attachments ({attachments.length})
      </div>
      <div className="divide-y divide-line">
        {attachments.map((a) => (
          <div key={a.id} className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-ink truncate">{a.filename}</div>
              <div className="text-xs text-ink-subtle truncate">{a.contentType}</div>
            </div>
            <div className="text-xs text-ink-subtle whitespace-nowrap">{formatBytes(a.size)}</div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-line text-xs text-ink-subtle">
        Attachment download is planned for a later phase.
      </div>
    </div>
  );
}

