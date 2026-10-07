/**
 * S24 Retro & Portfolio — API client stubs
 * PRD 5b §6.2. Stand-in pending generated client (OQ-21).
 *
 * All network access for the retro feature is in this file.
 */
import type { RetroResponse, RetroSavePayload } from './types';

const API_BASE = '/api/v1';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function fetchRetro(roomId: string): Promise<RetroResponse> {
  return apiFetch<RetroResponse>(`/rooms/${encodeURIComponent(roomId)}/retro`);
}

export function saveRetro(
  roomId: string,
  payload: RetroSavePayload,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    `/rooms/${encodeURIComponent(roomId)}/retro`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}
