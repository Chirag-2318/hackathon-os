import { useQuery } from '@tanstack/react-query';
import { fetchHomeSummary } from '@/api/client';

export function useHome() {
  return useQuery({
    queryKey: ['home'],
    queryFn: fetchHomeSummary,
  });
}
