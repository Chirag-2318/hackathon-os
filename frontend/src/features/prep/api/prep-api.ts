/**
 * Prep API client — S25
 * PRD 6a §4.1
 */
import type { PrepResponse } from './types';

export async function fetchPrep(roomId: string): Promise<PrepResponse> {
  const res = await fetch(`/api/v1/rooms/${roomId}/prep`);
  if (!res.ok) throw new Error(`fetchPrep: ${res.status}`);
  return res.json() as Promise<PrepResponse>;
}

export async function toggleChecklistItem(
  roomId: string,
  itemId: string,
  done: boolean,
): Promise<{ id: string; done: boolean }> {
  const res = await fetch(`/api/v1/rooms/${roomId}/prep/checklist/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done }),
  });
  if (!res.ok) throw new Error(`toggleChecklistItem: ${res.status}`);
  return res.json() as Promise<{ id: string; done: boolean }>;
}
