/**
 * notificationService.ts — App notifications service calling backend API directly.
 */
import { apiFetch } from '@/api/client';
import type { Notification } from './types';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    return apiFetch<Notification[]>('/api/v1/notifications');
  },

  async markAsRead(id: string): Promise<void> {
    await apiFetch(`/api/v1/notifications/${id}/read`, { method: 'POST' });
  },

  async addNotification(n: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    return apiFetch<Notification>('/api/v1/notifications', {
      method: 'POST',
      body: JSON.stringify(n),
    });
  },
};
