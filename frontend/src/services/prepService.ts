/**
 * prepService.ts — Pre-hackathon checklist items calling backend API directly.
 */
import { apiFetch } from '@/api/client';
import type { PrepItem } from './types';

export const prepService = {
  async getPrepItems(roomId: string): Promise<PrepItem[]> {
    return apiFetch<PrepItem[]>(`/api/v1/rooms/${roomId}/prep`);
  },

  async togglePrepItem(roomId: string, itemId: string): Promise<PrepItem> {
    return apiFetch<PrepItem>(`/api/v1/rooms/${roomId}/prep/${itemId}/toggle`, { method: 'POST' });
  },

  async addPrepItem(roomId: string, title: string, category = 'General'): Promise<PrepItem> {
    return apiFetch<PrepItem>(`/api/v1/rooms/${roomId}/prep`, {
      method: 'POST',
      body: JSON.stringify({ title, category }),
    });
  },
};
