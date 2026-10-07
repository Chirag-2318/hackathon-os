import { apiFetch } from '../../api/client';

export interface CurrentUserDto {
  id: number;
  displayName: string;
  email: string;
  avatarUrl: string;
}

export const authApi = {
  me: () => apiFetch<CurrentUserDto>('/api/v1/me'),
  logout: () => apiFetch<void>('/api/v1/logout', { method: 'POST' }),
  githubLoginUrl: 'http://localhost:8080/oauth2/authorization/github',
  googleLoginUrl: 'http://localhost:8080/oauth2/authorization/google',
};
