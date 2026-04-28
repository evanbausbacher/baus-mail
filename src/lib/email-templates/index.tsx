import * as React from 'react';
import { Plain, PlainDefaults, type PlainProps } from './Plain';
import { Marketing, MarketingDefaults, type MarketingProps } from './Marketing';
import { Transactional, TransactionalDefaults, type TransactionalProps } from './Transactional';
import { Reply, ReplyDefaults, type ReplyProps } from './Reply';

export type TemplateId = 'plain' | 'marketing' | 'transactional' | 'reply';

export type FieldType = 'text' | 'textarea' | 'url';

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helper?: string;
}

interface TemplateDef<P> {
  id: TemplateId;
  label: string;
  description: string;
  Component: React.ComponentType<P>;
  defaultProps: P;
  fields: TemplateField[];
}

const plainDef: TemplateDef<PlainProps> = {
  id: 'plain',
  label: 'Plain',
  description: 'A simple, clean email — no header, no footer, just your message.',
  Component: Plain,
  defaultProps: PlainDefaults,
  fields: [
    {
      key: 'preheader',
      label: 'Preheader',
      type: 'text',
      placeholder: 'Short summary shown in the inbox preview',
    },
    { key: 'body', label: 'Message', type: 'textarea', placeholder: 'Write your message…' },
  ],
};

const marketingDef: TemplateDef<MarketingProps> = {
  id: 'marketing',
  label: 'Marketing',
  description: 'Brand header, hero headline, body copy, and a call-to-action button.',
  Component: Marketing,
  defaultProps: MarketingDefaults,
  fields: [
    { key: 'preheader', label: 'Preheader', type: 'text' },
    { key: 'brandName', label: 'Brand', type: 'text' },
    { key: 'headline', label: 'Headline', type: 'text' },
    { key: 'body', label: 'Body', type: 'textarea' },
    { key: 'ctaLabel', label: 'CTA label', type: 'text' },
    { key: 'ctaUrl', label: 'CTA URL', type: 'url' },
    { key: 'footer', label: 'Footer', type: 'textarea' },
  ],
};

const transactionalDef: TemplateDef<TransactionalProps> = {
  id: 'transactional',
  label: 'Transactional',
  description: 'A clean branded notification with optional action button.',
  Component: Transactional,
  defaultProps: TransactionalDefaults,
  fields: [
    { key: 'preheader', label: 'Preheader', type: 'text' },
    { key: 'brandName', label: 'Brand', type: 'text' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'body', label: 'Body', type: 'textarea' },
    { key: 'ctaLabel', label: 'CTA label (optional)', type: 'text' },
    { key: 'ctaUrl', label: 'CTA URL (optional)', type: 'url' },
  ],
};

const replyDef: TemplateDef<ReplyProps> = {
  id: 'reply',
  label: 'Reply',
  description: 'Quoted-reply formatting around your message.',
  Component: Reply,
  defaultProps: ReplyDefaults,
  fields: [
    { key: 'body', label: 'Your reply', type: 'textarea' },
    { key: 'quotedHeader', label: 'Quoted header', type: 'text' },
    { key: 'quotedBody', label: 'Quoted body', type: 'textarea' },
  ],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const templates: Array<TemplateDef<any>> = [
  plainDef,
  marketingDef,
  transactionalDef,
  replyDef,
];

export function getTemplate(id: TemplateId) {
  return templates.find((t) => t.id === id) ?? plainDef;
}

export { Plain, Marketing, Transactional, Reply };
export type { PlainProps, MarketingProps, TransactionalProps, ReplyProps };
