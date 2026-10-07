/**
 * S29 Notifications — API query hook
 * Source: PRD Phase 6b §3.1, tech_stack.md §4.1
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationsResponse } from './types';

const BASE = '/api/v1/rooms';

async function fetchNotifications(roomId: string): Promise<NotificationsResponse> {
  const res = await fetch(`${BASE}/${roomId}/notifications`);
  if (!res.ok) throw new Error('Failed to load notifications');
  return res.json() as Promise<NotificationsResponse>;
}

async function markRead(roomId: string, notifId: string): Promise<void> {
  await fetch(`${BASE}/${roomId}/notifications/${notifId}/read`, { method: 'PATCH' });
}

export function useNotifications(roomId: string) {
  return useQuery({
    queryKey: ['notifications', roomId],
    queryFn: () => fetchNotifications(roomId),
  });
}

export function useMarkRead(roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notifId: string) => markRead(roomId, notifId),
    onSuccess: (_data, notifId) => {
      qc.setQueryData<NotificationsResponse>(['notifications', roomId], (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map(n =>
            n.id === notifId ? { ...n, read: true } : n
          ),
        };
      });
    },
  });
}
