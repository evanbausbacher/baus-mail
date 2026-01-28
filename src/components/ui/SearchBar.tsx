'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search emails...',
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('relative', className)}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'w-full pl-10 pr-4 py-2 border border-gray-300 bg-white text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent'
        )}
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    </form>
  );
}
