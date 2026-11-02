import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/apiClient';

const BASE_URL = API_BASE_URL;

/**
 * useNotificationStream:
 * - Single owner of user-level notifications SSE stream `/api/v1/notifications/stream`
 * - Exponential backoff with full jitter (1s up to 30s)
 * - Resets backoff after stable connection (5s)
 * - Pauses reconnecting while tab is hidden; reconnects immediately on tab visibility
 * - Invalidates active queries only (refetchType: 'active')
 */
export function useNotificationStream() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const stableTimerRef = useRef<number | null>(null);
  const attemptRef = useRef(0);
  const isEvictedRef = useRef(false);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const url = `${BASE_URL}/api/v1/notifications/stream`;
    try {
      const es = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        if (stableTimerRef.current !== null) clearTimeout(stableTimerRef.current);
        stableTimerRef.current = window.setTimeout(() => {
          attemptRef.current = 0;
        }, 5000);
      };

      const handleEvicted = () => {
        isEvictedRef.current = true;
        setIsConnected(false);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        if (reconnectTimeoutRef.current !== null) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = window.setTimeout(() => {
          isEvictedRef.current = false;
          if (document.visibilityState === 'visible') {
            connect();
          }
        }, 15_000);
      };

      es.addEventListener('bye', handleEvicted);
      es.addEventListener('evicted', handleEvicted);

      es.onerror = () => {
        setIsConnected(false);
        if (stableTimerRef.current !== null) {
          clearTimeout(stableTimerRef.current);
          stableTimerRef.current = null;
        }
        es.close();
        eventSourceRef.current = null;

        if (isEvictedRef.current) return;
        if (document.visibilityState === 'hidden') return;

        // Exponential backoff with full jitter: 1s up to 30s
        attemptRef.current += 1;
        const maxDelay = Math.min(30000, 1000 * Math.pow(2, attemptRef.current - 1));
        const delay = Math.floor(Math.random() * (maxDelay - 1000 + 1)) + 1000;

        if (reconnectTimeoutRef.current !== null) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (document.visibilityState === 'visible') {
            connect();
          }
        }, delay);
      };

      es.addEventListener('notification', () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'active' });
      });

      es.addEventListener('user', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.topic === 'rooms') {
            queryClient.invalidateQueries({ queryKey: ['home'], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: ['rooms'], refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: ['my-rooms'], refetchType: 'active' });
          } else {
            queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'active' });
          }
        } catch {
          queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'active' });
        }
      });

      es.onmessage = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'active' });
      };
    } catch {
      setIsConnected(false);
    }
  }, [queryClient]);

  useEffect(() => {
    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (reconnectTimeoutRef.current !== null) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      } else {
        if (!eventSourceRef.current && !isEvictedRef.current) {
          attemptRef.current = 0;
          connect();
          queryClient.invalidateQueries({ queryKey: ['notifications'], refetchType: 'active' });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (stableTimerRef.current !== null) {
        clearTimeout(stableTimerRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [connect, queryClient]);

  return { isConnected };
}
