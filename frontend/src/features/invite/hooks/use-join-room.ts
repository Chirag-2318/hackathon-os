/**
 * useJoinRoom — mutation hook for joining a room via invite.
 * Source: PRD §4 F-3.
 */
import { useMutation } from '@tanstack/react-query';
import { roomApi } from '../../room/api';

export function useJoinRoom(token: string) {
  return useMutation({
    mutationFn: () => roomApi.joinRoom(token),
  });
}
