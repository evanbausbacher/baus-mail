'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface TemplatePreviewProps {
  body: string;
  mode: 'plain' | 'reply';
  quotedBody?: string;
  quotedHeader?: string;
}

export function TemplatePreview({ mode, body, quotedHeader, quotedBody }: TemplatePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    fetch('/api/email-templates/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, body, quotedHeader, quotedBody }),
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || 'Failed to render preview');
        }
        return res.text();
      })
      .then((html) => {
        if (cancelled || !iframeRef.current) return;
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
        }
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        if ((e as Error).name === 'AbortError') return;
        setError((e as Error).message || 'Failed to render preview');
        setLoading(false);
      });

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [body, mode, quotedBody, quotedHeader]);

  return (
    <div className="relative h-full min-h-[400px] rounded-xl overflow-hidden border border-line bg-canvas/60">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-ink-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-red-600 px-6 text-center">
          {error}
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Email preview"
        sandbox="allow-same-origin"
        className="w-full h-full bg-white"
        style={{ minHeight: 400 }}
      />
    </div>
  );
}
