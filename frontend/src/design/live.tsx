import React, { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_BASE_URL, apiFetch } from './api';
import { queryKeys } from './queries';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';

export type LiveStatus = 'live' | 'reconnecting' | 'polling' | 'offline';

export interface LiveChangeItem {
  entityId: string;
  actorHandle: string;
  type: string;
  timestamp: number;
}

export interface LiveContextType {
  status: LiveStatus;
  isConnected: boolean;
  isReconnecting: boolean;
  onlineUserIds: string[];
  recentChanges: Map<string, LiveChangeItem>;
  conflict: { editorName: string; entityName: string; onReload: () => void } | null;
  setConflict: (conflict: { editorName: string; entityName: string; onReload: () => void } | null) => void;
  clearConflict: () => void;
  isUserOnline: (userId?: string) => boolean;
  lastSeq: number;
  lastEvent: any | null;
  subscribe: (listener: (event: any) => void) => () => void;
}

export const LiveContext = createContext<LiveContextType>({
  status: 'live',
  isConnected: true,
  isReconnecting: false,
  onlineUserIds: [],
  recentChanges: new Map(),
  conflict: null,
  setConflict: () => {},
  clearConflict: () => {},
  isUserOnline: () => false,
  lastSeq: 0,
  lastEvent: null,
  subscribe: () => () => {},
});

export function useLiveContext() {
  return useContext(LiveContext);
}

/**
 * useRoomLive hook:
 * - Connects to SSE stream `/api/v1/rooms/${roomId}/events`
 * - Reconnects with exponential backoff and full jitter (1s up to 30s), reset on stable connection
 * - Honors server 'bye' / 'evicted' events with delayed backoff (15s)
 * - Pauses reconnecting while tab is hidden, reconnects + resyncs immediately when tab becomes visible
 * - Always transmits lastEventId on reconnect
 * - Refetches active queries only (refetchType: 'active') with 250ms debounced coalescing
 * - Exposes lastEvent and subscribe listener registry for seamless context consumption
 */
export function useRoomLive(roomId: string | undefined, currentUserId?: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [status, setStatus] = useState<LiveStatus>('live');
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [recentChanges, setRecentChanges] = useState<Map<string, LiveChangeItem>>(new Map());
  const [conflict, setConflict] = useState<{ editorName: string; entityName: string; onReload: () => void } | null>(null);
  const [lastEvent, setLastEvent] = useState<any | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const stableTimerRef = useRef<number | null>(null);
  const hiddenTimerRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const pendingTopicsRef = useRef<Set<string>>(new Set());
  const lastToastTimeRef = useRef(0);
  const lastSeqRef = useRef(0);
  const isEvictedRef = useRef(false);
  const listenersRef = useRef<Set<(event: any) => void>>(new Set());

  const clearConflict = useCallback(() => setConflict(null), []);

  const isUserOnline = useCallback(
    (userId?: string) => {
      if (!userId) return false;
      return onlineUserIds.includes(String(userId));
    },
    [onlineUserIds]
  );

  const subscribe = useCallback((listener: (event: any) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const fetchPresence = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await apiFetch<{ online?: string[] }>(`/api/v1/rooms/${roomId}/presence`);
      if (res?.online) {
        setOnlineUserIds(res.online.map(String));
      }
    } catch {}
  }, [roomId]);

  const flushPendingTopics = useCallback(() => {
    if (!roomId) return;
    const topics = Array.from(pendingTopicsRef.current);
    pendingTopicsRef.current.clear();

    topics.forEach((topic) => {
      if (topic.startsWith('task:')) {
        const taskId = topic.slice(5);
        queryClient.invalidateQueries({ queryKey: ['task', taskId], refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: ['tasks', roomId], refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: ['board', roomId], refetchType: 'active' });
        return;
      }

      switch (topic) {
        case 'board':
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.board(roomId), refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.tasks(roomId), refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['board', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['tasks', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId], refetchType: 'active' });
          break;
        case 'ideas':
          queryClient.invalidateQueries({ queryKey: ['ideas', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['ideate', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId], refetchType: 'active' });
          break;
        case 'brief':
          queryClient.invalidateQueries({ queryKey: ['brief', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['briefs', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId], refetchType: 'active' });
          break;
        case 'plan':
          queryClient.invalidateQueries({ queryKey: ['plan', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['phases', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId], refetchType: 'active' });
          break;
        case 'members':
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.team(roomId), refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['members', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['team', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['room', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.detail(roomId), refetchType: 'active' });
          fetchPresence();
          apiFetch(`/api/v1/rooms/${roomId}`).catch((err: any) => {
            if (err?.status === 403 || err?.status === 404) {
              toast.error('You were removed from this room');
              navigate('/app/rooms');
            }
          });
          break;
        case 'presence':
          fetchPresence();
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.presence(roomId), refetchType: 'active' });
          break;
        case 'docs':
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.docs(roomId), refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['docs', roomId], refetchType: 'active' });
          break;
        case 'mvp':
          queryClient.invalidateQueries({ queryKey: ['mvp', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['mvp-state', roomId], refetchType: 'active' });
          break;
        case 'checkpoints':
          queryClient.invalidateQueries({ queryKey: ['checkpoints', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['schedule', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['overview', roomId], refetchType: 'active' });
          break;
        case 'github':
          queryClient.invalidateQueries({ queryKey: ['github', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['github-activity', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId], refetchType: 'active' });
          break;
        case 'pitch':
        case 'pitchkit':
          queryClient.invalidateQueries({ queryKey: ['pitch', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['deck', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['pitchkit-readiness', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['pitchkit-settings', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['demo-assets', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['demo-ladder', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['demo-preflight', roomId], refetchType: 'active' });
          break;
        case 'phases':
          queryClient.invalidateQueries({ queryKey: ['phases', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['board', roomId], refetchType: 'active' });
          break;
        case 'comments':
          queryClient.invalidateQueries({ queryKey: ['comments', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['board', roomId], refetchType: 'active' });
          break;
        case 'demo':
          queryClient.invalidateQueries({ queryKey: ['demo', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['submission', roomId], refetchType: 'active' });
          break;
        case 'submission':
          queryClient.invalidateQueries({ queryKey: ['submission', roomId], refetchType: 'active' });
          break;
        case 'mentor':
          queryClient.invalidateQueries({ queryKey: ['mentor', roomId], refetchType: 'active' });
          break;
        case 'stage':
          queryClient.invalidateQueries({ queryKey: ['stage', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['journey', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['room', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['phases', roomId], refetchType: 'active' });
          break;
        case 'apis':
          queryClient.invalidateQueries({ queryKey: ['apis', roomId], refetchType: 'active' });
          break;
        case 'diagrams':
          queryClient.invalidateQueries({ queryKey: ['diagrams', roomId], refetchType: 'active' });
          break;
        case 'retro':
          queryClient.invalidateQueries({ queryKey: ['retro', roomId], refetchType: 'active' });
          break;
        case 'overview':
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.overview(roomId), refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['room-overview', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['overview', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['room', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: queryKeys.home, refetchType: 'active' });
          break;
        case 'resync':
          queryClient.invalidateQueries({ queryKey: ['room', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['board', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['tasks', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['ideas', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['brief', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['plan', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['members', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['docs', roomId], refetchType: 'active' });
          queryClient.invalidateQueries({ queryKey: ['stage', roomId], refetchType: 'active' });
          fetchPresence();
          break;
        default:
          queryClient.invalidateQueries({ queryKey: ['room-overview', roomId], refetchType: 'active' });
          break;
      }
    });
  }, [roomId, queryClient, fetchPresence, navigate]);

  const scheduleTopicInvalidation = useCallback(
    (topic: string) => {
      pendingTopicsRef.current.add(topic);
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(() => {
        flushPendingTopics();
      }, 250);
    },
    [flushPendingTopics]
  );

  const registerFlashChange = useCallback((entityId: string, actorName: string, topic: string) => {
    setRecentChanges((prev) => {
      const next = new Map(prev);
      next.set(entityId, { entityId, actorHandle: actorName, type: topic, timestamp: Date.now() });
      return next;
    });

    window.setTimeout(() => {
      setRecentChanges((prev) => {
        const next = new Map(prev);
        next.delete(entityId);
        return next;
      });
    }, 1200);
  }, []);

  const handleRoomEvent = useCallback(
    (eventData: any) => {
      if (!roomId || !eventData) return;
      const { seq, topic, actorId, actorName, entityId } = eventData;
      if (typeof seq === 'number') {
        lastSeqRef.current = Math.max(lastSeqRef.current, seq);
      }

      setLastEvent(eventData);
      listenersRef.current.forEach((listener) => {
        try {
          listener(eventData);
        } catch {}
      });

      const isMe = actorId && currentUserId && String(actorId) === String(currentUserId);

      if (entityId && !isMe) {
        registerFlashChange(String(entityId), actorName || 'Teammate', topic || 'room');
      }

      const now = Date.now();
      if (!isMe && actorName && now - lastToastTimeRef.current >= 3000) {
        let msg: string | null = null;
        if (topic === 'board') {
          msg = `${actorName} updated the board`;
        } else if (topic === 'ideas') {
          msg = `${actorName} added an idea`;
        } else if (topic === 'members') {
          msg = `${actorName} updated team roster`;
        } else if (topic === 'brief') {
          msg = `${actorName} updated the brief`;
        } else if (topic === 'stage') {
          msg = `Build phase is live`;
        }
        if (msg) {
          lastToastTimeRef.current = now;
          toast.info(msg);
        }
      }

      scheduleTopicInvalidation(topic || 'overview');
    },
    [roomId, currentUserId, registerFlashChange, scheduleTopicInvalidation]
  );

  useEffect(() => {
    if (!roomId) return;
    let isUnmounted = false;

    function stopPolling() {
      if (pollTimerRef.current !== null) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    function startFallbackPolling() {
      if (pollTimerRef.current !== null) return;
      setStatus('polling');
      pollTimerRef.current = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchPresence();
          flushPendingTopics();
        }
      }, 30_000);
    }

    function connectSSE() {
      if (isUnmounted) return;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const baseUrl = typeof window !== 'undefined' && window.location.port === '5173'
        ? ''
        : (API_BASE_URL || '');
      const baseEndpoint = `${baseUrl}/api/v1/rooms/${roomId}/events`;
      const url = lastSeqRef.current > 0
        ? `${baseEndpoint}?lastEventId=${lastSeqRef.current}`
        : baseEndpoint;

      try {
        const es = new EventSource(url, { withCredentials: true });
        eventSourceRef.current = es;

        es.onopen = () => {
          if (isUnmounted) return;
          setStatus('live');
          stopPolling();
          fetchPresence();
          if (stableTimerRef.current !== null) clearTimeout(stableTimerRef.current);
          stableTimerRef.current = window.setTimeout(() => {
            reconnectAttempts.current = 0;
          }, 5000);
        };

        es.addEventListener('room', (e: MessageEvent) => {
          if (isUnmounted) return;
          setStatus('live');
          try {
            const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
            handleRoomEvent(data);
          } catch {}
        });

        es.addEventListener('init', () => {
          if (!isUnmounted) {
            setStatus('live');
            fetchPresence();
          }
        });

        const handleEvicted = () => {
          if (isUnmounted) return;
          isEvictedRef.current = true;
          setStatus('offline');
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          if (reconnectTimerRef.current !== null) {
            clearTimeout(reconnectTimerRef.current);
          }
          reconnectTimerRef.current = window.setTimeout(() => {
            isEvictedRef.current = false;
            if (document.visibilityState === 'visible' && !isUnmounted) {
              connectSSE();
            }
          }, 15_000);
        };

        es.addEventListener('bye', handleEvicted);
        es.addEventListener('evicted', handleEvicted);

        es.onerror = () => {
          if (isUnmounted) return;
          if (stableTimerRef.current !== null) {
            clearTimeout(stableTimerRef.current);
            stableTimerRef.current = null;
          }
          es.close();
          eventSourceRef.current = null;

          if (isEvictedRef.current) return;

          if (document.visibilityState === 'hidden') {
            setStatus('offline');
            return;
          }

          reconnectAttempts.current += 1;
          if (reconnectAttempts.current >= 4) {
            startFallbackPolling();
          } else {
            setStatus('reconnecting');
          }

          const maxDelay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts.current - 1));
          const delay = Math.floor(Math.random() * (maxDelay - 1000 + 1)) + 1000;

          if (reconnectTimerRef.current !== null) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = window.setTimeout(() => {
            if (!isUnmounted && document.visibilityState === 'visible') {
              connectSSE();
            }
          }, delay);
        };
      } catch {
        startFallbackPolling();
      }
    }

    connectSSE();
    fetchPresence();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (reconnectTimerRef.current !== null) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        hiddenTimerRef.current = window.setTimeout(() => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setStatus('offline');
          }
        }, 120_000);
      } else {
        if (hiddenTimerRef.current !== null) {
          clearTimeout(hiddenTimerRef.current);
          hiddenTimerRef.current = null;
        }
        if (!eventSourceRef.current && !isEvictedRef.current) {
          reconnectAttempts.current = 0;
          connectSSE();
          scheduleTopicInvalidation('resync');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      isUnmounted = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);

      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (stableTimerRef.current !== null) {
        clearTimeout(stableTimerRef.current);
      }
      if (hiddenTimerRef.current !== null) {
        clearTimeout(hiddenTimerRef.current);
      }
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
      stopPolling();

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [roomId, handleRoomEvent, fetchPresence, scheduleTopicInvalidation, flushPendingTopics]);

  return {
    status,
    isConnected: status === 'live',
    isReconnecting: status === 'reconnecting',
    onlineUserIds,
    recentChanges,
    conflict,
    setConflict,
    clearConflict,
    isUserOnline,
    lastSeq: lastSeqRef.current,
    lastEvent,
    subscribe,
  };
}

/**
 * Status chip with green/amber/gray dot + online avatar stack with "3 online"
 */
export function LiveIndicator({
  status: propStatus,
  isReconnecting: propReconnecting,
  onlineUserIds: propOnlineUserIds,
  members = [],
}: {
  status?: LiveStatus;
  isReconnecting?: boolean;
  onlineUserIds?: string[];
  members?: any[];
}) {
  const context = useLiveContext();
  const effectiveStatus = propStatus || (propReconnecting ? 'reconnecting' : context.status);
  const effectiveOnlineIds = propOnlineUserIds || context.onlineUserIds || [];

  const onlineCount = effectiveOnlineIds.length;
  const onlineMembers = (members || []).filter((m: any) =>
    effectiveOnlineIds.includes(String(m.id || m.userId))
  );

  const statusConfig = {
    live: { label: 'Live', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
    reconnecting: { label: 'Reconnecting...', dot: 'bg-amber-500 animate-ping', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
    polling: { label: 'Polling', dot: 'bg-zinc-400', text: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700' },
    offline: { label: 'Offline', dot: 'bg-zinc-400', text: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700' },
  }[effectiveStatus] || { label: 'Live', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border transition-colors select-none',
          statusConfig.bg,
          statusConfig.text
        )}
        title={`Room connection: ${statusConfig.label}`}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusConfig.dot)} />
        <span>{statusConfig.label}</span>
      </span>

      {onlineCount > 0 && (
        <div className="flex items-center gap-1 text-[11px] font-medium text-ink-2 select-none" title={`${onlineCount} teammate${onlineCount > 1 ? 's' : ''} currently in this room`}>
          <div className="flex -space-x-1.5 overflow-hidden">
            {onlineMembers.slice(0, 3).map((m: any, idx: number) => (
              <span key={m.id || idx} className="relative inline-block ring-2 ring-surface rounded-full">
                <UserAvatar
                  user={{
                    displayName: m.name || m.displayName || 'Member',
                    avatarUrl: m.avatarUrl,
                  }}
                  className="w-4 h-4 text-[8px]"
                />
              </span>
            ))}
          </div>
          <span>{onlineCount} online</span>
        </div>
      )}
    </div>
  );
}

/**
 * Green presence dot for avatar components
 */
export function PresenceDot({ isOnline }: { isOnline: boolean }) {
  if (!isOnline) return null;
  return (
    <span
      className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-surface"
      title="Online now"
    />
  );
}

/**
 * Banner shown when someone else changed a form/editor concurrently:
 * "<name> changed this. Load latest"
 */
export function LiveConflictBanner({
  editorName,
  onLoadLatest,
  onKeepMine,
}: {
  editorName: string;
  onLoadLatest: () => void;
  onKeepMine: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg text-[13px] text-amber-900 dark:text-amber-200 animate-in fade-in duration-200 mb-3">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
        <span>
          <strong className="font-semibold">{editorName || 'A teammate'}</strong> changed this. Load latest?
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onLoadLatest}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
        >
          Load latest
        </button>
        <button
          type="button"
          onClick={onKeepMine}
          className="px-2 py-1 text-xs font-medium rounded-md text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
        >
          Keep mine
        </button>
      </div>
    </div>
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
 * Backward-compatible presence heartbeat hook
 */
export function usePresenceHeartbeat(roomId?: string) {
  useEffect(() => {
    // Redundant interval polling eliminated: the SSE connection in useRoomLive
    // natively maintains presence. No recurring 30s HTTP ping required.
  }, [roomId]);
}
