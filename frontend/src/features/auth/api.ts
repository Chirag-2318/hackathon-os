import { apiFetch } from '../../api/client';

export interface CurrentUserDto {
  id: string;
  name: string;
  displayName: string;
  firstName?: string;
  initials?: string;
  email: string;
  avatarUrl?: string;
  provider?: string;
  timezone?: string;
  theme?: string;
  plan?: string;
  unreadNotifications?: number;
  username?: string;
  avatarType?: 'PRESET' | 'CUSTOM';
  avatarPreset?: number;
  roleTags?: string[];
  experienceLevel?: 'FIRST' | 'LOW' | 'MID' | 'HIGH';
  goal?: 'WIN' | 'LEARN' | 'PORTFOLIO' | 'ALL';
  techStack?: string[];
  onboardingCompleted?: boolean;
  onboardedAt?: string;
  tourStatus?: 'NOT_STARTED' | 'SKIPPED' | 'COMPLETED';
  tourPath?: 'LEADER' | 'MEMBER' | null;
  tourVersion?: number;
  tourCompletedAt?: string | null;
  hotspotsSeen?: string[];
  preferences?: {
    theme?: string;
    textSize?: string;
    motion?: string;
    sidebarDefault?: string;
    timeFormat?: string;
    timezone?: string | null;
    updatedAt?: string;
  };
  aiKey?: {
    hasKey: boolean;
    status?: 'UNVERIFIED' | 'VALID' | 'INVALID' | 'RATE_LIMITED' | string | null;
    last4?: string | null;
  };
  isAdmin?: boolean;
}


import { API_BASE_URL } from '@/lib/apiClient';

export const authApi = {
  me: () => apiFetch<CurrentUserDto>('/api/v1/me'),
  logout: () => apiFetch<void>('/api/v1/logout', { method: 'POST' }),
  githubLoginUrl: `${API_BASE_URL}/oauth2/authorization/github`,
  googleLoginUrl: `${API_BASE_URL}/oauth2/authorization/google`,
};
