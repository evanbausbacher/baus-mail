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
 * - Zero aliases: shows an editable address field using the domain fallback.
 * - One alias: shows a static label.
 * - Multiple: shows a select.
 */
export function SendAsPicker({ aliases, value, onChange, domainFallback }: SendAsPickerProps) {
  if (aliases.length === 0) {
    const display = value || (domainFallback ? `support@${domainFallback}` : '');
    return (
      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1.5">From</label>
        <input
          type="text"
          inputMode="email"
          autoCapitalize="none"
          value={display}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your Name <support@example.com>"
          className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-base focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60"
        />
      </div>
    );
  }

  if (aliases.length === 1) {
    return (
      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1.5">From</label>
        <select
          value={value || aliases[0]}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-base focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60"
        >
          <option value={aliases[0]}>{aliases[0]}</option>
        </select>
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
