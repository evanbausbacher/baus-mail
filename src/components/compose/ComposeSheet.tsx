'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useDomains } from '@/hooks/useDomains';
import { useEmails } from '@/components/providers/EmailProvider';
import { sendEmailSchema } from '@/lib/utils/validation';
import { parseEmailAddress } from '@/lib/utils/email-helpers';
import type { ComposeDraft } from '@/lib/compose/draft';
import { SendAsPicker } from './SendAsPicker';
import { TemplatePicker } from './TemplatePicker';
import { TemplateFields } from './TemplateFields';
import { TemplatePreview } from './TemplatePreview';
import { getTemplate, type TemplateId } from '@/lib/email-templates';
import clsx from 'clsx';

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

interface ComposeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initial: ComposeDraft;
}

export function ComposeSheet({ isOpen, onClose, initial }: ComposeSheetProps) {
  const { activeDomain } = useDomains();
  const { refreshEmails, setCurrentView } = useEmails();

  const defaultFrom = activeDomain ? `support@${activeDomain.name}` : '';

  const initialFromTemplate: TemplateId =
    initial.mode === 'reply' || initial.mode === 'replyAll' ? 'reply' : 'plain';

  const [tab, setTab] = useState<'compose' | 'preview'>('compose');
  const [templateId, setTemplateId] = useState<TemplateId>(initialFromTemplate);
  const [from, setFrom] = useState<string>(
    initial.from ?? defaultFrom
  );
  const [to, setTo] = useState((initial.to ?? []).join(', '));
  const [cc, setCc] = useState((initial.cc ?? []).join(', '));
  const [bcc, setBcc] = useState((initial.bcc ?? []).join(', '));
  const [subject, setSubject] = useState(initial.subject ?? '');
  const [showCcBcc, setShowCcBcc] = useState((initial.cc?.length ?? 0) > 0 || (initial.bcc?.length ?? 0) > 0);
  const [templateProps, setTemplateProps] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form whenever initial draft changes (open compose -> reply -> etc).
  const lastInitialRef = useRef<ComposeDraft | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    if (lastInitialRef.current === initial) return;
    lastInitialRef.current = initial;

    const startTemplate: TemplateId = initial.mode === 'reply' || initial.mode === 'replyAll' ? 'reply' : 'plain';
    setTemplateId(startTemplate);
    setTab('compose');
    setFrom(initial.from ?? defaultFrom);
    setTo((initial.to ?? []).join(', '));
    setCc((initial.cc ?? []).join(', '));
    setBcc((initial.bcc ?? []).join(', '));
    setSubject(initial.subject ?? '');
    setShowCcBcc((initial.cc?.length ?? 0) > 0 || (initial.bcc?.length ?? 0) > 0);

    // Seed template props from draft body for plain/reply
    const def = getTemplate(startTemplate);
    const seeded: Record<string, string> = { ...(def.defaultProps as Record<string, string>) };
    if (startTemplate === 'reply') {
      // Split draft text into reply body and quoted section if present.
      const text = initial.text ?? '';
      const parts = text.split(/^(On .+ wrote:)$/m);
      if (parts.length >= 3) {
        seeded.body = parts[0].trim();
        seeded.quotedHeader = parts[1].trim();
        seeded.quotedBody = parts.slice(2).join('').replace(/^>\s?/gm, '').trim();
      } else {
        seeded.body = text;
        seeded.quotedHeader = '';
        seeded.quotedBody = '';
      }
    } else if (startTemplate === 'plain') {
      seeded.body = initial.text ?? (def.defaultProps as Record<string, string>).body ?? '';
      seeded.preheader = '';
    }
    setTemplateProps(seeded);
    setError(null);
  }, [initial, isOpen, defaultFrom]);

  // When user switches templates, seed missing fields from defaults so the preview is meaningful.
  useEffect(() => {
    const def = getTemplate(templateId);
    setTemplateProps((prev) => {
      const next: Record<string, string> = { ...(def.defaultProps as Record<string, string>) };
      for (const f of def.fields) {
        if (prev[f.key] !== undefined && prev[f.key] !== '') {
          next[f.key] = prev[f.key];
        }
      }
      return next;
    });
  }, [templateId]);

  const def = useMemo(() => getTemplate(templateId), [templateId]);

  const title = useMemo(() => {
    if (initial.mode === 'reply') return 'Reply';
    if (initial.mode === 'replyAll') return 'Reply All';
    if (initial.mode === 'forward') return 'Forward';
    return 'New message';
  }, [initial.mode]);

  const handleFieldChange = (key: string, value: string) => {
    setTemplateProps((prev) => ({ ...prev, [key]: value }));
  };

  const handleSend = async () => {
    if (!activeDomain) {
      setError('Select a mailbox first.');
      return;
    }
    if (!from.trim()) {
      setError('Pick a "from" address.');
      return;
    }
    setIsSending(true);
    setError(null);

    try {
      // Render HTML from current template + props
      const previewRes = await fetch('/api/email-templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, props: templateProps }),
      });
      if (!previewRes.ok) {
        const data = await previewRes.json().catch(() => null);
        throw new Error(data?.error || 'Failed to render email');
      }
      const html = await previewRes.text();

      const payload = {
        domainId: activeDomain.id,
        from: from.trim(),
        to: parseEmailCsv(to),
        cc: showCcBcc && cc.trim() ? parseEmailCsv(cc) : undefined,
        bcc: showCcBcc && bcc.trim() ? parseEmailCsv(bcc) : undefined,
        subject: subject.trim(),
        html,
        text: templateProps.body || undefined,
        inReplyTo: initial.inReplyTo ?? undefined,
        references: initial.references ?? undefined,
      };

      const parsed = sendEmailSchema.safeParse(payload);
      if (!parsed.success) {
        setError('Please fix the highlighted fields.');
        setIsSending(false);
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

      await refreshEmails(activeDomain.id);
      setCurrentView('sent');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-line/40 sticky top-0 z-10">
          <button
            type="button"
            onClick={() => setTab('compose')}
            className={clsx(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === 'compose' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            )}
          >
            Compose
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={clsx(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === 'preview' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            )}
          >
            Preview
          </button>
        </div>

        {tab === 'compose' ? (
          <div className="space-y-4">
            <SendAsPicker
              aliases={[]}
              value={from}
              onChange={setFrom}
              domainFallback={activeDomain?.name}
            />

            <Input
              label="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              type="email"
              inputMode="email"
              autoCapitalize="none"
            />

            {showCcBcc ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Cc" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="optional" />
                <Input label="Bcc" value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="optional" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCcBcc(true)}
                className="text-sm text-accent hover:text-accent-hover"
              >
                + Add Cc / Bcc
              </button>
            )}

            <Input
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
            />

            <TemplatePicker value={templateId} onChange={setTemplateId} />

            <p className="text-xs text-ink-subtle -mt-2">{def.description}</p>

            <TemplateFields fields={def.fields} values={templateProps} onChange={handleFieldChange} />
          </div>
        ) : (
          <TemplatePreview templateId={templateId} props={templateProps} />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-2 pt-2 sticky bottom-0 bg-surface pb-1">
          <Button
            type="button"
            variant="primary"
            onClick={handleSend}
            disabled={isSending || !activeDomain}
            className="flex-1 min-w-32"
          >
            {isSending ? 'Sending…' : 'Send'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setTab((t) => (t === 'compose' ? 'preview' : 'compose'))}
            disabled={isSending}
          >
            {tab === 'compose' ? 'Preview' : 'Edit'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
