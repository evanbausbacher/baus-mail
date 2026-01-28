'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { POLLING_INTERVAL } from '@/lib/constants';

export function usePolling({
  enabled,
  intervalMs = POLLING_INTERVAL,
  poll,
}: {
  enabled: boolean;
  intervalMs?: number;
  poll: () => Promise<void>;
}) {
  const [isPolling, setIsPolling] = useState(false);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const timer = useRef<number | null>(null);

  const shouldPollNow = useCallback(() => {
    if (typeof document === 'undefined') return false;
    if (document.visibilityState !== 'visible') return false;
    // Some browsers can throw if not permitted; keep safe.
    try {
      if (typeof document.hasFocus === 'function' && !document.hasFocus()) return false;
    } catch {
      // ignore
    }
    return true;
  }, []);

  const runOnce = useCallback(async () => {
    if (!enabled) return;
    if (!shouldPollNow()) return;
    if (inFlight.current) return;

    inFlight.current = true;
    setIsPolling(true);
    setError(null);

    try {
      await poll();
      setLastPolledAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Polling failed');
    } finally {
      inFlight.current = false;
      setIsPolling(false);
    }
  }, [enabled, shouldPollNow, poll]);

  useEffect(() => {
    if (!enabled) return;
    if (timer.current) window.clearTimeout(timer.current);

    const tick = async () => {
      await runOnce();
      timer.current = window.setTimeout(tick, intervalMs);
    };

    timer.current = window.setTimeout(tick, intervalMs);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
    };
  }, [enabled, intervalMs, runOnce]);

  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      // When coming back, poll immediately.
      if (shouldPollNow()) runOnce();
    };

    window.addEventListener('focus', onVisibility);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onVisibility);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, shouldPollNow, runOnce]);

  return { isPolling, lastPolledAt, error, pollNow: runOnce };
}

