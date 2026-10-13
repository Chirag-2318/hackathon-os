/**
 * Notifications — User-wide and room-scoped API queries
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
import type { NotificationsResponse, Notification } from './types';

// ── User-wide endpoints (used by notification bell and global components) ───────

export async function fetchUserNotifications(unreadOnly = false): Promise<Notification[]> {
  const query = unreadOnly ? '?unreadOnly=true' : '';
  const res = await apiFetch<any>(`/api/v1/notifications${query}`);
  const list = Array.isArray(res) ? res : (res?.items || []);
  return list.map((item: any) => ({
    id: item.id,
    type: item.type ?? 'system',
    title: item.title,
    body: item.body ?? item.message ?? '',
    timestamp: item.createdAt || new Date().toISOString(),
    read: Boolean(item.read),
    link: item.link ?? item.linkPath,
    deepLink: item.deepLink ?? item.linkPath ?? item.link,
    roomId: item.roomId,
    roomName: item.roomName,
    count: item.count ?? 1,
    actorUsername: item.actorUsername ?? (item.metadata?.actorUsername),
    actorName: item.actorName ?? (item.metadata?.actorName),
  }));
}

export async function fetchUserNotificationsPage(unreadOnly = false, cursor?: string, limit = 20): Promise<{ items: Notification[]; nextCursor?: string }> {
  const params = new URLSearchParams();
  if (unreadOnly) params.set('unreadOnly', 'true');
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  const res = await apiFetch<any>(`/api/v1/notifications?${params.toString()}`);
  const rawItems = Array.isArray(res) ? res : (res?.items || []);
  const items = rawItems.map((item: any) => ({
    id: item.id,
    type: item.type ?? 'system',
    title: item.title,
    body: item.body ?? item.message ?? '',
    timestamp: item.createdAt || new Date().toISOString(),
    read: Boolean(item.read),
    link: item.link ?? item.linkPath,
    deepLink: item.deepLink ?? item.linkPath ?? item.link,
    roomId: item.roomId,
    roomName: item.roomName,
    count: item.count ?? 1,
    actorUsername: item.actorUsername ?? (item.metadata?.actorUsername),
    actorName: item.actorName ?? (item.metadata?.actorName),
  }));
  return { items, nextCursor: res?.nextCursor };
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await apiFetch<{ count: number }>('/api/v1/notifications/unread-count');
  return res.count ?? 0;
}

export async function markAllUserNotificationsRead(): Promise<void> {
  return apiFetch<void>('/api/v1/notifications/mark-all-read', { method: 'POST' });
}

export async function markNotificationRead(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
}

export function useUserNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: ['notifications', 'user-wide', { unreadOnly }],
    queryFn: () => fetchUserNotifications(unreadOnly),
    refetchInterval: 30000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 20000,
  });
}

export function useMarkAllUserNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllUserNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
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
