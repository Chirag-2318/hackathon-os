/**
 * Settings API client — S28
 * PRD 6a §4.4
 */
import { apiClient, API_BASE_URL } from '@/lib/apiClient';
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

export interface DataSummary {
  account: {
    email: string | null;
    signInProviders: string[];
    lastLoginAt: string | null;
  };
  profile: {
    username: string;
    displayName: string;
    avatar: string | null;
    roles: string[];
    experience: string | null;
    goal: string | null;
    stack: string[];
  };
  rooms: Array<{
    roomId: string;
    roomName: string;
    role: string;
  }>;
  content: {
    ideasCount: number;
    tasksCount: number;
    commentsCount: number;
    documentsEditedCount: number;
  };
  files: {
    count: number;
    totalSizeBytes: number;
    formattedTotalSize: string;
  };
  notifications: {
    count: number;
  };
  emailLog: {
    count: number;
  };
  integrations: {
    githubTokenStoredEncrypted: boolean;
  };
  preferences: UserPreferences;
  retention: {
    notificationsDays: number;
    emailLogDays: number;
    deletedRoomsDays: number;
  };
}

export async function fetchDataSummary(): Promise<DataSummary> {
  return apiClient<DataSummary>('/api/v1/users/me/data-summary');
}

export async function downloadUserDataExport(): Promise<void> {
  const baseUrl = API_BASE_URL;
  const res = await fetch(`${baseUrl}/api/v1/users/me/export`, {
    credentials: 'include',
  });
  if (!res.ok) {
    let body: any = {};
    try { body = await res.json(); } catch {}
    const retryAfter = res.headers.get('Retry-After');
    let msg = body?.message || 'Export failed';
    if (res.status === 429) {
      const waitHrs = retryAfter ? Math.max(1, Math.ceil(Number(retryAfter) / 3600)) : 24;
      msg = `Daily export limit reached (3 per day). Please retry in ${waitHrs} hour(s).`;
    }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match ? match[1] : 'brackit-export.zip';
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export interface DeletePreview {
  blockers: Array<{
    id: string;
    name: string;
    memberCount: number;
  }>;
  willDelete: Array<{
    id: string;
    name: string;
  }>;
  willAnonymise: {
    ideasCount: number;
    tasksCount: number;
    commentsCount: number;
  };
}

export async function fetchDeletePreview(): Promise<DeletePreview> {
  return apiClient<DeletePreview>('/api/v1/users/me/delete-preview');
}

export interface DeleteAccountPayload {
  confirmUsername: string;
  autoTransferLeadership?: boolean;
}

export async function deleteUserAccount(payload: DeleteAccountPayload): Promise<void> {
  return apiClient<void>('/api/v1/users/me', {
    method: 'DELETE',
    body: JSON.stringify(payload),
  });
}

// ── Billing ─────────────────────────────────────────────────────────

export interface PlanFeature {
  text: string;
  planned: boolean;
}

export interface PlanDefinition {
  id: string;
  name: string;
  price: number;
  roomsPerMonth: number | null;
  description: string;
  features: PlanFeature[];
}

export interface BillingSummary {
  plan: string;
  usage: {
    roomsThisMonth: number;
    limit: number | null;
    resetsAt: string;
  };
  plans: PlanDefinition[];
  enforce: boolean;
  paymentsEnabled: boolean;
  currency: string;
  waitlistedPlans: string[];
}

export async function fetchBillingSummary(): Promise<BillingSummary> {
  return apiClient<BillingSummary>('/api/v1/billing');
}

export async function recordPlanInterest(plan: string, note?: string): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>('/api/v1/billing/interest', {
    method: 'POST',
    body: JSON.stringify({ plan, note }),
  });
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  textSize: 'small' | 'default' | 'large';
  motion: 'system' | 'on' | 'off';
  sidebarDefault: 'expanded' | 'collapsed';
  timeFormat: '12h' | '24h';
  timezone: string | null;
  updatedAt?: string;
}

export async function fetchUserPreferences(): Promise<UserPreferences> {
  return apiClient<UserPreferences>('/api/v1/users/me/preferences');
}

export async function patchUserPreferences(patch: Partial<UserPreferences>): Promise<UserPreferences> {
  return apiClient<UserPreferences>('/api/v1/users/me/preferences', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

// ── Email Preferences (Notifications) ───────────────────────────────

export interface EmailPrefsResponse {
  paused: boolean;
  categories: Record<string, boolean>;
  maskedEmail: string;
  applicableCategories: string[];
}

export interface UpdateEmailPrefsRequest {
  paused?: boolean;
  categories?: Record<string, boolean>;
}

export interface TestEmailResponse {
  success: boolean;
  message: string;
}

export async function fetchEmailPrefs(): Promise<EmailPrefsResponse> {
  return apiClient<EmailPrefsResponse>('/api/v1/users/me/email-prefs');
}

export async function patchEmailPrefs(req: UpdateEmailPrefsRequest): Promise<EmailPrefsResponse> {
  return apiClient<EmailPrefsResponse>('/api/v1/users/me/email-prefs', {
    method: 'PATCH',
    body: JSON.stringify(req),
  });
}

export async function sendTestEmail(): Promise<TestEmailResponse> {
  return apiClient<TestEmailResponse>('/api/v1/users/me/email/test', {
    method: 'POST',
  });
}

// ── Integrations ────────────────────────────────────────────────────

export interface RoomRepoUsage {
  roomId: string;
  roomName: string;
  repoFullName: string;
}

export interface IntegrationProvider {
  provider: 'GITHUB' | 'GOOGLE';
  connected: boolean;
  login?: string;
  email?: string;
  avatarUrl?: string;
  connectedAt?: string;
  lastUsedAt?: string;
  scopes: string[];
  hasPrivateAccess: boolean;
  canDisconnect: boolean;
  status: 'CONNECTED' | 'NEEDS_RECONNECT';
  usedInRooms: RoomRepoUsage[];
}

export interface IntegrationsResponse {
  providers: IntegrationProvider[];
}

export async function fetchIntegrations(): Promise<IntegrationsResponse> {
  return apiClient<IntegrationsResponse>('/api/v1/users/me/integrations');
}

export async function authorizeGitHub(access: 'public' | 'private' = 'public'): Promise<{ authorizationUrl: string }> {
  return apiClient<{ authorizationUrl: string }>(`/api/v1/integrations/github/authorize?access=${access}`, {
    method: 'POST',
  });
}

export async function removeGitHubPrivateAccess(): Promise<void> {
  return apiClient<void>('/api/v1/integrations/github/private-access', {
    method: 'DELETE',
  });
}

export async function disconnectGitHub(): Promise<void> {
  return apiClient<void>('/api/v1/integrations/github', {
    method: 'DELETE',
  });
}

export async function checkGitHubConnection(): Promise<{ ok: boolean; status: string; login?: string; error?: string }> {
  return apiClient<{ ok: boolean; status: string; login?: string; error?: string }>('/api/v1/integrations/github/check', {
    method: 'POST',
  });
}

export interface ConnectGitHubTokenRequest {
  token?: string;
  username?: string;
  privateAccess?: boolean;
}

export async function connectGitHubWithToken(req: ConnectGitHubTokenRequest): Promise<IntegrationsResponse> {
  return apiClient<IntegrationsResponse>('/api/v1/integrations/github/token', {
    method: 'POST',
    body: JSON.stringify(req),
  });
}

// ── AI Status & BYOK ──────────────────────────────────────────────────

export interface DailyUsageDto {
  day: string;
  calls: number;
  failures: number;
}

export interface AiStatusResponse {
  keyConfigured: boolean;
  keyStatus: string; // VALID, INVALID, RATE_LIMITED, UNVERIFIED, NOT_CONFIGURED
  last4?: string | null;
  providerHost: string;
  defaultModel: string;
  fastModel: string;
  smartModel: string;
  jsonModeSupported?: boolean;
  lastCallOk?: boolean | null;
  usage: DailyUsageDto[];
}

export interface AiTestResponse {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

export interface UserAiKeyResponse {
  hasKey: boolean;
  last4?: string | null;
  status?: string | null;
  lastCheckedAt?: string | null;
  host: string;
}

export async function fetchUserAiKey(): Promise<UserAiKeyResponse> {
  return apiClient<UserAiKeyResponse>('/api/v1/users/me/ai-key');
}

export async function saveUserAiKey(key: string): Promise<UserAiKeyResponse> {
  return apiClient<UserAiKeyResponse>('/api/v1/users/me/ai-key', {
    method: 'PUT',
    body: JSON.stringify({ key }),
  });
}

export async function deleteUserAiKey(): Promise<void> {
  return apiClient<void>('/api/v1/users/me/ai-key', {
    method: 'DELETE',
  });
}

export async function testUserAiKey(): Promise<AiTestResponse> {
  return apiClient<AiTestResponse>('/api/v1/users/me/ai-key/test', {
    method: 'POST',
  });
}

export async function fetchAiStatus(): Promise<AiStatusResponse> {
  return apiClient<AiStatusResponse>('/api/v1/ai/status');
}

export async function testAiConnection(): Promise<AiTestResponse> {
  return apiClient<AiTestResponse>('/api/v1/users/me/ai-key/test', {
    method: 'POST',
  });
}


