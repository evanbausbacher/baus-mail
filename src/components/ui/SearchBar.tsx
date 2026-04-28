'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  initialValue?: string;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search emails...',
  className,
  autoFocus,
  initialValue,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue ?? '');

  useEffect(() => {
    if (initialValue !== undefined) setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const clear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
      <input
        type="search"
        inputMode="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={clsx(
          'w-full pl-10 pr-10 py-2.5 rounded-full border border-line bg-surface text-ink',
          'placeholder:text-ink-subtle text-base',
          'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60'
        )}
      />
      {query && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-full text-ink-subtle hover:bg-line/40"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </form>
  );
}
