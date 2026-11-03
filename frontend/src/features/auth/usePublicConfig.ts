import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/design/api';

export interface PublicConfigDto {
  supportEmail?: string;
  publicUrl?: string;
  userCap?: number;
  [key: string]: any;
}

export function usePublicConfig() {
  return useQuery<PublicConfigDto>({
    queryKey: ['public-config'],
    queryFn: () => apiFetch<PublicConfigDto>('/api/v1/public/config').catch(() => ({})),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

