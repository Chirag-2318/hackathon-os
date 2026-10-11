/**
 * S24 Retro & Portfolio — API client stubs
 * PRD 5b §6.2. Stand-in pending generated client (OQ-21).
 *
 * All network access for the retro feature is in this file.
 */
import type { RetroResponse, RetroSavePayload } from './types';
import { apiFetch } from '@/api/client';

export function fetchRetro(roomId: string): Promise<RetroResponse> {
  return apiFetch<RetroResponse>(`/api/v1/rooms/${encodeURIComponent(roomId)}/retro`);
}

export function saveRetro(
  roomId: string,
  payload: RetroSavePayload,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    `/api/v1/rooms/${encodeURIComponent(roomId)}/retro`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}
