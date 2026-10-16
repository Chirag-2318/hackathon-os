import { apiFetch } from '@/api/client';
import type {
  FullPortfolioResponse,
  PortfolioSettingsDto,
  UpdateSettingsRequest,
  UpdateProjectCurationRequest,
} from '@/features/portfolio/types';

export const portfolioService = {
  fetchMyPortfolio: (): Promise<FullPortfolioResponse> => {
    return apiFetch<FullPortfolioResponse>('/api/v1/portfolio/me');
  },

  fetchPublicPortfolio: (username: string): Promise<FullPortfolioResponse> => {
    return apiFetch<FullPortfolioResponse>(`/api/v1/portfolio/u/${encodeURIComponent(username)}`);
  },

  updatePortfolioSettings: (req: UpdateSettingsRequest): Promise<PortfolioSettingsDto> => {
    return apiFetch<PortfolioSettingsDto>('/api/v1/portfolio/settings', {
      method: 'PUT',
      body: JSON.stringify(req),
    });
  },

  updateProjectCuration: (roomId: string, req: UpdateProjectCurationRequest): Promise<void> => {
    return apiFetch<void>(`/api/v1/portfolio/projects/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
  },
};
