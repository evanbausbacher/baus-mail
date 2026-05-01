'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useEmails } from '@/components/providers/EmailProvider';
import { useDomains } from '@/hooks/useDomains';
import type { ComposeDraft } from '@/lib/compose/draft';
import { sendEmailSchema } from '@/lib/utils/validation';
import { parseEmailAddress } from '@/lib/utils/email-helpers';
import { SendAsPicker } from './SendAsPicker';
import { TemplatePreview } from './TemplatePreview';

type ComposeMode = 'mobile' | 'desktop';

interface ComposeFormProps {
  initial: ComposeDraft;
  mode: ComposeMode;
  onClose: () => void;
}

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

function stripQuotePrefix(value: string): string {
  return value.replace(/^\s*>+\s?/gm, '');
}

function normalizeQuotedLines(value: string): string {
  return stripQuotePrefix(value).replace(/\n{3,}/g, '\n\n').trim();
}

function splitReplyDraft(initial: ComposeDraft): {
  body: string;
  quotedBody: string;
  quotedHeader: string;
} {
  const text = initial.text ?? '';
  const parts = text.split(/^(On .+ wrote:)$/m);
  if (parts.length >= 3) {
    return {
      body: parts[0].trim(),
      quotedHeader: parts[1].trim(),
      quotedBody: normalizeQuotedLines(parts.slice(2).join('')),
    };
  }

  return {
    body: text.trim(),
    quotedHeader: '',
    quotedBody: '',
  };
}

function joinReplyText(body: string, quotedHeader: string, quotedBody: string): string {
  const sections = [body.trim()];
  if (quotedHeader) sections.push(quotedHeader.trim());
  if (quotedBody) sections.push(quotedBody.trim());
  return sections.filter(Boolean).join('\n\n');
}

function DesktopFieldRow({
  label,
  children,
  actions,
}: {
  actions?: React.ReactNode;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-line/80 py-2.5">
      <div className="w-14 shrink-0 pt-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-subtle">
        {label}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

function QuotedThread({
  isCollapsed,
  onToggle,
  quotedBody,
  quotedHeader,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  quotedBody: string;
  quotedHeader: string;
}) {
  if (!quotedHeader && !quotedBody) return null;

  return (
    <div className="rounded-2xl border border-line bg-canvas/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink">Quoted thread</div>
          {quotedHeader ? <div className="truncate text-xs text-ink-subtle">{quotedHeader}</div> : null}
        </div>
        {isCollapsed ? <ChevronDown className="h-4 w-4 text-ink-muted" /> : <ChevronUp className="h-4 w-4 text-ink-muted" />}
      </button>

      {!isCollapsed ? (
        <div className="border-t border-line px-4 py-4">
          {quotedHeader ? <div className="mb-3 text-xs text-ink-muted">{quotedHeader}</div> : null}
          <div className="rounded-xl border-l-4 border-line bg-surface/70 px-4 py-3 text-sm leading-6 text-ink-muted whitespace-pre-wrap">
            {quotedBody || '(No content)'}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ComposeForm({ initial, mode, onClose }: ComposeFormProps) {
  const { activeDomain } = useDomains();
  const { refreshEmails, setCurrentView } = useEmails();

  const fromAddresses = activeDomain?.fromAddresses?.length
    ? activeDomain.fromAddresses
    : activeDomain
      ? [`support@${activeDomain.name}`]
      : [];
  const defaultFrom = fromAddresses[0] ?? '';

  const [tab, setTab] = useState<'compose' | 'preview'>('compose');
  const [from, setFrom] = useState<string>(initial.from ?? defaultFrom);
  const [to, setTo] = useState((initial.to ?? []).join(', '));
  const [cc, setCc] = useState((initial.cc ?? []).join(', '));
  const [bcc, setBcc] = useState((initial.bcc ?? []).join(', '));
  const [subject, setSubject] = useState(initial.subject ?? '');
  const [body, setBody] = useState('');
  const [quotedHeader, setQuotedHeader] = useState('');
  const [quotedBody, setQuotedBody] = useState('');
  const [showCcBcc, setShowCcBcc] = useState((initial.cc?.length ?? 0) > 0 || (initial.bcc?.length ?? 0) > 0);
  const [quoteCollapsed, setQuoteCollapsed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const lastResetRef = useRef<{ defaultFrom: string; initial: ComposeDraft } | null>(null);

  useEffect(() => {
    if (lastResetRef.current?.initial === initial && lastResetRef.current.defaultFrom === defaultFrom) return;
    lastResetRef.current = { initial, defaultFrom };

    const replyParts = splitReplyDraft(initial);
    setTab('compose');
    setFrom(initial.from ?? defaultFrom);
    setTo((initial.to ?? []).join(', '));
    setCc((initial.cc ?? []).join(', '));
    setBcc((initial.bcc ?? []).join(', '));
    setSubject(initial.subject ?? '');
    setBody(replyParts.body);
    setQuotedHeader(replyParts.quotedHeader);
    setQuotedBody(replyParts.quotedBody);
    setShowCcBcc((initial.cc?.length ?? 0) > 0 || (initial.bcc?.length ?? 0) > 0);
    setQuoteCollapsed(true);
    setError(null);
  }, [defaultFrom, initial]);

  useEffect(() => {
    if (tab !== 'compose') return;
    const node = bodyRef.current;
    if (!node) return;
    const id = window.requestAnimationFrame(() => {
      node.focus();
      const end = node.value.length;
      node.setSelectionRange(end, end);
    });
    return () => window.cancelAnimationFrame(id);
  }, [initial, tab, mode]);

  const previewMode: 'plain' | 'reply' = quotedHeader || quotedBody ? 'reply' : 'plain';
  const previewPayload = useMemo(
    () => ({
      mode: previewMode,
      body,
      quotedHeader,
      quotedBody,
    }),
    [body, previewMode, quotedBody, quotedHeader]
  );

  const textPayload = useMemo(
    () => (previewMode === 'reply' ? joinReplyText(body, quotedHeader, quotedBody) : body.trim()),
    [body, previewMode, quotedBody, quotedHeader]
  );

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
      const payload = {
        domainId: activeDomain.id,
        from: from.trim(),
        to: parseEmailCsv(to),
        cc: showCcBcc && cc.trim() ? parseEmailCsv(cc) : undefined,
        bcc: showCcBcc && bcc.trim() ? parseEmailCsv(bcc) : undefined,
        subject: subject.trim(),
        text: textPayload || undefined,
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

  if (mode === 'mobile') {
    return (
      <div className="space-y-4">
        <div className="sticky top-0 z-10 flex gap-1 rounded-xl bg-line/40 p-1">
          <button
            type="button"
            onClick={() => setTab('compose')}
            className={clsx(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === 'compose' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            )}
          >
            Compose
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={clsx(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === 'preview' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            )}
          >
            Preview
          </button>
        </div>

        {tab === 'compose' ? (
          <div className="space-y-4">
            <SendAsPicker aliases={fromAddresses} value={from} onChange={setFrom} domainFallback={activeDomain?.name} />

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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink-muted">Message</label>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message…"
                className="min-h-[220px] w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            <QuotedThread
              quotedHeader={quotedHeader}
              quotedBody={quotedBody}
              isCollapsed={quoteCollapsed}
              onToggle={() => setQuoteCollapsed((value) => !value)}
            />
          </div>
        ) : (
          <TemplatePreview {...previewPayload} />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="sticky bottom-0 flex flex-wrap gap-2 bg-surface pb-1 pt-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleSend}
            disabled={isSending || !activeDomain}
            className="min-w-32 flex-1"
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
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line px-5 py-3">
        <DesktopFieldRow label="From">
          {fromAddresses.length <= 1 ? (
            <input
              type="email"
              inputMode="email"
              autoCapitalize="none"
              value={from || fromAddresses[0] || (activeDomain ? `support@${activeDomain.name}` : '')}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="support@example.com"
              className="w-full border-0 bg-transparent px-0 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
            />
          ) : (
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border-0 bg-transparent px-0 py-2 text-sm text-ink focus:outline-none"
            >
              {fromAddresses.map((address) => (
                <option key={address} value={address}>
                  {address}
                </option>
              ))}
            </select>
          )}
        </DesktopFieldRow>

        <DesktopFieldRow
          label="To"
          actions={
            !showCcBcc ? (
              <button
                type="button"
                onClick={() => setShowCcBcc(true)}
                className="px-2 py-2 text-xs font-medium uppercase tracking-[0.16em] text-accent hover:text-accent-hover"
              >
                Cc/Bcc
              </button>
            ) : null
          }
        >
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            className="w-full border-0 bg-transparent px-0 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
          />
        </DesktopFieldRow>

        {showCcBcc ? (
          <>
            <DesktopFieldRow label="Cc">
              <input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="optional"
                className="w-full border-0 bg-transparent px-0 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
              />
            </DesktopFieldRow>
            <DesktopFieldRow
              label="Bcc"
              actions={
                !cc.trim() && !bcc.trim() ? (
                  <button
                    type="button"
                    onClick={() => setShowCcBcc(false)}
                    className="px-2 py-2 text-xs font-medium uppercase tracking-[0.16em] text-ink-subtle hover:text-ink"
                  >
                    Hide
                  </button>
                ) : null
              }
            >
              <input
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="optional"
                className="w-full border-0 bg-transparent px-0 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
              />
            </DesktopFieldRow>
          </>
        ) : null}

        <DesktopFieldRow label="Subject">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full border-0 bg-transparent px-0 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none"
          />
        </DesktopFieldRow>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {tab === 'preview' ? (
          <TemplatePreview {...previewPayload} />
        ) : (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="flex min-h-0 flex-1 flex-col">
              <label className="mb-2 text-sm font-medium text-ink-muted">Message</label>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message…"
                className="min-h-[260px] flex-1 resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-sm leading-6 text-ink placeholder:text-ink-subtle focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            <QuotedThread
              quotedHeader={quotedHeader}
              quotedBody={quotedBody}
              isCollapsed={quoteCollapsed}
              onToggle={() => setQuoteCollapsed((value) => !value)}
            />
          </div>
        )}
      </div>

      <div className="border-t border-line px-5 py-3">
        {error ? <p className="pb-3 text-sm text-red-600">{error}</p> : null}
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-ink-subtle">
            {tab === 'preview' ? 'Previewing rendered output' : quotedHeader || quotedBody ? 'Reply above the quoted thread' : 'Compose your message'}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setTab((t) => (t === 'compose' ? 'preview' : 'compose'))}
              disabled={isSending}
            >
              {tab === 'compose' ? 'Preview' : 'Back to edit'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSend} disabled={isSending || !activeDomain}>
              {isSending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
