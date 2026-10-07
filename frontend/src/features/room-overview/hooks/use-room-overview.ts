import { useQuery } from '@tanstack/react-query';
import { fetchRoomOverview } from '@/api/client';

export function useRoomOverview(roomId: string) {
  return useQuery({
    queryKey: ['room-overview', roomId],
    queryFn: () => fetchRoomOverview(roomId),
    enabled: !!roomId,
  });
}
