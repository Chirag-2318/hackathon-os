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
});

export function useLiveContext() {
  return useContext(LiveContext);
}

/**
 * useRoomLive hook:
 * - Connects to SSE stream `/api/v1/rooms/${roomId}/events`
 * - Reconnects with exponential backoff (1s, 2s, 4s up to 30s)
 * - Tab hidden for 2 minutes disconnects; reopens on focus + resync
 * - Fallback to 30s polling if stream fails after 3 tries
 * - 250ms debounced topic registry query invalidation
 * - Notable event toasts and 1.2s soft accent fade for item changes
 * - Presence tracking and conflict banner management
 */
export function useRoomLive(roomId: string | undefined, currentUserId?: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [status, setStatus] = useState<LiveStatus>('live');
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [recentChanges, setRecentChanges] = useState<Map<string, LiveChangeItem>>(new Map());
  const [conflict, setConflict] = useState<{ editorName: string; entityName: string; onReload: () => void } | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const hiddenTimerRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const pendingTopicsRef = useRef<Set<string>>(new Set());
  const lastToastTimeRef = useRef(0);
  const lastSeqRef = useRef(0);

  const clearConflict = useCallback(() => setConflict(null), []);

  const isUserOnline = useCallback(
    (userId?: string) => {
      if (!userId) return false;
      return onlineUserIds.includes(String(userId));
    },
    [onlineUserIds]
  );

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
        queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
        queryClient.invalidateQueries({ queryKey: ['board', roomId] });
        return;
      }

      switch (topic) {
        case 'board':
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.board(roomId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.tasks(roomId) });
          queryClient.invalidateQueries({ queryKey: ['board', roomId] });
          queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId] });
          break;
        case 'ideas':
          queryClient.invalidateQueries({ queryKey: ['ideas', roomId] });
          queryClient.invalidateQueries({ queryKey: ['ideate', roomId] });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId] });
          break;
        case 'brief':
          queryClient.invalidateQueries({ queryKey: ['brief', roomId] });
          queryClient.invalidateQueries({ queryKey: ['briefs', roomId] });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId] });
          break;
        case 'plan':
          queryClient.invalidateQueries({ queryKey: ['plan', roomId] });
          queryClient.invalidateQueries({ queryKey: ['phases', roomId] });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId] });
          break;
        case 'members':
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.team(roomId) });
          queryClient.invalidateQueries({ queryKey: ['members', roomId] });
          queryClient.invalidateQueries({ queryKey: ['team', roomId] });
          queryClient.invalidateQueries({ queryKey: ['room', roomId] });
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.detail(roomId) });
          fetchPresence();
          // Check if removed from room
          apiFetch(`/api/v1/rooms/${roomId}`).catch((err: any) => {
            if (err?.status === 403 || err?.status === 404) {
              toast.error('You were removed from this room');
              navigate('/app/rooms');
            }
          });
          break;
        case 'presence':
          fetchPresence();
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.presence(roomId) });
          break;
        case 'docs':
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.docs(roomId) });
          queryClient.invalidateQueries({ queryKey: ['docs', roomId] });
          break;
        case 'mvp':
          queryClient.invalidateQueries({ queryKey: ['mvp', roomId] });
          queryClient.invalidateQueries({ queryKey: ['mvp-state', roomId] });
          break;
        case 'checkpoints':
          queryClient.invalidateQueries({ queryKey: ['checkpoints', roomId] });
          queryClient.invalidateQueries({ queryKey: ['schedule', roomId] });
          queryClient.invalidateQueries({ queryKey: ['overview', roomId] });
          break;
        case 'github':
          queryClient.invalidateQueries({ queryKey: ['github', roomId] });
          queryClient.invalidateQueries({ queryKey: ['github-activity', roomId] });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId] });
          break;
        case 'pitch':
          queryClient.invalidateQueries({ queryKey: ['pitch', roomId] });
          queryClient.invalidateQueries({ queryKey: ['deck', roomId] });
          break;
        case 'demo':
          queryClient.invalidateQueries({ queryKey: ['demo', roomId] });
          queryClient.invalidateQueries({ queryKey: ['submission', roomId] });
          break;
        case 'submission':
          queryClient.invalidateQueries({ queryKey: ['submission', roomId] });
          break;
        case 'mentor':
          queryClient.invalidateQueries({ queryKey: ['mentor', roomId] });
          break;
        case 'stage':
          queryClient.invalidateQueries({ queryKey: ['stage', roomId] });
          queryClient.invalidateQueries({ queryKey: ['journey', roomId] });
          queryClient.invalidateQueries({ queryKey: ['room', roomId] });
          queryClient.invalidateQueries({ queryKey: ['phases', roomId] });
          break;
        case 'apis':
          queryClient.invalidateQueries({ queryKey: ['apis', roomId] });
          break;
        case 'diagrams':
          queryClient.invalidateQueries({ queryKey: ['diagrams', roomId] });
          break;
        case 'retro':
          queryClient.invalidateQueries({ queryKey: ['retro', roomId] });
          break;
        case 'overview':
          queryClient.invalidateQueries({ queryKey: queryKeys.rooms.overview(roomId) });
          queryClient.invalidateQueries({ queryKey: ['room-overview', roomId] });
          queryClient.invalidateQueries({ queryKey: ['overview', roomId] });
          queryClient.invalidateQueries({ queryKey: ['room', roomId] });
          queryClient.invalidateQueries({ queryKey: ['nav-badges', roomId] });
          queryClient.invalidateQueries({ queryKey: queryKeys.home });
          break;
        case 'resync':
          queryClient.invalidateQueries({ queryKey: ['room', roomId] });
          queryClient.invalidateQueries({ queryKey: ['board', roomId] });
          queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
          queryClient.invalidateQueries({ queryKey: ['ideas', roomId] });
          queryClient.invalidateQueries({ queryKey: ['brief', roomId] });
          queryClient.invalidateQueries({ queryKey: ['plan', roomId] });
          queryClient.invalidateQueries({ queryKey: ['members', roomId] });
          queryClient.invalidateQueries({ queryKey: ['docs', roomId] });
          queryClient.invalidateQueries({ queryKey: ['stage', roomId] });
          fetchPresence();
          break;
        default:
          queryClient.invalidateQueries({ queryKey: ['room-overview', roomId] });
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

    // Soft accent fade clears after 1.2s
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

      const isMe = actorId && currentUserId && String(actorId) === String(currentUserId);

      // Flash highlight if changed by someone else
      if (entityId && !isMe) {
        registerFlashChange(String(entityId), actorName || 'Teammate', topic || 'room');
      }

      // Small notable toasts from others (max 1 per 3 seconds)
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

      // 250ms debounced invalidation with burst merge
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
      const url = `${baseUrl}/api/v1/rooms/${roomId}/events`;

      try {
        const es = new EventSource(url, { withCredentials: true });
        eventSourceRef.current = es;

        es.onopen = () => {
          if (isUnmounted) return;
          setStatus('live');
          reconnectAttempts.current = 0;
          stopPolling();
          fetchPresence();
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

        es.onerror = () => {
          if (isUnmounted) return;
          es.close();
          eventSourceRef.current = null;

          reconnectAttempts.current += 1;
          if (reconnectAttempts.current >= 3) {
            startFallbackPolling();
          } else {
            setStatus('reconnecting');
          }

          // Backoff: 1s, 2s, 4s up to 30s
          const delay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts.current - 1));
          reconnectTimerRef.current = window.setTimeout(() => {
            if (!isUnmounted) connectSSE();
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
        // Close after 2 minutes with tab hidden
        hiddenTimerRef.current = window.setTimeout(() => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setStatus('offline');
          }
        }, 120_000);
      } else {
        // Tab focused / visible again
        if (hiddenTimerRef.current !== null) {
          clearTimeout(hiddenTimerRef.current);
          hiddenTimerRef.current = null;
        }
        if (!eventSourceRef.current) {
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
    if (!roomId) return;
    const ping = () => {
      if (document.visibilityState === 'visible') {
        apiFetch(`/api/v1/rooms/${roomId}/presence`).catch(() => {});
      }
    };
    ping();
    const interval = setInterval(ping, 30_000);
    return () => clearInterval(interval);
  }, [roomId]);
}
