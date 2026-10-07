import { apiFetch } from '../../api/client';

export interface RoomDto {
  id: string;
  name: string;
  repoUrl?: string;
  description?: string;
}

export interface RoomMemberDto {
  id: string;
  userId: number;
  roomId: string;
  role: string;
}

export interface InviteResponse {
  token: string;
  link: string;
}

/** Shape the backend actually returns from GET /api/v1/invites/{token} */
export interface InviteView {
  status: 'valid' | 'expired_or_invalid';
  token: string;
  room?: {
    name: string;
    eventName: string;
    leader: { name: string; avatarUrl: string };
    rolesNeeded: { label: string; color: string }[];
    members: { name: string; avatarUrl: string }[];
    joinableRoles: { label: string; color: string }[];
  };
}

export interface RoomMemberResponse {
  id: number;
  displayName: string;
  avatarUrl: string;
  role: string;
}

export const roomApi = {
  getInvite: (token: string) => apiFetch<InviteView>(`/api/v1/invites/${token}`),
  createRoom: (data: { name: string; repoUrl?: string; description?: string }) =>
    apiFetch<RoomDto>('/api/v1/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getRoom: (roomId: string) => apiFetch<RoomDto>(`/api/v1/rooms/${roomId}`),
  getMembers: (roomId: string) =>
    apiFetch<RoomMemberResponse[]>(`/api/v1/rooms/${roomId}/members`),
  createInvite: (roomId: string) =>
    apiFetch<InviteResponse>(`/api/v1/rooms/${roomId}/invites`, {
      method: 'POST',
      body: JSON.stringify({ role: 'MEMBER' }),
    }),
  changeRole: (roomId: string, userId: number, role: string) =>
    apiFetch<RoomMemberResponse>(`/api/v1/rooms/${roomId}/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  joinRoom: (token: string) =>
    apiFetch<RoomDto>(`/api/v1/invites/${token}/join`, {
      method: 'POST',
    }),
};

