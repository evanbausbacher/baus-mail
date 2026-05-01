'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import type { Email } from '@/types/email';
import { formatFullDate } from '@/lib/utils/date-helpers';
import { formatEmailAddress, getEmailPreview, parseEmailAddress, splitReplyContent, stripHtml } from '@/lib/utils/email-helpers';
import { AttachmentsList } from '@/components/email/AttachmentsList';
import { EmailThread } from '@/components/email/EmailThread';
import { EmailActions } from '@/components/email/EmailActions';
import { ActionSheet, ActionSheetButton } from '@/components/ui/ActionSheet';
import { useEmails } from '@/components/providers/EmailProvider';
import { useEmailActions } from '@/hooks/useEmailActions';
import { Archive, ChevronLeft, Ellipsis, Forward as ForwardIcon, Mail, MailOpen, Reply as ReplyIcon, Star } from 'lucide-react';
import clsx from 'clsx';

const DETAIL_SWIPE_TRIGGER = 76;
const DETAIL_FULL_TRIGGER = 220;
const DETAIL_SWIPE_REVEAL = 240;
const DETAIL_READ_REVEAL = 92;
const MOBILE_DETAIL_BREAKPOINT = '(max-width: 1023px)';

function stripFixedWidthStyles(style: CSSStyleDeclaration, properties: string[]) {
  for (const property of properties) {
    style.removeProperty(property);
  }
}

function transformHtmlForMobile(html: string) {
  if (typeof window === 'undefined') return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  if (!doc.head.querySelector('meta[name="viewport"]')) {
    const viewport = doc.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width,initial-scale=1';
    doc.head.appendChild(viewport);
  }

  const elements = Array.from(doc.body.querySelectorAll<HTMLElement>('*'));
  for (const element of elements) {
    const tag = element.tagName.toLowerCase();
    stripFixedWidthStyles(element.style, ['width', 'min-width', 'max-width']);
    element.style.setProperty('box-sizing', 'border-box', 'important');

    if (element.hasAttribute('width')) {
      element.removeAttribute('width');
    }

    if (tag === 'table') {
      element.style.setProperty('width', '100%', 'important');
      element.style.setProperty('max-width', '100%', 'important');
      element.style.setProperty('min-width', '0', 'important');
      element.style.setProperty('table-layout', 'fixed', 'important');
    } else if (tag === 'img') {
      element.style.setProperty('display', 'block', 'important');
      element.style.setProperty('max-width', '100%', 'important');
      element.style.setProperty('width', 'auto', 'important');
      element.style.setProperty('height', 'auto', 'important');
    } else {
      element.style.setProperty('max-width', '100%', 'important');
      element.style.setProperty('min-width', '0', 'important');
    }

    if (tag === 'pre' || tag === 'code') {
      element.style.setProperty('white-space', 'pre-wrap', 'important');
      element.style.setProperty('overflow-wrap', 'anywhere', 'important');
      element.style.setProperty('word-break', 'break-word', 'important');
    }

    if (tag === 'td' || tag === 'th') {
      element.style.setProperty('word-break', 'break-word', 'important');
      element.style.setProperty('overflow-wrap', 'anywhere', 'important');
    }
  }

  doc.body.style.margin = '0';
  doc.body.style.maxWidth = '100%';
  doc.body.style.minWidth = '0';
  doc.body.style.overflowX = 'hidden';

  const inlineStyles = Array.from(doc.head.querySelectorAll('style'))
    .map((style) => style.outerHTML)
    .join('');

  return `${inlineStyles}${doc.body.innerHTML}`;
}

function ResponsiveEmailHtml({ html }: { html: string }) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState(html);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(MOBILE_DETAIL_BREAKPOINT);
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateIsMobile);
      return () => mediaQuery.removeEventListener('change', updateIsMobile);
    }

    mediaQuery.addListener(updateIsMobile);
    return () => mediaQuery.removeListener(updateIsMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setRenderedHtml(html);
      return;
    }

    setRenderedHtml(transformHtmlForMobile(html));
  }, [html, isMobile]);

  useEffect(() => {
    if (!isMobile) {
      setScale(1);
      setScaledHeight(null);
      return;
    }

    const shell = shellRef.current;
    const content = contentRef.current;
    if (!shell || !content || typeof window === 'undefined') return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const availableWidth = shell.clientWidth;
        if (!availableWidth) return;

        const contentWidth = Math.max(content.scrollWidth, content.offsetWidth);
        const nextScale = contentWidth > availableWidth ? availableWidth / contentWidth : 1;
        const nextHeight = nextScale < 1 ? Math.ceil(content.scrollHeight * nextScale) : null;

        setScale((current) => (Math.abs(current - nextScale) < 0.01 ? current : nextScale));
        setScaledHeight((current) => (current === nextHeight ? current : nextHeight));
      });
    };
    const resizeObserver = new ResizeObserver(measure);

    resizeObserver.observe(shell);
    resizeObserver.observe(content);
    measure();

    const images = Array.from(content.querySelectorAll('img'));
    const handleImageLoad = () => measure();
    for (const image of images) {
      image.addEventListener('load', handleImageLoad, { once: true });
      image.addEventListener('error', handleImageLoad, { once: true });
    }

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      for (const image of images) {
        image.removeEventListener('load', handleImageLoad);
        image.removeEventListener('error', handleImageLoad);
      }
    };
  }, [isMobile, renderedHtml]);

  return (
    <div
      ref={shellRef}
      className="email-html-shell overflow-hidden px-1 py-2 lg:p-5"
      style={scaledHeight ? { height: scaledHeight } : undefined}
    >
      <div
        ref={contentRef}
        className="email-html"
        style={isMobile ? { transform: `scale(${scale})`, transformOrigin: 'top left' } : undefined}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
}

export function EmailDetail({ email }: { email: Email }) {
  const [mode, setMode] = useState<'html' | 'text'>('html');
  const [dx, setDx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [openSide, setOpenSide] = useState<'left' | 'right' | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startOffset = useRef(0);
  const draggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const { openComposeReply, openComposeReplyAll, openComposeForward, setSelectedEmail } = useEmails();
  const { act, archive, toggleRead, toggleStar } = useEmailActions();

  // Guard so we only fire markRead once per email.id, regardless of `act`
  // identity churn (it depends on selectedEmail upstream).
  const markedReadRef = useRef<string | null>(null);
  useEffect(() => {
    if (email.isRead) return;
    if (markedReadRef.current === email.id) return;
    markedReadRef.current = email.id;
    act([email.id], 'markRead').catch(() => {
      // Allow a retry on the next render if the request failed.
      markedReadRef.current = null;
    });
  }, [email.id, email.isRead, act]);

  const sanitizedHtml = useMemo(() => {
    const html = email.html ?? null;
    if (!html) return null;
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }, [email.html]);

  const textFallback = useMemo(() => {
    return getEmailPreview(email.text ?? null, email.html ?? null, 50000);
  }, [email.text, email.html]);

  const replyParts = useMemo(() => {
    const source = email.text?.trim() ? email.text : stripHtml(email.html ?? '');
    return splitReplyContent(source);
  }, [email.text, email.html]);

  const canShowHtml = Boolean(sanitizedHtml);
  const hasQuotedHistory = Boolean(replyParts.quotedHeader || replyParts.quotedBody);
  const fromParsed = parseEmailAddress(email.from);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startY.current = e.clientY;
    startOffset.current = openSide === 'left' ? -DETAIL_SWIPE_REVEAL : openSide === 'right' ? DETAIL_READ_REVEAL : 0;
    draggingRef.current = false;
    hasDraggedRef.current = false;
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' || startX.current === null || startY.current === null) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;
    if (!draggingRef.current) {
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
        draggingRef.current = true;
        hasDraggedRef.current = true;
      } else return;
    }
    e.preventDefault();
    const raw = startOffset.current + deltaX;
    setDx(Math.max(-DETAIL_SWIPE_REVEAL - 28, Math.min(DETAIL_READ_REVEAL + 28, raw)));
  };

  const closeSwipe = () => {
    setOpenSide(null);
    setDx(0);
  };

  const closeDetail = useCallback(() => {
    setOpenSide(null);
    setDx(0);
    setSelectedEmail(null);
  }, [setSelectedEmail]);

  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    const wasDragging = draggingRef.current;
    draggingRef.current = false;
    setIsDragging(false);
    startX.current = null;
    startY.current = null;
    if (!wasDragging) {
      return;
    }
    if (dx <= -DETAIL_FULL_TRIGGER) {
      closeSwipe();
      setMoreOpen(true);
    } else if (dx <= -DETAIL_SWIPE_TRIGGER) {
      setOpenSide('left');
      setDx(-DETAIL_SWIPE_REVEAL);
    } else if (dx >= DETAIL_SWIPE_TRIGGER) {
      setOpenSide('right');
      setDx(DETAIL_READ_REVEAL);
    } else {
      closeSwipe();
    }
  };

  return (
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden">
      <div className="absolute inset-y-0 left-0 flex items-center bg-blue-500 text-white">
        <button
          type="button"
          onClick={() => {
            toggleRead(email);
            closeSwipe();
          }}
          className="h-full w-[92px] pl-3 pr-4 flex flex-col items-center justify-center gap-1 text-[11px]"
        >
          {email.isRead ? <Mail className="w-5 h-5" /> : <MailOpen className="w-5 h-5" />}
          {email.isRead ? 'Unread' : 'Read'}
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-stretch justify-end">
        <button
          type="button"
          onClick={() => {
            setMoreOpen(true);
            closeSwipe();
          }}
          className="w-20 px-3 bg-slate-500 text-white flex flex-col items-center justify-center gap-1 text-[11px]"
        >
          <Ellipsis className="w-4 h-4" />More
        </button>
        <button
          type="button"
          onClick={() => {
            toggleStar(email);
            closeSwipe();
          }}
          className="w-20 px-3 bg-yellow-500 text-white flex flex-col items-center justify-center gap-1 text-[11px]"
        >
          <Star className="w-4 h-4" fill="currentColor" />Flag
        </button>
        <button
          type="button"
          onClick={() => {
            archive(email);
            closeSwipe();
          }}
          className="w-20 px-3 bg-green-600 text-white flex flex-col items-center justify-center gap-1 text-[11px]"
        >
          <Archive className="w-4 h-4" />Archive
        </button>
      </div>
      <div
        className="relative z-10 flex flex-col h-full min-h-0 bg-surface"
        style={{
          transform: `translate3d(${dx}px, 0, 0)`,
          transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onClick={() => {
          if (hasDraggedRef.current) return;
          if (openSide) closeSwipe();
        }}
      >
      {/* Sticky header (mobile back button + actions) */}
      <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-line px-2 lg:px-3 py-2 flex items-center gap-1 lg:gap-2 pt-safe">
        <button
          type="button"
          onClick={closeDetail}
          aria-label="Back"
          className="lg:hidden h-10 shrink-0 inline-flex items-center rounded-full pr-2 text-accent hover:bg-accent/10"
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="text-[20px] leading-none">Inbox</span>
        </button>
        <div className="hidden lg:block flex-1 min-w-0">
          <h2 className="text-base lg:text-lg font-semibold text-ink truncate">
            {email.subject?.trim() ? email.subject : '(No subject)'}
          </h2>
        </div>
        <div className="flex-1 lg:hidden" />
        <div className="flex items-center shrink-0">
          <EmailActions email={email} />
        </div>
      </div>

      {/* Scrolling content */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'pan-y' }}
      >
        <div className="px-4 lg:px-6 pt-4 pb-5 space-y-4 max-w-full overflow-x-hidden">
          <h1 className="lg:hidden text-[24px] leading-8 font-semibold text-ink break-words">
            {email.subject?.trim() ? email.subject : '(No subject)'}
          </h1>

          {/* From / meta */}
          <div className="flex items-start gap-3">
            <div
              className="shrink-0 h-10 w-10 rounded-full inline-flex items-center justify-center text-sm font-semibold bg-line/60 text-ink"
              aria-hidden
            >
              {(fromParsed.name || fromParsed.address || '?').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink truncate">
                {formatEmailAddress(email.from)}
              </div>
              <div className="text-xs text-ink-subtle truncate">
                {fromParsed.name ? fromParsed.address : ''}
              </div>
              <div className="text-xs text-ink-subtle mt-1">
                to {email.to?.length ? email.to.map(formatEmailAddress).join(', ') : '(none)'}
                {email.cc?.length ? ` · cc ${email.cc.map(formatEmailAddress).join(', ')}` : ''}
              </div>
              <div className="text-xs text-ink-subtle">{formatFullDate(email.createdAt)}</div>
            </div>
          </div>

          {email.attachments?.length ? <AttachmentsList attachments={email.attachments} /> : null}

          {/* HTML/Text toggle (only show if both present) */}
          {canShowHtml && (
            <div className="inline-flex gap-1 p-1 rounded-xl bg-line/40">
              <button
                type="button"
                onClick={() => setMode('html')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium',
                  mode === 'html' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
                )}
              >
                Rich
              </button>
              <button
                type="button"
                onClick={() => setMode('text')}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium',
                  mode === 'text' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
                )}
              >
                Text
              </button>
            </div>
          )}

          {/* Body */}
          <div className="lg:rounded-2xl lg:border lg:border-line bg-surface overflow-hidden -mx-1 lg:mx-0">
            {hasQuotedHistory ? (
              <div className="px-1 py-2 lg:p-5 text-[15px] leading-6 text-ink">
                <pre className="whitespace-pre-wrap font-sans">
                  {replyParts.body || 'No content'}
                </pre>
                <details className="group mt-4 rounded-xl border border-line bg-line/20">
                  <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-ink-muted hover:text-ink">
                    <span className="group-open:hidden">Show quoted history</span>
                    <span className="hidden group-open:inline">Hide quoted history</span>
                  </summary>
                  <div className="border-t border-line px-3 py-3">
                    {replyParts.quotedHeader ? (
                      <div className="mb-2 text-xs font-medium text-ink-subtle">{replyParts.quotedHeader}</div>
                    ) : null}
                    <pre className="whitespace-pre-wrap border-l-2 border-line pl-3 font-sans text-sm leading-6 text-ink-muted">
                      {replyParts.quotedBody || '(No quoted content)'}
                    </pre>
                  </div>
                </details>
              </div>
            ) : mode === 'html' && sanitizedHtml ? (
              <ResponsiveEmailHtml html={sanitizedHtml} />
            ) : (
              <pre className="whitespace-pre-wrap font-sans px-1 py-2 lg:p-5 text-[15px] leading-6 text-ink">
                {textFallback}
              </pre>
            )}
          </div>

          <EmailThread />
        </div>
      </div>

      {/* Sticky reply bar */}
      <div className="sticky bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur pb-safe">
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => openComposeReply(email)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-hover"
          >
            <ReplyIcon className="w-4 h-4" />
            Reply
          </button>
          <button
            type="button"
            onClick={() => openComposeForward(email)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-line text-sm font-medium text-ink hover:bg-line/40"
          >
            <ForwardIcon className="w-4 h-4" />
            Forward
          </button>
        </div>
      </div>
      </div>

      <ActionSheet isOpen={moreOpen} title="Actions" onClose={() => setMoreOpen(false)}>
        <ActionSheetButton onClick={() => { openComposeReply(email); setMoreOpen(false); }}>Reply</ActionSheetButton>
        <ActionSheetButton onClick={() => { openComposeReplyAll(email); setMoreOpen(false); }}>Reply All</ActionSheetButton>
        <ActionSheetButton onClick={() => { openComposeForward(email); setMoreOpen(false); }}>Forward</ActionSheetButton>
        <ActionSheetButton onClick={() => { toggleStar(email); setMoreOpen(false); }}>{email.isStarred ? 'Unflag' : 'Flag'}</ActionSheetButton>
        <ActionSheetButton onClick={() => { archive(email); setMoreOpen(false); }}>Archive</ActionSheetButton>
        <ActionSheetButton onClick={() => { act([email.id], email.isRead ? 'markUnread' : 'markRead'); setMoreOpen(false); }}>
          {email.isRead ? 'Mark as Unread' : 'Mark as Read'}
        </ActionSheetButton>
      </ActionSheet>
    </div>
  );
}
