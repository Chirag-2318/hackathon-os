/**
 * S23 Readiness — API client stubs
 * PRD 5b §6.1. Stand-in pending generated client (OQ-21).
 *
 * All network access for the readiness feature is in this file.
 * Swap these stubs for the generated client once the OpenAPI spec ships.
 */
import type { ReadinessResponse, ValidateResult } from './types';

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

export function fetchReadiness(roomId: string): Promise<ReadinessResponse> {
  return apiFetch<ReadinessResponse>(`/rooms/${encodeURIComponent(roomId)}/readiness`);
}

export function validateSimulatorAnswer(
  roomId: string,
  answer: string,
): Promise<ValidateResult> {
  return apiFetch<ValidateResult>(
    `/rooms/${encodeURIComponent(roomId)}/readiness/simulate/validate`,
    {
      method: 'POST',
      body: JSON.stringify({ answer }),
    },
  );
}
