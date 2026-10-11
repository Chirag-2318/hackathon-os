import { useQuery } from '@tanstack/react-query';
import { fetchMeta, type MetaResponse } from './meta';

export function useMeta() {
  return useQuery<MetaResponse>({
    queryKey: ['meta'],
    queryFn: fetchMeta,
    staleTime: Infinity,
  });
}
