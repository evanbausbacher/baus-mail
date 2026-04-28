'use client';

import React from 'react';
import Image from 'next/image';
import { DomainSwitcher } from './DomainSwitcher';
import { Inbox, Send, Star, AlertOctagon, Trash2, PenSquare, Settings } from 'lucide-react';
import clsx from 'clsx';
import type { EmailView } from '@/components/providers/EmailProvider';
import { APP_VERSION } from '@/lib/version';

interface SidebarProps {
  activeView?: EmailView;
  onViewChange?: (view: EmailView) => void;
  onCompose?: () => void;
  onOpenSettings?: () => void;
}

export function Sidebar({ activeView = 'inbox', onViewChange, onCompose, onOpenSettings }: SidebarProps) {
  const navItems: Array<{ id: EmailView; label: string; Icon: typeof Inbox }> = [
    { id: 'inbox', label: 'Inbox', Icon: Inbox },
    { id: 'sent', label: 'Sent', Icon: Send },
    { id: 'starred', label: 'Starred', Icon: Star },
    { id: 'spam', label: 'Spam', Icon: AlertOctagon },
    { id: 'trash', label: 'Trash', Icon: Trash2 },
  ];

  return (
    <div className="w-[260px] bg-surface border-r border-line flex flex-col h-screen">
      <div className="p-4 border-b border-line">
        <div className="flex items-center gap-3">
          <Image src="/apple-touch-icon.png" alt="BausMail" width={32} height={32} className="rounded-lg" />
          <h1 className="text-xl font-semibold text-ink">BausMail</h1>
        </div>
      </div>

      <DomainSwitcher />

      {onCompose && (
        <div className="px-4 py-4">
          <button
            type="button"
            onClick={onCompose}
            className="w-full px-4 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
          >
            <PenSquare size={18} />
            Compose
          </button>
        </div>
      )}

      <nav className="flex-1 px-2 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.Icon;
            const active = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onViewChange?.(item.id)}
                  className={clsx(
                    'w-full px-3 py-2 rounded-xl text-left flex items-center gap-3 transition-colors',
                    active ? 'bg-accent/10 text-accent' : 'text-ink hover:bg-line/40'
                  )}
                >
                  <Icon size={18} className={active ? 'text-accent' : 'text-ink-muted'} />
                  <span className={clsx('text-sm', active ? 'font-semibold' : 'font-medium')}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line px-2 py-2">
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-3 text-ink hover:bg-line/40"
          >
            <Settings size={18} className="text-ink-muted" />
            <span className="font-medium text-sm">Settings</span>
          </button>
        )}
      </div>

      <div className="px-4 py-3 border-t border-line text-xs text-ink-subtle">
        BausMail v{APP_VERSION}
      </div>
    </div>
  );
}
