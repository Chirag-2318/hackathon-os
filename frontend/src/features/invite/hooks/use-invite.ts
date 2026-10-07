/**
 * useInvite — TanStack Query hook for invite lookup.
 * Source: PRD §4 F-3.
 */
import { useQuery } from '@tanstack/react-query';
import { roomApi } from '../../room/api';

export function useInvite(token: string) {
  return useQuery({
    queryKey: ['invite', token],
    queryFn: () => roomApi.getInvite(token),
    enabled: !!token,
  });
}
