/**
 * S29 Notifications — API query hook
 * Source: PRD Phase 6b §3.1, tech_stack.md §4.1
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import type { NotificationsResponse } from './types';

import { USE_MOCKS } from '@/services/roomService';
import { getNotifications, markNotifRead } from '@/services/mockStore';

const BASE = '/api/v1/rooms';

export async function fetchNotifications(roomId: string): Promise<NotificationsResponse> {
  if (USE_MOCKS) {
    const stored = getNotifications();
    const mapped: Notification[] = stored.map(s => ({
      id: s.id,
      avatarInitials: 'OS',
      title: s.message,
      body: s.message,
      timestamp: s.createdAt,
      read: s.read,
      type: 'system',
    }));
    return {
      notifications: mapped,
      lastSyncedAt: new Date().toISOString(),
    };
  }
  return apiFetch<NotificationsResponse>(`${BASE}/${roomId}/notifications`);
}

export async function markRead(roomId: string, notifId: string): Promise<void> {
  if (USE_MOCKS) {
    markNotifRead(notifId);
    return;
  }
  return apiFetch<void>(`${BASE}/${roomId}/notifications/${notifId}/read`, { method: 'PATCH' });
}

export async function markAllRead(roomId: string): Promise<void> {
  if (USE_MOCKS) {
    const stored = getNotifications();
    stored.forEach(s => markNotifRead(s.id));
    return;
  }
  return apiFetch<void>(`${BASE}/${roomId}/notifications/mark-all-read`, { method: 'POST' });
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
