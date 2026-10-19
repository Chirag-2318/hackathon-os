import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/apiClient';

const BASE_URL = API_BASE_URL;

export interface RoomEventPayload {
  type: string;
  roomId?: string;
  actorId?: string;
  at?: string;
  [key: string]: any;
}

export function useRoomEvents(roomId: string | undefined, currentUserId?: string) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RoomEventPayload | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const pendingInvalidationsRef = useRef<Set<string>>(new Set());
  const attemptRef = useRef(0);

  const flushInvalidations = useCallback(() => {
    if (!roomId) return;
    const targets = Array.from(pendingInvalidationsRef.current);
    pendingInvalidationsRef.current.clear();

    targets.forEach((target) => {
      switch (target) {
        case 'stage':
        case 'room':
          queryClient.invalidateQueries({ queryKey: ['room-overview', roomId] });
          queryClient.invalidateQueries({ queryKey: ['room', roomId] });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId] });
          break;
        case 'ideas':
          queryClient.invalidateQueries({ queryKey: ['ideas', roomId] });
          queryClient.invalidateQueries({ queryKey: ['ideate', roomId] });
          break;
        case 'board':
          queryClient.invalidateQueries({ queryKey: ['board', roomId] });
          queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId] });
          break;
        case 'checkpoints':
          queryClient.invalidateQueries({ queryKey: ['room-overview', roomId] });
          queryClient.invalidateQueries({ queryKey: ['schedule', roomId] });
          break;
        case 'github':
          queryClient.invalidateQueries({ queryKey: ['github-activity', roomId] });
          queryClient.invalidateQueries({ queryKey: ['github', roomId] });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId] });
          break;
        case 'docs':
          queryClient.invalidateQueries({ queryKey: ['docs', roomId] });
          break;
        case 'phases':
          queryClient.invalidateQueries({ queryKey: ['phases', roomId] });
          break;
        case 'comments':
          queryClient.invalidateQueries({ queryKey: ['board', roomId] });
          queryClient.invalidateQueries({ queryKey: ['comments', roomId] });
          break;
        case 'pitchkit':
          queryClient.invalidateQueries({ queryKey: ['pitchkit-readiness', roomId] });
          queryClient.invalidateQueries({ queryKey: ['pitchkit-settings', roomId] });
          queryClient.invalidateQueries({ queryKey: ['demo-assets', roomId] });
          queryClient.invalidateQueries({ queryKey: ['demo-ladder', roomId] });
          queryClient.invalidateQueries({ queryKey: ['demo-preflight', roomId] });
          queryClient.invalidateQueries({ queryKey: ['room-overview', roomId] });
          break;
        default:
          queryClient.invalidateQueries({ queryKey: ['room-overview', roomId] });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId] });
          break;
      }
    });
  }, [queryClient, roomId]);

  const scheduleInvalidation = useCallback(
    (target: string) => {
      pendingInvalidationsRef.current.add(target);
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(() => {
        flushInvalidations();
      }, 300);
    },
    [flushInvalidations]
  );

  const handleIncomingEvent = useCallback(
    (type: string, dataStr: string) => {
      try {
        const payload: RoomEventPayload = JSON.parse(dataStr);
        setLastEvent(payload);

        // Echo suppression: if actorId matches current user, skip invalidation
        if (payload.actorId && currentUserId && payload.actorId === currentUserId) {
          return;
        }

        const evType = payload.type || type;
        if (evType.includes('STAGE') || evType.includes('ROOM')) {
          scheduleInvalidation('stage');
        } else if (evType.includes('IDEA')) {
          scheduleInvalidation('ideas');
        } else if (evType.includes('PHASE')) {
          scheduleInvalidation('phases');
          scheduleInvalidation('board');
        } else if (evType.includes('TASK')) {
          scheduleInvalidation('board');
        } else if (evType.includes('CHECKPOINT')) {
          scheduleInvalidation('checkpoints');
        } else if (evType.includes('GITHUB')) {
          scheduleInvalidation('github');
        } else if (evType.includes('DOC')) {
          scheduleInvalidation('docs');
        } else if (evType.includes('COMMENT')) {
          scheduleInvalidation('comments');
        } else if (evType.includes('PITCH') || evType.includes('DEMO')) {
          scheduleInvalidation('pitchkit');
        } else {
          scheduleInvalidation('default');
        }
      } catch {
        scheduleInvalidation('default');
      }
    },
    [currentUserId, scheduleInvalidation]
  );

  const connect = useCallback(() => {
    if (!roomId) return;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const url = `${BASE_URL}/api/v1/rooms/${roomId}/events`;
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

    // Listen to standard named room events
    const eventNames = [
      'init',
      'ROOM_STAGE_CHANGED',
      'ROOM_UPDATED',
      'IDEA_CREATED',
      'IDEA_VOTED',
      'IDEA_UPDATED',
      'IDEA_DELETED',
      'TASK_CREATED',
      'TASK_UPDATED',
      'TASK_DELETED',
      'TASK_MOVED',
      'CHECKPOINT_RESOLVED',
      'GITHUB_SYNCED',
      'GITHUB_DRIFT_ALERT',
      'DOC_UPDATED',
      'COMMENT_ADDED',
    ];

    eventNames.forEach((name) => {
      es.addEventListener(name, (event: MessageEvent) => {
        handleIncomingEvent(name, event.data);
      });
    });

    es.onmessage = (event: MessageEvent) => {
      handleIncomingEvent('message', event.data);
    };
  }, [roomId, handleIncomingEvent]);

  useEffect(() => {
    if (!roomId) return;
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
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [roomId, connect]);

  return { isConnected, lastEvent };
}
