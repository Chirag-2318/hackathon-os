/**
 * useRetro — TanStack Query hook for S24 data.
 * PRD 5b §3.2.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRetro, saveRetro } from '../api/retro-api';
import type { RetroSavePayload } from '../api/types';

export function useRetro(roomId: string) {
  return useQuery({
    queryKey: ['retro', roomId],
    queryFn: () => fetchRetro(roomId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useSaveRetro(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RetroSavePayload) => saveRetro(roomId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retro', roomId] });
    },
  });
}
