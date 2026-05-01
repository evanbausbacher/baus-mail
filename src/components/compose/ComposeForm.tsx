'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useEmails } from '@/components/providers/EmailProvider';
import { useDomains } from '@/hooks/useDomains';
import { getTemplate, templates, type TemplateField, type TemplateId } from '@/lib/email-templates';
import type { ComposeDraft } from '@/lib/compose/draft';
import { sendEmailSchema } from '@/lib/utils/validation';
import { parseEmailAddress } from '@/lib/utils/email-helpers';
import { SendAsPicker } from './SendAsPicker';
import { TemplateFields } from './TemplateFields';
import { TemplatePicker } from './TemplatePicker';
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

function DesktopField({
  field,
  isExpandedBody = false,
  onChange,
  value,
}: {
  field: TemplateField;
  isExpandedBody?: boolean;
  onChange: (key: string, value: string) => void;
  value: string;
}) {
  if (field.type === 'textarea') {
    return (
      <div className={clsx(isExpandedBody ? 'flex min-h-0 flex-1 flex-col' : 'space-y-2')}>
        <label className="text-sm font-medium text-ink-muted">{field.label}</label>
        <textarea
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={clsx(
            'w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink',
            'placeholder:text-ink-subtle focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/30',
            isExpandedBody ? 'min-h-[240px] flex-1 resize-none' : 'min-h-[132px] resize-y'
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-ink-muted">{field.label}</label>
      <input
        type={field.type === 'url' ? 'url' : 'text'}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(field.key, e.target.value)}
        className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
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

  const initialFromTemplate: TemplateId =
    initial.mode === 'reply' || initial.mode === 'replyAll' ? 'reply' : 'plain';

  const [tab, setTab] = useState<'compose' | 'preview'>('compose');
  const [templateId, setTemplateId] = useState<TemplateId>(initialFromTemplate);
  const [from, setFrom] = useState<string>(initial.from ?? defaultFrom);
  const [to, setTo] = useState((initial.to ?? []).join(', '));
  const [cc, setCc] = useState((initial.cc ?? []).join(', '));
  const [bcc, setBcc] = useState((initial.bcc ?? []).join(', '));
  const [subject, setSubject] = useState(initial.subject ?? '');
  const [showCcBcc, setShowCcBcc] = useState((initial.cc?.length ?? 0) > 0 || (initial.bcc?.length ?? 0) > 0);
  const [templateProps, setTemplateProps] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastResetRef = useRef<{ defaultFrom: string; initial: ComposeDraft } | null>(null);
  useEffect(() => {
    if (lastResetRef.current?.initial === initial && lastResetRef.current.defaultFrom === defaultFrom) return;
    lastResetRef.current = { initial, defaultFrom };

    const startTemplate: TemplateId = initial.mode === 'reply' || initial.mode === 'replyAll' ? 'reply' : 'plain';
    setTemplateId(startTemplate);
    setTab('compose');
    setFrom(initial.from ?? defaultFrom);
    setTo((initial.to ?? []).join(', '));
    setCc((initial.cc ?? []).join(', '));
    setBcc((initial.bcc ?? []).join(', '));
    setSubject(initial.subject ?? '');
    setShowCcBcc((initial.cc?.length ?? 0) > 0 || (initial.bcc?.length ?? 0) > 0);

    const def = getTemplate(startTemplate);
    const seeded: Record<string, string> = { ...(def.defaultProps as Record<string, string>) };
    if (startTemplate === 'reply') {
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
  }, [defaultFrom, initial]);

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

  const desktopFieldGroups = useMemo(() => {
    const bodyField = def.fields.find((field) => field.key === 'body' && field.type === 'textarea') ?? null;
    const nonBodyFields = def.fields.filter((field) => field !== bodyField);
    const inputFields = nonBodyFields.filter((field) => field.type !== 'textarea');
    const extraTextareas = nonBodyFields.filter((field) => field.type === 'textarea');
    return { bodyField, extraTextareas, inputFields };
  }, [def.fields]);

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
            <SendAsPicker
              aliases={fromAddresses}
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

            <TemplatePicker value={templateId} onChange={setTemplateId} />

            <p className="-mt-2 text-xs text-ink-subtle">{def.description}</p>

            <TemplateFields fields={def.fields} values={templateProps} onChange={handleFieldChange} />
          </div>
        ) : (
          <TemplatePreview templateId={templateId} props={templateProps} />
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

        <div className="flex flex-wrap items-center gap-3 px-0 pt-3">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-ink-subtle">
            Template
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-line/40 p-1">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setTemplateId(template.id)}
                className={clsx(
                  'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  templateId === template.id
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                {template.label}
              </button>
            ))}
          </div>
          <div className="min-w-0 flex-1 text-xs text-ink-subtle">{def.description}</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {tab === 'preview' ? (
          <TemplatePreview templateId={templateId} props={templateProps} />
        ) : (
          <div className="flex h-full min-h-0 flex-col gap-4">
            {desktopFieldGroups.inputFields.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {desktopFieldGroups.inputFields.map((field) => (
                  <DesktopField
                    key={field.key}
                    field={field}
                    value={templateProps[field.key] ?? ''}
                    onChange={handleFieldChange}
                  />
                ))}
              </div>
            ) : null}

            {desktopFieldGroups.bodyField ? (
              <DesktopField
                field={desktopFieldGroups.bodyField}
                isExpandedBody
                value={templateProps[desktopFieldGroups.bodyField.key] ?? ''}
                onChange={handleFieldChange}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-line bg-canvas/60 px-4 py-5 text-sm text-ink-subtle">
                This template does not expose a primary message body field.
              </div>
            )}

            {desktopFieldGroups.extraTextareas.length > 0 ? (
              <div className="space-y-4">
                {desktopFieldGroups.extraTextareas.map((field) => (
                  <DesktopField
                    key={field.key}
                    field={field}
                    value={templateProps[field.key] ?? ''}
                    onChange={handleFieldChange}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="border-t border-line px-5 py-3">
        {error ? <p className="pb-3 text-sm text-red-600">{error}</p> : null}
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-ink-subtle">
            {tab === 'preview' ? 'Previewing rendered output' : 'Compose in place and preview before sending'}
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
