/**
 * notificationService.ts — App notifications service.
 */
import { apiFetch } from '@/api/client';
import type { Notification } from './types';
import {
  getNotifications, addNotification as storeAddNotif, markNotifRead,
  mockDelay, genId,
} from './mockStore';
import { USE_MOCKS } from './roomService';

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    if (USE_MOCKS) {
      await mockDelay(100, 200);
      return getNotifications();
    }
    return apiFetch<Notification[]>('/api/v1/notifications');
  },

  async markAsRead(id: string): Promise<void> {
    if (USE_MOCKS) {
      markNotifRead(id);
      return;
    }
    await apiFetch(`/api/v1/notifications/${id}/read`, { method: 'POST' });
  },

  async addNotification(n: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    if (USE_MOCKS) {
      const full: Notification = {
        id: genId('notif'),
        createdAt: new Date().toISOString(),
        read: false,
        ...n,
      };
      storeAddNotif(full);
      return full;
    }
    return apiFetch<Notification>('/api/v1/notifications', {
      method: 'POST',
      body: JSON.stringify(n),
    });
  },
};
