/**
 * Settings API client — S28
 * PRD 6a §4.4
 */
import type { SettingsResponse } from './types';

export async function fetchSettings(): Promise<SettingsResponse> {
  const res = await fetch('/api/v1/users/me/settings');
  if (!res.ok) throw new Error(`fetchSettings: ${res.status}`);
  return res.json() as Promise<SettingsResponse>;
}

export async function patchSettings(patch: Partial<SettingsResponse>): Promise<SettingsResponse> {
  const res = await fetch('/api/v1/users/me/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`patchSettings: ${res.status}`);
  return res.json() as Promise<SettingsResponse>;
}

export async function requestExport(): Promise<{ downloadUrl: string }> {
  const res = await fetch('/api/v1/users/me/export', { method: 'POST' });
  if (!res.ok) throw new Error(`requestExport: ${res.status}`);
  return res.json() as Promise<{ downloadUrl: string }>;
}

export async function deleteAccount(): Promise<void> {
  const res = await fetch('/api/v1/users/me', { method: 'DELETE' });
  if (!res.ok) throw new Error(`deleteAccount: ${res.status}`);
}
