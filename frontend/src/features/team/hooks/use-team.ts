import { useQuery } from '@tanstack/react-query';
import { fetchTeam } from '@/api/client';

export function useTeam(roomId: string) {
  return useQuery({
    queryKey: ['team', roomId],
    queryFn: () => fetchTeam(roomId),
  });
}
