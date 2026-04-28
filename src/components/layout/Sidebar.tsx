'use client';

import React from 'react';
import Image from 'next/image';
import { DomainSwitcher } from './DomainSwitcher';
import { Inbox, Send, Star, AlertOctagon, Trash2, PenSquare } from 'lucide-react';
import clsx from 'clsx';
import { APP_VERSION } from '@/lib/version';

interface SidebarProps {
  activeView?: 'inbox' | 'sent' | 'starred' | 'spam' | 'trash';
  onViewChange?: (view: 'inbox' | 'sent' | 'starred' | 'spam' | 'trash') => void;
  onCompose?: () => void;
}

export function Sidebar({ activeView = 'inbox', onViewChange, onCompose }: SidebarProps) {
  const navItems = [
    { id: 'inbox', label: 'Inbox', Icon: Inbox },
    { id: 'sent', label: 'Sent', Icon: Send },
    { id: 'starred', label: 'Starred', Icon: Star },
    { id: 'spam', label: 'Spam', Icon: AlertOctagon },
    { id: 'trash', label: 'Trash', Icon: Trash2 },
  ] as const;

  return (
    <div className="w-70 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Image src="/apple-touch-icon.png" alt="BausMail" width={32} height={32} />
          <h1 className="text-2xl font-bold text-gray-900">BausMail</h1>
        </div>
      </div>

      {/* Domain Switcher */}
      <DomainSwitcher />

      {/* Compose Button */}
      {onCompose && (
        <div className="px-4 pb-4">
          <button
            onClick={onCompose}
            className="w-full px-4 py-3 bg-accent text-white font-medium hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
          >
            <PenSquare size={18} />
            Compose
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.Icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange?.(item.id)}
                  className={clsx(
                    'w-full px-4 py-2 text-left flex items-center gap-3 transition-colors',
                    activeView === item.id
                      ? 'bg-accent text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
        <p>BausMail v{APP_VERSION}</p>
        <p>Open Source Email Client</p>
      </div>
    </div>
  );
}
