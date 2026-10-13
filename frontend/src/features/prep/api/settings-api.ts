/**
 * Settings API client — S28
 * PRD 6a §4.4
 */
import { apiClient } from '@/lib/apiClient';
import type { SettingsResponse } from './types';

export async function fetchSettings(): Promise<SettingsResponse> {
  return apiClient<SettingsResponse>('/api/v1/users/me/settings');
}

export async function patchSettings(patch: Partial<SettingsResponse>): Promise<SettingsResponse> {
  return apiClient<SettingsResponse>('/api/v1/users/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function requestExport(): Promise<{ downloadUrl: string }> {
  return apiClient<{ downloadUrl: string }>('/api/v1/users/me/export', { method: 'POST' });
}

export async function deleteAccount(): Promise<void> {
  return apiClient<void>('/api/v1/users/me', { method: 'DELETE' });
}
