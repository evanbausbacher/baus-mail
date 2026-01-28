'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { sendEmailSchema } from '@/lib/utils/validation';
import { useDomains } from '@/hooks/useDomains';
import { useEmails } from '@/components/providers/EmailProvider';
import clsx from 'clsx';
import { X } from 'lucide-react';
import type { ComposeDraft } from '@/lib/compose/draft';
import { parseEmailAddress } from '@/lib/utils/email-helpers';

function uniqEmails(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    const t = v.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function parseEmailCsv(value: string): string[] {
  return uniqEmails(
    value
      .split(/[,\n;]/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => parseEmailAddress(s).address)
  );
}

export function ComposeForm({
  initial,
  onClose,
}: {
  initial: ComposeDraft;
  onClose: () => void;
}) {
  const { activeDomain } = useDomains();
  const { refreshEmails, setCurrentView } = useEmails();

  const [from, setFrom] = useState(initial.from ?? '');
  const [to, setTo] = useState((initial.to ?? []).join(', '));
  const [cc, setCc] = useState((initial.cc ?? []).join(', '));
  const [bcc, setBcc] = useState((initial.bcc ?? []).join(', '));
  const [subject, setSubject] = useState(initial.subject ?? '');
  const [mode, setMode] = useState<'text' | 'html'>(initial.html ? 'html' : 'text');
  const [text, setText] = useState(initial.text ?? '');
  const [html, setHtml] = useState(initial.html ?? '');

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveFrom = useMemo(() => {
    if (from.trim()) return from.trim();
    if (!activeDomain) return '';
    return `no-reply@${activeDomain.name}`;
  }, [from, activeDomain]);

  const title = useMemo(() => {
    if (initial.mode === 'reply') return 'Reply';
    if (initial.mode === 'forward') return 'Forward';
    return 'Compose';
  }, [initial.mode]);

  const handleSend = async () => {
    if (!activeDomain) {
      setError('Select a domain first.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const payload = {
        domainId: activeDomain.id,
        from: effectiveFrom,
        to: parseEmailCsv(to),
        cc: cc.trim() ? parseEmailCsv(cc) : undefined,
        bcc: bcc.trim() ? parseEmailCsv(bcc) : undefined,
        subject: subject.trim(),
        text: mode === 'text' ? text : undefined,
        html: mode === 'html' ? html : undefined,
        inReplyTo: initial.inReplyTo ?? undefined,
        references: initial.references ?? undefined,
      };

      const parsed = sendEmailSchema.safeParse(payload);
      if (!parsed.success) {
        setError('Please fix the highlighted fields.');
        return;
      }

      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.details || data?.error || 'Failed to send email');
      }

      await refreshEmails();
      setCurrentView('sent');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-lg font-bold text-gray-900">{title}</div>
        <div className="flex items-center gap-2">
          <Button variant={mode === 'text' ? 'primary' : 'secondary'} onClick={() => setMode('text')}>
            Text
          </Button>
          <Button variant={mode === 'html' ? 'primary' : 'secondary'} onClick={() => setMode('html')}>
            HTML
          </Button>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="px-4 py-2 bg-gray-50 border border-gray-200 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Input
        label="From"
        value={effectiveFrom}
        onChange={(e) => setFrom(e.target.value)}
        placeholder={activeDomain ? `no-reply@${activeDomain.name}` : 'Select a domain first'}
        disabled={!activeDomain}
      />

      <Input label="To" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Cc" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="optional" />
        <Input label="Bcc" value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="optional" />
      </div>
      <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />

      {mode === 'text' ? (
        <Textarea
          label="Message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder="Write your message..."
        />
      ) : (
        <Textarea
          label="HTML"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          rows={14}
          placeholder="<p>Hello…</p>"
          className="font-mono text-xs"
        />
      )}

      <div className="flex items-center justify-between pt-2">
        <div className={clsx('text-xs text-gray-500')}>
          Sending uses your domain’s Resend API key. The From address must be configured for that domain in Resend.
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSend} disabled={isSending || !activeDomain}>
            {isSending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
