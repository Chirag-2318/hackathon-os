/**
 * roomService.ts — Room CRUD service calling backend API directly.
 */
import { apiFetch } from '@/api/client';
import type { Room, EventTemplate, RoomMember } from './types';

export const roomService = {
  async listRooms(): Promise<Room[]> {
    return apiFetch<Room[]>('/api/v1/rooms');
  },

  async getRoom(id: string): Promise<Room | null> {
    return apiFetch<Room>(`/api/v1/rooms/${id}`);
  },

  async createRoom(data: {
    name: string;
    description?: string;
    projectDescription?: string;
    templateId: string;
    eventStart?: string;
    eventEnd?: string;
    timezone?: string;
  }): Promise<Room> {
    return apiFetch<Room>('/api/v1/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRoom(id: string, patch: Partial<Room>): Promise<Room> {
    return apiFetch<Room>(`/api/v1/rooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  async enterBuildPhase(roomId: string): Promise<Room> {
    return apiFetch<Room>(`/api/v1/rooms/${roomId}/enter-build`, { method: 'POST' });
  },

  async getMembers(roomId: string): Promise<RoomMember[]> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/members`);
    const list: any[] = Array.isArray(res)
      ? res
      : Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res?.members)
      ? res.members
      : [];

    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
    return list.map((m: any, idx: number) => ({
      id: String(m.id || m.userId || ''),
      displayName: m.displayName || m.name || 'Team Member',
      initials: m.initials || (m.displayName || m.name || 'TM').slice(0, 2).toUpperCase(),
      avatarColor: m.avatarColor || colors[idx % colors.length],
      role: (m.role?.toLowerCase() === 'leader' || m.isLeader) ? 'leader' : 'member',
      roleTags: Array.isArray(m.roleTags) ? m.roleTags : Array.isArray(m.skills) ? m.skills : [],
      avatarUrl: m.avatarUrl,
    }));
  },

  async addMember(roomId: string, userId: string): Promise<Room> {
    return apiFetch<Room>(`/api/v1/rooms/${roomId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async getEventTemplates(): Promise<EventTemplate[]> {
    return apiFetch<EventTemplate[]>('/api/v1/event-templates');
  },

  async suggestName(): Promise<{ suggestion: string }> {
    return apiFetch<{ suggestion: string }>('/api/v1/rooms/suggest-name');
  },

  async getOverview(roomId: string): Promise<any> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/overview`);
  },

  async sendHeartbeat(roomId: string): Promise<any> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/heartbeat`, {
      method: 'POST',
    });
  },

  async getNavBadges(roomId: string): Promise<{ openTasks: number; attentionCount: number; github?: number }> {
    return apiFetch<{ openTasks: number; attentionCount: number; github?: number }>(`/api/v1/rooms/${roomId}/nav-badges`);
  },

  async regenerateJoinCode(roomId: string): Promise<{ joinCode: string }> {
    return apiFetch<{ joinCode: string }>(`/api/v1/rooms/${roomId}/join-code/regenerate`, {
      method: 'POST',
    });
  },
};
