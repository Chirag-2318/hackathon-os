/**
 * S23 Readiness — API client stubs
 * PRD 5b §6.1. Stand-in pending generated client (OQ-21).
 *
 * All network access for the readiness feature is in this file.
 * Swap these stubs for the generated client once the OpenAPI spec ships.
 */
import type { ReadinessResponse, ValidateResult } from './types';
import { apiFetch } from '@/api/client';

export function fetchReadiness(roomId: string): Promise<ReadinessResponse> {
  return apiFetch<ReadinessResponse>(`/api/v1/rooms/${encodeURIComponent(roomId)}/readiness`);
}

export function validateSimulatorAnswer(
  roomId: string,
  answer: string,
): Promise<ValidateResult> {
  return apiFetch<ValidateResult>(
    `/api/v1/rooms/${encodeURIComponent(roomId)}/readiness/simulate/validate`,
    {
      method: 'POST',
      body: JSON.stringify({ answer }),
    },
  );
}
