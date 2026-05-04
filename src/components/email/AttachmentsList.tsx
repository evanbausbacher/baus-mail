'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Archive, Download, Eye, File, FileImage, FileSpreadsheet, FileText } from 'lucide-react';
import type { EmailAttachment } from '@/types/email';
import { Modal } from '@/components/ui/Modal';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, idx);
  const shown = idx === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${shown} ${units[idx]}`;
}

function attachmentUrl(emailId: string, attachmentId: string, download = false) {
  const base = `/api/emails/${encodeURIComponent(emailId)}/attachments/${encodeURIComponent(attachmentId)}`;
  return download ? `${base}?download=1` : base;
}

function previewKind(contentType: string): 'image' | 'pdf' | 'text' | null {
  const type = contentType.toLowerCase();
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'pdf';
  if (type.startsWith('text/')) return 'text';
  return null;
}

function AttachmentIcon({ contentType, filename }: { contentType: string; filename: string }) {
  const lower = `${contentType} ${filename}`.toLowerCase();
  if (lower.includes('image/')) return <FileImage className="h-5 w-5" />;
  if (lower.includes('spreadsheet') || /\.(csv|xls|xlsx)$/i.test(filename)) return <FileSpreadsheet className="h-5 w-5" />;
  if (lower.includes('zip') || /\.(zip|tar|gz|rar|7z)$/i.test(filename)) return <Archive className="h-5 w-5" />;
  if (lower.includes('pdf') || lower.includes('text/') || /\.(pdf|txt|md|log)$/i.test(filename)) return <FileText className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
}

function AttachmentPreview({
  attachment,
  emailId,
}: {
  attachment: EmailAttachment;
  emailId: string;
}) {
  const kind = previewKind(attachment.contentType);
  const url = attachmentUrl(emailId, attachment.id);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== 'text') return;
    let cancelled = false;
    setText(null);
    setError(null);

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load preview');
        return response.text();
      })
      .then((value) => {
        if (!cancelled) setText(value);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load preview');
      });

    return () => {
      cancelled = true;
    };
  }, [kind, url]);

  if (kind === 'image') {
    return (
      <div className="flex min-h-[45vh] items-center justify-center bg-canvas">
        <Image
          src={url}
          alt={attachment.filename}
          width={1200}
          height={900}
          unoptimized
          className="max-h-[75vh] max-w-full object-contain"
        />
      </div>
    );
  }

  if (kind === 'pdf') {
    return <iframe title={attachment.filename} src={url} className="h-[75vh] w-full bg-surface" />;
  }

  if (kind === 'text') {
    if (error) return <div className="p-4 text-sm text-red-700">{error}</div>;
    return (
      <pre className="max-h-[75vh] overflow-auto whitespace-pre-wrap rounded-xl bg-canvas p-4 text-sm leading-6 text-ink">
        {text ?? 'Loading preview...'}
      </pre>
    );
  }

  return <div className="p-4 text-sm text-ink-muted">Preview is not available for this attachment type.</div>;
}

export function AttachmentsList({ attachments, emailId }: { attachments: EmailAttachment[]; emailId: string }) {
  const [previewing, setPreviewing] = useState<EmailAttachment | null>(null);
  const visibleAttachments = attachments;

  if (!visibleAttachments.length) return null;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="border-b border-line px-4 py-2 text-sm font-semibold text-ink">
          Attachments ({visibleAttachments.length})
        </div>
        <div className="divide-y divide-line">
          {visibleAttachments.map((attachment) => {
            const canPreview = Boolean(previewKind(attachment.contentType));
            const isPending = attachment.id.startsWith('pending-');

            return (
              <div key={attachment.id} className="flex min-h-14 items-center gap-3 px-4 py-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-line/40 text-ink-muted">
                  <AttachmentIcon contentType={attachment.contentType} filename={attachment.filename} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{attachment.filename}</div>
                  <div className="truncate text-xs text-ink-subtle">
                    {attachment.contentType || 'Attachment'} - {formatBytes(attachment.size)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {canPreview ? (
                    <button
                      type="button"
                      onClick={() => setPreviewing(attachment)}
                      disabled={isPending}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-accent hover:bg-accent/10 disabled:opacity-40"
                      aria-label={`View ${attachment.filename}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  ) : null}
                  <a
                    href={isPending ? undefined : attachmentUrl(emailId, attachment.id, true)}
                    aria-disabled={isPending}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-accent hover:bg-accent/10 aria-disabled:pointer-events-none aria-disabled:opacity-40"
                    aria-label={`Download ${attachment.filename}`}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        isOpen={Boolean(previewing)}
        onClose={() => setPreviewing(null)}
        title={previewing?.filename ?? 'Attachment'}
        size="xl"
      >
        {previewing ? <AttachmentPreview attachment={previewing} emailId={emailId} /> : null}
      </Modal>
    </>
  );
}
