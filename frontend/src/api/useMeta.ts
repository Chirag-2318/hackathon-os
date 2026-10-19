import { useQuery } from '@tanstack/react-query';
import { fetchMeta, invalidateMetaCache, type MetaResponse } from './meta';

export function useMeta() {
  return useQuery<MetaResponse>({
    queryKey: ['meta'],
    queryFn: () => {
      invalidateMetaCache();
      return fetchMeta();
    },
    staleTime: 5 * 60 * 1000,
  });
}
