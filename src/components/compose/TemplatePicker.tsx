'use client';

import React from 'react';
import clsx from 'clsx';
import { templates, type TemplateId } from '@/lib/email-templates';

interface TemplatePickerProps {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
  /** Restrict which template ids to show. */
  allow?: TemplateId[];
}

export function TemplatePicker({ value, onChange, allow }: TemplatePickerProps) {
  const visible = allow ? templates.filter((t) => allow.includes(t.id)) : templates;

  return (
    <div>
      <label className="block text-sm font-medium text-ink-muted mb-1.5">Template</label>
      <div className="flex gap-1 p-1 rounded-xl bg-line/40">
        {visible.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={clsx(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              value === t.id
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
