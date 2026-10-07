/**
 * useReadiness — TanStack Query hook for S23 data.
 * PRD 5b §3.1.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchReadiness } from '../api/readiness-api';

export function useReadiness(roomId: string) {
  return useQuery({
    queryKey: ['readiness', roomId],
    queryFn: () => fetchReadiness(roomId),
    staleTime: 2 * 60 * 1000,
  });
}
