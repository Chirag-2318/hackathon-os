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
}

export const authApi = {
  me: () => apiFetch<CurrentUserDto>('/api/v1/me'),
  logout: () => apiFetch<void>('/api/v1/logout', { method: 'POST' }),
  githubLoginUrl: 'http://localhost:8080/oauth2/authorization/github',
  googleLoginUrl: 'http://localhost:8080/oauth2/authorization/google',
};
