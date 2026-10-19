import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api';
import { toast } from './components/toast';

/**
 * Standard query keys for [brackit] data layer
 */
export const queryKeys = {
  home: ['home'] as const,
  aiStatus: ['ai', 'status'] as const,
  rooms: {
    all: ['rooms'] as const,
    detail: (roomId: string) => ['rooms', roomId] as const,
    overview: (roomId: string) => ['rooms', roomId, 'overview'] as const,
    board: (roomId: string) => ['rooms', roomId, 'board'] as const,
    tasks: (roomId: string) => ['rooms', roomId, 'tasks'] as const,
    plan: (roomId: string) => ['rooms', roomId, 'plan'] as const,
    docs: (roomId: string) => ['rooms', roomId, 'docs'] as const,
    team: (roomId: string) => ['rooms', roomId, 'team'] as const,
    presence: (roomId: string) => ['rooms', roomId, 'presence'] as const,
  },
};

/**
 * Room detail hook fetching room metadata, stage, and clock snapshot.
 */
export function useRoomQuery(roomId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.rooms.detail(roomId || ''),
    queryFn: () => apiFetch<any>(`/api/v1/rooms/${roomId}/overview`),
    enabled: Boolean(roomId),
    staleTime: 15_000, // 15 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Home summary hook fetching the /api/v1/home dashboard snapshot.
 */
export function useHomeQuery() {
  return useQuery({
    queryKey: queryKeys.home,
    queryFn: () => apiFetch<any>('/api/v1/home'),
    staleTime: 20_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Optimistic task move mutation helper.
 * Immediately updates the cache, rolling back on error and displaying a toast.
 */
export function useOptimisticTaskMove(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      return apiFetch(`/api/v1/rooms/${roomId}/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    },
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rooms.board(roomId) });
      const previousBoard = queryClient.getQueryData<any>(queryKeys.rooms.board(roomId));

      if (previousBoard?.tasks) {
        queryClient.setQueryData(queryKeys.rooms.board(roomId), {
          ...previousBoard,
          tasks: previousBoard.tasks.map((task: any) =>
            task.id === taskId ? { ...task, status: newStatus } : task
          ),
        });
      }

      return { previousBoard };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(queryKeys.rooms.board(roomId), context.previousBoard);
      }
      toast.error(err?.message || 'Failed to move task. Reverting change.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.board(roomId) });
    },
  });
}
