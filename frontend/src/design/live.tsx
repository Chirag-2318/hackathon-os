import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, apiFetch } from './api';
import { queryKeys } from './queries';
import { cn } from '@/lib/utils';

export interface LiveChangeItem {
  entityId: string;
  actorHandle: string;
  type: string;
  timestamp: number;
}

export interface LiveContextType {
  isConnected: boolean;
  isReconnecting: boolean;
  recentChanges: Map<string, LiveChangeItem>;
}

export const LiveContext = createContext<LiveContextType>({
  isConnected: true,
  isReconnecting: false,
  recentChanges: new Map(),
});

export function useLiveContext() {
  return useContext(LiveContext);
}

/**
 * useRoomLive hook:
 * - Connects to SSE stream `/api/v1/rooms/${roomId}/stream`
 * - Precise invalidation per event type (tasks, docs, stage, team, etc.)
 * - Polling fallback to `/api/v1/rooms/${roomId}/events/latest` every 20s when hidden/error
 * - Exponential backoff reconnect
 * - Tracks "who changed what" changes for non-intrusive highlights
 */
export function useRoomLive(roomId: string | undefined, currentUserId?: string) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [recentChanges, setRecentChanges] = useState<Map<string, LiveChangeItem>>(new Map());

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);
  const fallbackPollRef = useRef<number | null>(null);

  const registerChange = (entityId: string, actorHandle: string, type: string) => {
    setRecentChanges((prev) => {
      const next = new Map(prev);
      next.set(entityId, { entityId, actorHandle, type, timestamp: Date.now() });
      return next;
    });

    // Auto-clear tag after 4 seconds
    setTimeout(() => {
      setRecentChanges((prev) => {
        const next = new Map(prev);
        next.delete(entityId);
        return next;
      });
    }, 4000);
  };

  const handleEvent = (eventData: any) => {
    if (!roomId || !eventData) return;

    // Suppress echo from current user
    if (eventData.actorId && currentUserId && eventData.actorId === currentUserId) {
      return;
    }

    const type = (eventData.type || '').toUpperCase();
    const actorHandle = eventData.actorUsername ? `@${eventData.actorUsername}` : '@teammate';
    const entityId = eventData.entityId || eventData.taskId || eventData.docId;

    if (entityId) {
      registerChange(entityId, actorHandle, type);
    }

    if (type.includes('TASK')) {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.board(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.tasks(roomId) });
    } else if (type.includes('DOC')) {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.docs(roomId) });
    } else if (type.includes('STAGE') || type.includes('ROOM')) {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.detail(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.overview(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.home });
    } else if (type.includes('MEMBER') || type.includes('TEAM')) {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.team(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.presence(roomId) });
    }
  };

  useEffect(() => {
    if (!roomId) return;
    let isUnmounted = false;

    function connectSSE() {
      if (typeof EventSource === 'undefined') {
        startPolling();
        return;
      }

      try {
        const url = `${API_BASE_URL}/api/v1/rooms/${roomId}/stream`;
        const es = new EventSource(url, { withCredentials: true });
        eventSourceRef.current = es;

        es.onopen = () => {
          if (isUnmounted) return;
          setIsConnected(true);
          setIsReconnecting(false);
          reconnectAttempts.current = 0;
          if (fallbackPollRef.current) clearInterval(fallbackPollRef.current);
        };

        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            handleEvent(data);
          } catch {}
        };

        es.onerror = () => {
          if (isUnmounted) return;
          es.close();
          eventSourceRef.current = null;
          setIsConnected(false);
          setIsReconnecting(true);

          // Exponential backoff reconnect
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current), 20000);
          setTimeout(() => {
            if (!isUnmounted) connectSSE();
          }, delay);

          startPolling();
        };
      } catch {
        startPolling();
      }
    }

    function startPolling() {
      if (fallbackPollRef.current) return;
      fallbackPollRef.current = window.setInterval(async () => {
        if (document.visibilityState !== 'visible') return;
        try {
          const res = await apiFetch<any[]>(`/api/v1/rooms/${roomId}/events/latest`);
          if (Array.isArray(res)) {
            res.forEach(handleEvent);
          }
        } catch {}
      }, 20_000);
    }

    connectSSE();

    // Re-verify on window focus
    const onFocus = () => {
      if (!eventSourceRef.current) connectSSE();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      isUnmounted = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (fallbackPollRef.current) {
        clearInterval(fallbackPollRef.current);
      }
      window.removeEventListener('focus', onFocus);
    };
  }, [roomId]);

  return { isConnected, isReconnecting, recentChanges };
}

/**
 * Discreet connection indicator beside the room title
 */
export function LiveIndicator({ isReconnecting }: { isReconnecting?: boolean }) {
  if (!isReconnecting) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 animate-pulse"
      title="Reconnecting to real-time stream"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      <span>Reconnecting...</span>
    </span>
  );
}

/**
 * Hook providing soft highlight animation and actor tag for a row/card
 */
export function useEntityHighlight(entityId: string, changes: Map<string, LiveChangeItem>) {
  const change = changes.get(entityId);
  return {
    isHighlighted: Boolean(change),
    actorHandle: change?.actorHandle,
  };
}

/**
 * Non-intrusive "Updated by @username" badge
 */
export function UpdatedByTag({ actorHandle, className }: { actorHandle?: string; className?: string }) {
  if (!actorHandle) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center text-[10px] font-mono font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded px-1.5 py-0.5 animate-in fade-in duration-300 select-none shadow-xs',
        className
      )}
    >
      Updated by {actorHandle}
    </span>
  );
}

/**
 * Heartbeat presence hook (pings every 30s while visible)
 */
export function usePresenceHeartbeat(roomId?: string) {
  useEffect(() => {
    if (!roomId) return;

    const ping = () => {
      if (document.visibilityState === 'visible') {
        apiFetch(`/api/v1/rooms/${roomId}/presence`, { method: 'POST' }).catch(() => {});
      }
    };

    ping();
    const interval = setInterval(ping, 30_000);
    return () => clearInterval(interval);
  }, [roomId]);
}
