/**
 * Prep API client — S25
 * PRD 6a §4.1
 */
import { apiFetch } from '@/api/client';
import type { PrepResponse } from './types';

export async function fetchPrep(roomId: string): Promise<PrepResponse> {
  return apiFetch<PrepResponse>(`/api/v1/rooms/${roomId}/prep`);
}

export async function toggleChecklistItem(
  roomId: string,
  itemId: string,
  done: boolean,
): Promise<{ id: string; done: boolean }> {
  return apiFetch<{ id: string; done: boolean }>(`/api/v1/rooms/${roomId}/prep/checklist/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done }),
  });
}
