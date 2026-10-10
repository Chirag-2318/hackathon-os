/**
 * Crowd Check API client — S26
 * PRD 6a §4.2
 */
import type { CrowdCheckResponse, CrowdRow } from './types';
import { crowdService } from '@/services/crowdService';
import { USE_MOCKS } from '@/services/roomService';

export async function fetchCrowdCheck(roomId: string): Promise<CrowdCheckResponse> {
  if (USE_MOCKS) {
    const rows = await crowdService.getCrowdRows(roomId);
    return { rows: rows as any };
  }
  const res = await fetch(`/api/v1/rooms/${roomId}/crowd-check`);
  if (!res.ok) throw new Error(`fetchCrowdCheck: ${res.status}`);
  return res.json() as Promise<CrowdCheckResponse>;
}

export async function addCrowdRow(roomId: string): Promise<CrowdRow> {
  if (USE_MOCKS) {
    const row = await crowdService.addRow(roomId);
    return row as any;
  }
  const res = await fetch(`/api/v1/rooms/${roomId}/crowd-check/rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      option: '',
      likelyCompetingIdeas: '',
      collegeOverlap: null,
      crowdedness: null,
      notes: '',
    }),
  });
  if (!res.ok) throw new Error(`addCrowdRow: ${res.status}`);
  return res.json() as Promise<CrowdRow>;
}

export async function updateCrowdRow(
  roomId: string,
  rowId: string,
  patch: Partial<Pick<CrowdRow, 'option' | 'likelyCompetingIdeas' | 'collegeOverlap' | 'crowdedness' | 'notes'>>,
): Promise<CrowdRow> {
  if (USE_MOCKS) {
    const updated = await crowdService.updateRow(roomId, rowId, patch as any);
    return updated as any;
  }
  const res = await fetch(`/api/v1/rooms/${roomId}/crowd-check/rows/${rowId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`updateCrowdRow: ${res.status}`);
  return res.json() as Promise<CrowdRow>;
}

export async function deleteCrowdRow(roomId: string, rowId: string): Promise<void> {
  if (USE_MOCKS) {
    await crowdService.deleteRow(roomId, rowId);
    return;
  }
  const res = await fetch(`/api/v1/rooms/${roomId}/crowd-check/rows/${rowId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`deleteCrowdRow: ${res.status}`);
}
