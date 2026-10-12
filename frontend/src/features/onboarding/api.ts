import { apiClient } from '@/lib/apiClient';
import type { CurrentUserDto } from '@/features/auth/api';

export interface UsernameAvailabilityResult {
  available: boolean;
  reason?: string;
}

export interface OnboardingPayload {
  username: string;
  avatarType: 'PRESET' | 'CUSTOM';
  avatarPreset?: number;
  avatarUrl?: string;
  roleTags: string[];
  experienceLevel?: 'FIRST' | 'LOW' | 'MID' | 'HIGH';
  goal?: 'WIN' | 'LEARN' | 'PORTFOLIO' | 'ALL';
  techStack: string[];
}

export const onboardingApi = {
  checkUsernameAvailable: (username: string) =>
    apiClient<UsernameAvailabilityResult>(
      `/api/v1/users/username-available?username=${encodeURIComponent(username)}`
    ),

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient<{ avatarUrl: string }>('/api/v1/users/me/avatar', {
      method: 'POST',
      body: formData,
    });
  },

  submitOnboarding: (data: OnboardingPayload) =>
    apiClient<CurrentUserDto>('/api/v1/users/me/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
