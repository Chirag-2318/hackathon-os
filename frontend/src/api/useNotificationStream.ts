import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/apiClient';

const BASE_URL = API_BASE_URL;

export function useNotificationStream() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const attemptRef = useRef(0);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const url = `${BASE_URL}/api/v1/notifications/stream`;
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      attemptRef.current = 0;
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      eventSourceRef.current = null;

      // Stop retrying on 400, 403, 404 (do not retry client errors)
      fetch(url, { method: 'GET', credentials: 'include', headers: { Accept: 'text/event-stream' } })
        .then((res) => {
          if (res.status === 400 || res.status === 403 || res.status === 404) {
            return;
          }
          const delay = Math.min(60000, 1000 * Math.pow(2, attemptRef.current));
          attemptRef.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, delay);
        })
        .catch(() => {
          const delay = Math.min(60000, 1000 * Math.pow(2, attemptRef.current));
          attemptRef.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, delay);
        });
    };

    es.addEventListener('notification', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    es.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
  }, [queryClient]);

  useEffect(() => {
    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !eventSourceRef.current) {
        attemptRef.current = 0;
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [connect]);

  return { isConnected };
}
