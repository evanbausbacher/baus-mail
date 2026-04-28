'use client';

import { useEffect } from 'react';
import clsx from 'clsx';
import Image from 'next/image';
import {
  Inbox,
  Send,
  Star,
  AlertOctagon,
  Trash2,
  Plus,
  Settings,
  LogOut,
  Check,
} from 'lucide-react';
import { useEmails, type EmailView } from '@/components/providers/EmailProvider';
import { useDomains } from '@/hooks/useDomains';
import type { Domain } from '@/types/domain';
import { getInitials } from '@/lib/utils/avatar';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onAddDomain: () => void;
}

const FOLDERS: Array<{ id: EmailView; label: string; Icon: typeof Inbox }> = [
  { id: 'inbox', label: 'Inbox', Icon: Inbox },
  { id: 'sent', label: 'Sent', Icon: Send },
  { id: 'starred', label: 'Starred', Icon: Star },
  { id: 'spam', label: 'Spam', Icon: AlertOctagon },
  { id: 'trash', label: 'Trash', Icon: Trash2 },
];

export function MobileDrawer({ isOpen, onClose, onOpenSettings, onAddDomain }: MobileDrawerProps) {
  const { currentView, setCurrentView } = useEmails();
  const { domains, activeDomain, setActiveDomain } = useDomains();

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const handleFolder = (view: EmailView) => {
    setCurrentView(view);
    onClose();
  };

  const handleDomain = (domain: Domain) => {
    setActiveDomain(domain);
    onClose();
  };

  return (
    <div
      className={clsx(
        'fixed inset-0 z-40 lg:hidden transition-opacity duration-200',
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />

      <aside
        className={clsx(
          'absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-surface shadow-ios',
          'flex flex-col transition-transform duration-300 ease-ios pt-safe pb-safe',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-3">
          <Image src="/apple-touch-icon.png" alt="" width={32} height={32} className="rounded-lg" />
          <div>
            <div className="text-base font-semibold text-ink">BausMail</div>
            <div className="text-xs text-ink-subtle">Personal email</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {/* Domain switcher */}
          <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-ink-subtle font-medium">
            Mailboxes
          </div>
          <ul className="px-1">
            {domains.map((domain) => {
              const isActive = activeDomain?.id === domain.id;
              const initials = getInitials(domain.name);
              return (
                <li key={domain.id}>
                  <button
                    type="button"
                    onClick={() => handleDomain(domain)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left',
                      isActive ? 'bg-accent/10' : 'hover:bg-line/40'
                    )}
                  >
                    <div
                      className={clsx(
                        'h-9 w-9 rounded-full inline-flex items-center justify-center text-sm font-semibold',
                        isActive ? 'bg-accent/15 text-accent' : 'bg-line text-ink-muted'
                      )}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={clsx('text-sm truncate', isActive ? 'text-accent font-medium' : 'text-ink')}>
                        {domain.name}
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-accent" />}
                  </button>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => {
                  onAddDomain();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-accent hover:bg-line/40"
              >
                <div className="h-9 w-9 rounded-full inline-flex items-center justify-center bg-accent/10">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Add mailbox</span>
              </button>
            </li>
          </ul>

          {/* Folders */}
          <div className="px-3 pt-5 pb-1 text-[11px] uppercase tracking-wide text-ink-subtle font-medium">
            Folders
          </div>
          <ul className="px-1 space-y-0.5">
            {FOLDERS.map(({ id, label, Icon }) => {
              const active = currentView === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => handleFolder(id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left',
                      active ? 'bg-accent/10 text-accent' : 'text-ink hover:bg-line/40'
                    )}
                  >
                    <Icon className={clsx('w-5 h-5', active ? 'text-accent' : 'text-ink-muted')} />
                    <span className={clsx('text-sm', active ? 'font-semibold' : 'font-medium')}>
                      {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer actions */}
        <div className="border-t border-line px-2 py-2 space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-ink hover:bg-line/40"
          >
            <Settings className="w-5 h-5 text-ink-muted" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <a
            href="/api/auth/signout"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-ink hover:bg-line/40"
          >
            <LogOut className="w-5 h-5 text-ink-muted" />
            <span className="text-sm font-medium">Sign out</span>
          </a>
        </div>
      </aside>
    </div>
  );
}
