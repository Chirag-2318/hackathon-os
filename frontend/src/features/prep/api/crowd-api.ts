/**
 * Crowd Check API client — S26
 * PRD 6a §4.2
 */
import type { CrowdCheckResponse, CrowdRow } from './types';
import { apiFetch } from '@/api/client';

export async function fetchCrowdCheck(roomId: string): Promise<CrowdCheckResponse> {
  return apiFetch<CrowdCheckResponse>(`/api/v1/rooms/${roomId}/crowd-check`);
}

export async function addCrowdRow(roomId: string): Promise<CrowdRow> {
  return apiFetch<CrowdRow>(`/api/v1/rooms/${roomId}/crowd-check/rows`, {
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
}

export async function updateCrowdRow(
  roomId: string,
  rowId: string,
  patch: Partial<Pick<CrowdRow, 'option' | 'likelyCompetingIdeas' | 'collegeOverlap' | 'crowdedness' | 'notes'>>,
): Promise<CrowdRow> {
  return apiFetch<CrowdRow>(`/api/v1/rooms/${roomId}/crowd-check/rows/${rowId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export async function deleteCrowdRow(roomId: string, rowId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/rooms/${roomId}/crowd-check/rows/${rowId}`, {
    method: 'DELETE',
  });
}
