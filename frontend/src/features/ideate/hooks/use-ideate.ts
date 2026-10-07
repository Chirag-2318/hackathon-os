import { useQuery } from '@tanstack/react-query';
import { fetchIdeate } from '@/api/client';

export function useIdeate(roomId: string) {
  return useQuery({
    queryKey: ['ideate', roomId],
    queryFn: () => fetchIdeate(roomId),
  });
}
