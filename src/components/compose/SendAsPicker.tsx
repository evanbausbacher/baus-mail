'use client';

import React from 'react';

interface SendAsPickerProps {
  aliases: string[];
  value: string;
  onChange: (value: string) => void;
  domainFallback?: string | null;
}

/**
 * Renders a "Send as" picker driven by the active domain's saved aliases.
 * - Zero aliases: shows a static label using the domain fallback (e.g. no-reply@domain).
 * - One alias: shows a static label.
 * - Multiple: shows a select.
 */
export function SendAsPicker({ aliases, value, onChange, domainFallback }: SendAsPickerProps) {
  if (aliases.length === 0) {
    const display = value || (domainFallback ? `no-reply@${domainFallback}` : '');
    return (
      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1.5">From</label>
        <div className="px-3.5 py-2.5 rounded-xl border border-line bg-line/20 text-sm text-ink-muted">
          {display || 'No address available'}
        </div>
      </div>
    );
  }

  if (aliases.length === 1) {
    return (
      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1.5">From</label>
        <div className="px-3.5 py-2.5 rounded-xl border border-line bg-line/20 text-sm text-ink">
          {aliases[0]}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-ink-muted mb-1.5">From</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-base focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60"
      >
        {aliases.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}
