/**
 * crowdService.ts — Crowd check matrix data service calling backend API directly.
 */
import { apiFetch } from '@/api/client';
import type { CrowdRow } from './types';

export const crowdService = {
  async getCrowdRows(roomId: string): Promise<CrowdRow[]> {
    return apiFetch<CrowdRow[]>(`/api/v1/rooms/${roomId}/crowd-check`);
  },

  async saveCrowdRows(roomId: string, rows: CrowdRow[]): Promise<CrowdRow[]> {
    return apiFetch<CrowdRow[]>(`/api/v1/rooms/${roomId}/crowd-check`, {
      method: 'PUT',
      body: JSON.stringify(rows),
    });
  },

  async prefillFromApprovedIdeas(roomId: string): Promise<CrowdRow[]> {
    return apiFetch<CrowdRow[]>(`/api/v1/rooms/${roomId}/crowd-check/prefill`, { method: 'POST' });
  },

  async addRow(roomId: string): Promise<CrowdRow> {
    return apiFetch<CrowdRow>(`/api/v1/rooms/${roomId}/crowd-check/rows`, {
      method: 'POST',
      body: JSON.stringify({
        option: '',
        likelyCompetingIdeas: '',
        collegeOverlap: null,
        crowdedness: null,
        notes: '',
      }),
    });
  },

  async updateRow(roomId: string, rowId: string, patch: Partial<CrowdRow>): Promise<CrowdRow> {
    return apiFetch<CrowdRow>(`/api/v1/rooms/${roomId}/crowd-check/rows/${rowId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  async deleteRow(roomId: string, rowId: string): Promise<void> {
    await apiFetch(`/api/v1/rooms/${roomId}/crowd-check/rows/${rowId}`, { method: 'DELETE' });
  },

  async continueToPlan(roomId: string): Promise<void> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/crowd-check/continue`, { method: 'POST' });
  },

  async skipToPlan(roomId: string): Promise<void> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/crowd-check/skip`, { method: 'POST' });
  },
};
