/**
 * prepService.ts — Pre-hackathon checklist items calling backend API directly.
 */
import { apiFetch } from '@/api/client';
import type { PrepItem } from './types';

export const prepService = {
  async getPrepItems(roomId: string): Promise<PrepItem[]> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/prep`);
    if (Array.isArray(res)) {
      return res;
    }
    if (res && Array.isArray(res.checklist)) {
      return res.checklist.map((item: any) => ({
        id: item.id,
        roomId,
        title: item.label || item.title || '',
        done: Boolean(item.done),
        dueDate: item.dueAt || item.dueDate,
        category: item.category || 'General',
      }));
    }
    return [];
  },

  async togglePrepItem(roomId: string, itemId: string, done?: boolean): Promise<any> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/prep/checklist/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
  },

  async addPrepItem(roomId: string, title: string, category = 'General'): Promise<any> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/prep`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: title }),
    });
  },
};
