import { useQuery } from '@tanstack/react-query';
import { fetchBrief } from '@/api/client';

export function useBrief(roomId: string) {
  return useQuery({
    queryKey: ['brief', roomId],
    queryFn: () => fetchBrief(roomId),
  });
}
