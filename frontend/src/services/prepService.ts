/**
 * prepService.ts — Pre-hackathon checklist items.
 */
import { apiFetch } from '@/api/client';
import type { PrepItem } from './types';
import {
  getPrepItems, setPrepItems,
  mockDelay, genId,
} from './mockStore';
import { USE_MOCKS } from './roomService';

export const prepService = {
  async getPrepItems(roomId: string): Promise<PrepItem[]> {
    if (USE_MOCKS) {
      await mockDelay(100, 250);
      return getPrepItems(roomId);
    }
    return apiFetch<any[]>(`/api/v1/rooms/${roomId}/prep`);
  },

  async togglePrepItem(roomId: string, itemId: string): Promise<PrepItem> {
    if (USE_MOCKS) {
      await mockDelay(100, 200);
      const items = getPrepItems(roomId);
      const idx = items.findIndex(i => i.id === itemId);
      if (idx < 0) throw new Error('Prep item not found');
      items[idx] = { ...items[idx], done: !items[idx].done };
      setPrepItems(roomId, items);
      return items[idx];
    }
    return apiFetch<any>(`/api/v1/rooms/${roomId}/prep/${itemId}/toggle`, { method: 'POST' });
  },

  async addPrepItem(roomId: string, title: string, category = 'General'): Promise<PrepItem> {
    if (USE_MOCKS) {
      await mockDelay(100, 200);
      const items = getPrepItems(roomId);
      const item: PrepItem = {
        id: genId('prep'),
        roomId,
        title,
        done: false,
        category,
      };
      items.push(item);
      setPrepItems(roomId, items);
      return item;
    }
    return apiFetch<any>(`/api/v1/rooms/${roomId}/prep`, {
      method: 'POST',
      body: JSON.stringify({ title, category }),
    });
  },
};
