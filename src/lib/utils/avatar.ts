/**
 * Two-letter initials from an email address, display name, or domain.
 * Tries to split on dots, spaces, hyphens, underscores; falls back to first two chars.
 */
export function getInitials(input: string): string {
  if (!input) return '?';
  const cleaned = input.replace(/[<>]/g, '').trim();
  const local = cleaned.includes('@') ? cleaned.split('@')[0] : cleaned;
  const parts = local.split(/[.\s_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (local[0] + (local[1] ?? '')).toUpperCase();
}

// Cool-leaning pastel palette that sits well on iOS systemGroupedBackground.
const PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
  'bg-cyan-100 text-cyan-700',
  'bg-teal-100 text-teal-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-slate-200 text-slate-700',
];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length];
}
