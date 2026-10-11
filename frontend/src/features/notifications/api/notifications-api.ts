/**
 * Notifications — User-wide and room-scoped API queries
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import type { NotificationsResponse, Notification } from './types';

// ── User-wide endpoints (used by notification bell and global components) ───────

export async function fetchUserNotifications(): Promise<Notification[]> {
  const list = await apiFetch<any[]>('/api/v1/notifications');
  if (!Array.isArray(list)) return [];
  return list.map((item) => ({
    id: item.id,
    type: item.type ?? 'system',
    title: item.title,
    body: item.body ?? item.message ?? '',
    timestamp: item.createdAt,
    read: Boolean(item.read),
    link: item.link ?? item.linkPath,
    roomId: item.roomId,
    roomName: item.roomName,
  }));
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiFetch<{ count: number }>('/api/v1/notifications/unread-count');
  return res.count ?? 0;
}

export async function markAllUserNotificationsRead(): Promise<void> {
  return apiFetch<void>('/api/v1/notifications/mark-all-read', { method: 'POST' });
}

export function useUserNotifications() {
  return useQuery({
    queryKey: ['notifications', 'user-wide'],
    queryFn: fetchUserNotifications,
    refetchInterval: 60000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000,
  });
}

export function useMarkAllUserNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllUserNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'user-wide'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

// ── Room-scoped endpoints (only for pages with a real roomId) ───────────────────

const BASE = '/api/v1/rooms';

export async function fetchNotifications(roomId: string): Promise<NotificationsResponse> {
  if (!roomId) {
    return { notifications: [], lastSyncedAt: new Date().toISOString() };
  }
  return apiFetch<NotificationsResponse>(`${BASE}/${roomId}/notifications`);
}

export async function markRead(roomId: string, notifId: string): Promise<void> {
  if (!roomId) return;
  return apiFetch<void>(`${BASE}/${roomId}/notifications/${notifId}/read`, { method: 'PATCH' });
}

export async function markAllRead(roomId: string): Promise<void> {
  if (!roomId) return;
  return apiFetch<void>(`${BASE}/${roomId}/notifications/mark-all-read`, { method: 'POST' });
}

export function useNotifications(roomId: string) {
  return useQuery({
    queryKey: ['notifications', roomId],
    queryFn: () => fetchNotifications(roomId),
    enabled: Boolean(roomId),
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
          notifications: old.notifications.map((n) =>
            n.id === notifId ? { ...n, read: true } : n
          ),
        };
      });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}
