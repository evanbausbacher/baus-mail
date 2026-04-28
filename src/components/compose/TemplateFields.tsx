'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { TemplateField } from '@/lib/email-templates';

interface TemplateFieldsProps {
  fields: TemplateField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function TemplateFields({ fields, values, onChange }: TemplateFieldsProps) {
  return (
    <div className="space-y-3">
      {fields.map((f) => {
        const v = values[f.key] ?? '';
        if (f.type === 'textarea') {
          return (
            <Textarea
              key={f.key}
              label={f.label}
              value={v}
              placeholder={f.placeholder}
              onChange={(e) => onChange(f.key, e.target.value)}
              rows={5}
            />
          );
        }
        return (
          <Input
            key={f.key}
            label={f.label}
            type={f.type === 'url' ? 'url' : 'text'}
            value={v}
            placeholder={f.placeholder}
            onChange={(e) => onChange(f.key, e.target.value)}
          />
        );
      })}
    </div>
  );
}
