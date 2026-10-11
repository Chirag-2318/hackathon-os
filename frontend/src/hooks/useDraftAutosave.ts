import { useState, useEffect, useRef, useCallback } from 'react';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const DRAFT_PREFIX = 'hos:draft:';

interface StoredDraft<T> {
  data: T;
  savedAt: number;
}

export function useDraftAutosave<T>(key: string, data: T, delayMs = 1000) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<number | null>(null);
  const storageKey = `${DRAFT_PREFIX}${key}`;

  // Purge expired draft or load initial
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: StoredDraft<T> = JSON.parse(raw);
        if (Date.now() - parsed.savedAt > SEVEN_DAYS_MS) {
          localStorage.removeItem(storageKey);
        } else {
          setLastSaved(new Date(parsed.savedAt));
        }
      }
    } catch {
      // Storage unavailable or quota exceeded
    }
  }, [storageKey]);

  // Debounced auto-save
  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      try {
        const payload: StoredDraft<T> = {
          data,
          savedAt: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        setLastSaved(new Date(payload.savedAt));
      } catch {
        // Storage fail-safe
      }
    }, delayMs);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [data, delayMs, storageKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setLastSaved(null);
    } catch {
      // Fail-safe
    }
  }, [storageKey]);

  return { lastSaved, clearDraft };
}
