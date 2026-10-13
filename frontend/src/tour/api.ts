import { apiFetch } from '@/api/client';
import type { CurrentUserDto } from '@/features/auth/api';
import type { TourPath } from './types';

export const CURRENT_TOUR_VERSION = 1;

export interface TourUpdatePayload {
  status: 'SKIPPED' | 'COMPLETED';
  path?: TourPath;
  version: number;
}

export interface HotspotPayload {
  key: string;
}

export async function persistTourStatus(
  status: 'SKIPPED' | 'COMPLETED',
  path?: TourPath,
  version: number = CURRENT_TOUR_VERSION
): Promise<CurrentUserDto | null> {
  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiFetch<CurrentUserDto>('/api/v1/users/me/tour', {
        method: 'POST',
        body: JSON.stringify({ status, path, version }),
      });
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }
  }

  console.warn('[Tour] Tour status update failed after 3 attempts:', lastError);
  return null;
}

export async function recordTourHotspot(key: string): Promise<CurrentUserDto | null> {
  try {
    return await apiFetch<CurrentUserDto>('/api/v1/users/me/hotspots', {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  } catch (error) {
    console.warn('[Tour] Hotspot record non-fatal error:', error);
    return null;
  }
}

export async function resetTourHotspots(): Promise<CurrentUserDto | null> {
  try {
    return await apiFetch<CurrentUserDto>('/api/v1/users/me/hotspots/reset', {
      method: 'POST',
    });
  } catch (error) {
    console.warn('[Tour] Reset hotspots error:', error);
    return null;
  }
}
