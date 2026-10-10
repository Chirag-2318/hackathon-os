/**
 * crowdService.ts — Crowd check matrix data service.
 */
import { apiFetch } from '@/api/client';
import type { CrowdRow } from './types';
import {
  getCrowdRows, setCrowdRows, getIdeas, getRoom, setRoom,
  mockDelay, genId,
} from './mockStore';
import { USE_MOCKS } from './roomService';

export const crowdService = {
  async getCrowdRows(roomId: string): Promise<CrowdRow[]> {
    if (USE_MOCKS) {
      await mockDelay(100, 300);
      return getCrowdRows(roomId);
    }
    return apiFetch<any[]>(`/api/v1/rooms/${roomId}/crowd-check`);
  },

  async saveCrowdRows(roomId: string, rows: CrowdRow[]): Promise<CrowdRow[]> {
    if (USE_MOCKS) {
      await mockDelay(150, 300);
      setCrowdRows(roomId, rows);
      return rows;
    }
    return apiFetch<any>(`/api/v1/rooms/${roomId}/crowd-check`, {
      method: 'PUT',
      body: JSON.stringify(rows),
    });
  },

  async prefillFromApprovedIdeas(roomId: string): Promise<CrowdRow[]> {
    if (USE_MOCKS) {
      const existing = getCrowdRows(roomId);
      const ideas = getIdeas(roomId).filter(i => i.status === 'approved');

      // Do not duplicate rows if already present
      const existingIdeaIds = new Set(existing.map(r => r.ideaId));
      const newRows: CrowdRow[] = [...existing];

      for (const idea of ideas) {
        if (!existingIdeaIds.has(idea.id)) {
          newRows.push({
            id: genId('crowd'),
            ideaId: idea.id,
            option: idea.identity || idea.problem || 'Untitled Idea',
            likelyCompetingIdeas: `Generic tooling or chatbot for ${idea.who || 'users'}`,
            collegeOverlap: 2,
            crowdedness: 'MEDIUM',
            notes: `Differentiated by ${idea.wow || 'our core flow'}.`,
            title: idea.identity || idea.problem || 'Untitled Idea',
            competitors: [
              { name: 'Standard SaaS / Spreadsheet' },
              { name: 'Manual WhatsApp / Discord workflow' },
            ],
          });
        }
      }

      setCrowdRows(roomId, newRows);
      return newRows;
    }
    return apiFetch<any[]>(`/api/v1/rooms/${roomId}/crowd-check/prefill`, { method: 'POST' });
  },

  async addRow(roomId: string): Promise<CrowdRow> {
    if (USE_MOCKS) {
      await mockDelay(100, 200);
      const rows = getCrowdRows(roomId);
      const newRow: CrowdRow = {
        id: genId('crowd'),
        option: '',
        likelyCompetingIdeas: '',
        collegeOverlap: null,
        crowdedness: null,
        notes: '',
      };
      rows.push(newRow);
      setCrowdRows(roomId, rows);
      return newRow;
    }
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
    if (USE_MOCKS) {
      const rows = getCrowdRows(roomId);
      const idx = rows.findIndex(r => r.id === rowId);
      if (idx >= 0) {
        rows[idx] = { ...rows[idx], ...patch };
        setCrowdRows(roomId, rows);
        return rows[idx];
      }
      throw new Error('Row not found');
    }
    return apiFetch<CrowdRow>(`/api/v1/rooms/${roomId}/crowd-check/rows/${rowId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  async deleteRow(roomId: string, rowId: string): Promise<void> {
    if (USE_MOCKS) {
      const rows = getCrowdRows(roomId).filter(r => r.id !== rowId);
      setCrowdRows(roomId, rows);
      return;
    }
    await apiFetch(`/api/v1/rooms/${roomId}/crowd-check/rows/${rowId}`, { method: 'DELETE' });
  },

  async continueToPlan(roomId: string): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(100, 250);
      const room = getRoom(roomId);
      if (room) {
        room.stageDone.crowd = true;
        if (room.stage === 'crowd') {
          room.stage = 'plan';
        }
        setRoom(room);
      }
      return;
    }
    return apiFetch<any>(`/api/v1/rooms/${roomId}/crowd-check/continue`, { method: 'POST' });
  },

  async skipToPlan(roomId: string): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(100, 200);
      const room = getRoom(roomId);
      if (room) {
        room.stageDone.crowd = true;
        if (room.stage === 'crowd') {
          room.stage = 'plan';
        }
        setRoom(room);
      }
      return;
    }
    return apiFetch<any>(`/api/v1/rooms/${roomId}/crowd-check/skip`, { method: 'POST' });
  },
};
