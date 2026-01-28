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
    <div className="border border-gray-200 bg-white">
      <div className="px-4 py-2 border-b border-gray-200 text-sm font-semibold text-gray-900">
        Attachments ({attachments.length})
      </div>
      <div className="divide-y divide-gray-200">
        {attachments.map((a) => (
          <div key={a.id} className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-gray-900 truncate">{a.filename}</div>
              <div className="text-xs text-gray-500 truncate">{a.contentType}</div>
            </div>
            <div className="text-xs text-gray-500 whitespace-nowrap">{formatBytes(a.size)}</div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
        Attachment download is planned for a later phase.
      </div>
    </div>
  );
}

