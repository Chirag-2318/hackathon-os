import { apiFetch } from '../../api/client';

export interface RoomDto {
  id: string;
  name: string;
  repoUrl?: string;
  description?: string;
}

export interface RoomMemberDto {
  id: string;
  userId: string | number;
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
  id: string | number;
  displayName: string;
  avatarUrl: string;
  role: string;
}

export interface InviteEmailResponse {
  token: string;
  link: string;
  email: string;
  role: string;
  status: string;
}

export const roomApi = {
  getInvite: async (token: string): Promise<InviteView> => {
    const raw = await apiFetch<any>(`/api/v1/invites/${token}`);
    const isValid = Boolean(raw?.valid ?? (raw?.status === 'valid'));
    return {
      status: isValid ? 'valid' : 'expired_or_invalid',
      token,
      room: isValid
        ? {
            name: raw.roomName || raw.room?.name || 'Hackathon Room',
            eventName: raw.eventName || raw.room?.eventName || 'Hackathon OS Team',
            leader: raw.room?.leader || {
              name: raw.hostName || 'Team Leader',
              avatarUrl: raw.hostAvatarUrl || '',
            },
            rolesNeeded: (raw.skillsNeeded || raw.room?.rolesNeeded || ['Builder', 'Designer']).map(
              (s: any) => (typeof s === 'string' ? { label: s, color: 'blue' } : s)
            ),
            members: raw.room?.members || [],
            joinableRoles: raw.room?.joinableRoles || [
              { label: 'Builder', color: 'blue' },
              { label: 'Designer', color: 'purple' },
              { label: 'Presenter', color: 'emerald' },
              { label: 'Domain Expert', color: 'amber' },
              { label: 'QA', color: 'rose' },
            ],
          }
        : undefined,
    };
  },
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
  inviteByEmail: (roomId: string, email: string, role = 'BUILDER') =>
    apiFetch<InviteEmailResponse>(`/api/v1/rooms/${roomId}/invites/email`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  changeRole: (roomId: string, userId: string | number, role: string) =>
    apiFetch<RoomMemberResponse>(`/api/v1/rooms/${roomId}/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  joinRoom: (token: string) =>
    apiFetch<{ roomId: string }>(`/api/v1/invites/${token}/join`, {
      method: 'POST',
    }),
};

