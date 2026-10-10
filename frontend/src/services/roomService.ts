/**
 * roomService.ts — Room CRUD service.
 * Switch: VITE_USE_MOCKS !== "false" → mock; else → real API v1.
 */
import { apiFetch } from '@/api/client';
import type { Room, EventTemplate } from './types';
import {
  getRooms, getRoom, setRoom, getRoomMembers,
  mockDelay, genId, CURRENT_USER_ID, ensureStoreSeeded,
  addNotification, getMember, setMember, getAllMembers,
  getPrepItems, setPrepItems,
} from './mockStore';
import { DEMO_MEMBERS } from './mockStore';

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

// ── Event templates ───────────────────────────────────────────────────────────

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: 'pb-sih',
    name: 'SIH-style (6 members, 36h)',
    durationHours: 36,
    teamSize: 6,
    meta: '36h · 6 members',
    prefills: 'Pre-fills: 36h clock and phase plan',
    icon: '🏆',
  },
  {
    id: 'pb-devpost',
    name: '48-hour online (Devpost-style)',
    durationHours: 48,
    teamSize: 4,
    meta: '48h · 1–4 members',
    prefills: 'Pre-fills: 48h clock and phase plan',
    icon: '🌐',
  },
  {
    id: 'pb-mlh',
    name: 'Weekend (MLH-style)',
    durationHours: 36,
    teamSize: 4,
    meta: '36h · 4 members',
    prefills: 'Pre-fills: 36h clock and phase plan',
    icon: '🚀',
  },
  {
    id: 'pb-sprint',
    name: '4-hour AI sprint',
    durationHours: 4,
    teamSize: 3,
    meta: '4h · 1–3 members',
    prefills: 'Pre-fills: 4h clock and phase plan',
    icon: '⚡',
  },
  {
    id: 'pb-corporate',
    name: 'Corporate hackathon',
    durationHours: 168,
    teamSize: 5,
    meta: '1 week · 2–5 members',
    prefills: 'Pre-fills: 1-week clock and phase plan',
    icon: '🏢',
  },
  {
    id: 'pb-solo',
    name: 'Solo',
    durationHours: 48,
    teamSize: 1,
    meta: '48h · solo',
    prefills: 'Pre-fills: 48h clock and phase plan',
    icon: '👤',
  },
];

// Default prep items by template
function defaultPrepItems(roomId: string, templateId: string): import('./types').PrepItem[] {
  const base = [
    { id: genId('prep'), roomId, title: 'Read the hackathon brief together', done: false, category: 'Planning' },
    { id: genId('prep'), roomId, title: 'Set up dev environment for everyone', done: false, category: 'Setup' },
    { id: genId('prep'), roomId, title: 'Create team GitHub repository', done: false, category: 'Setup' },
    { id: genId('prep'), roomId, title: 'Add the hackathon brief to the room', done: false, category: 'Planning' },
    { id: genId('prep'), roomId, title: 'Invite all teammates', done: false, category: 'Team' },
    { id: genId('prep'), roomId, title: 'Assign role tags to each member', done: false, category: 'Team' },
  ];
  if (templateId === 'pb-sih') {
    base.push(
      { id: genId('prep'), roomId, title: 'Check SIH submission platform registration', done: false, category: 'Compliance' },
      { id: genId('prep'), roomId, title: 'Prepare PPT template for internal round', done: false, category: 'Presentation' },
    );
  }
  return base;
}

// ── Mock implementations ──────────────────────────────────────────────────────

export const roomService = {
  async listRooms(): Promise<Room[]> {
    if (USE_MOCKS) {
      ensureStoreSeeded();
      await mockDelay();
      return Object.values(getRooms());
    }
    return apiFetch<any[]>('/api/v1/rooms');
  },

  async getRoom(id: string): Promise<Room | null> {
    if (USE_MOCKS) {
      ensureStoreSeeded();
      await mockDelay(100, 300);
      return getRoom(id);
    }
    return apiFetch<any>(`/api/v1/rooms/${id}`);
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
    if (USE_MOCKS) {
      await mockDelay();
      const template = EVENT_TEMPLATES.find(t => t.id === data.templateId) ?? EVENT_TEMPLATES[0];
      const start = data.eventStart ?? (() => {
        // Default: next Saturday 9:00 AM
        const d = new Date();
        const day = d.getDay();
        const daysUntilSat = (6 - day + 7) % 7 || 7;
        d.setDate(d.getDate() + daysUntilSat);
        d.setHours(9, 0, 0, 0);
        return d.toISOString();
      })();
      const end = data.eventEnd ?? (() => {
        const s = new Date(start);
        s.setHours(s.getHours() + template.durationHours);
        return s.toISOString();
      })();

      const room: Room = {
        id: genId('room'),
        name: data.name,
        description: data.description ?? '',
        projectDescription: data.projectDescription ?? '',
        templateId: data.templateId,
        createdAt: new Date().toISOString(),
        eventStart: start,
        eventEnd: end,
        timezone: data.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        ownerId: CURRENT_USER_ID,
        memberIds: [CURRENT_USER_ID],
        stage: 'brief',
        stageDone: { brief: false, ideate: false, crowd: false, plan: false },
      };
      setRoom(room);

      // Seed prep items
      setPrepItems(room.id, defaultPrepItems(room.id, data.templateId));

      // Notification
      addNotification({
        id: genId('notif'),
        roomId: room.id,
        type: 'room_created',
        message: `Room "${room.name}" created`,
        createdAt: new Date().toISOString(),
        read: false,
        link: `/app/room/${room.id}/overview`,
      });

      return room;
    }
    return apiFetch<any>('/api/v1/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateRoom(id: string, patch: Partial<Room>): Promise<Room> {
    if (USE_MOCKS) {
      await mockDelay(100, 250);
      const existing = getRoom(id);
      if (!existing) throw new Error(`Room ${id} not found`);
      const updated = { ...existing, ...patch };
      setRoom(updated);
      return updated;
    }
    return apiFetch<any>(`/api/v1/rooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  async enterBuildPhase(roomId: string): Promise<Room> {
    if (USE_MOCKS) {
      await mockDelay(200, 400);
      const room = getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);
      const updated = { ...room, stage: 'build' as const };
      setRoom(updated);
      addNotification({
        id: genId('notif'),
        roomId,
        type: 'build_unlocked',
        message: 'Plan complete, build phase is live',
        createdAt: new Date().toISOString(),
        read: false,
        link: `/app/room/${roomId}/board`,
      });
      return updated;
    }
    return apiFetch<any>(`/api/v1/rooms/${roomId}/enter-build`, { method: 'POST' });
  },

  async getMembers(roomId: string): Promise<import('./types').RoomMember[]> {
    if (USE_MOCKS) {
      await mockDelay(100, 300);
      return getRoomMembers(roomId);
    }
    return apiFetch<any[]>(`/api/v1/rooms/${roomId}/members`);
  },

  async addMember(roomId: string, userId: string): Promise<Room> {
    if (USE_MOCKS) {
      await mockDelay();
      const room = getRoom(roomId);
      if (!room) throw new Error('Room not found');
      if (!room.memberIds.includes(userId)) {
        room.memberIds.push(userId);
        setRoom(room);
      }
      // Ensure the member exists
      if (!getMember(userId) && DEMO_MEMBERS[userId]) {
        setMember(DEMO_MEMBERS[userId]);
      }
      return room;
    }
    return apiFetch<any>(`/api/v1/rooms/${roomId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  async getEventTemplates(): Promise<EventTemplate[]> {
    if (USE_MOCKS) {
      await mockDelay(100, 200);
      return EVENT_TEMPLATES;
    }
    return apiFetch<any[]>('/api/v1/event-templates');
  },

  async suggestName(): Promise<{ suggestion: string }> {
    if (USE_MOCKS) {
      await mockDelay(200, 500);
      const adjectives = ['Ninja', 'Quantum', 'Stellar', 'Phoenix', 'Rapid'];
      const nouns = ['Sprint', 'Hack', 'Build', 'Labs', 'Studio'];
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const year = new Date().getFullYear();
      return { suggestion: `Team ${adj} ${noun} ${year}` };
    }
    return apiFetch<any>('/api/v1/rooms/suggest-name');
  },
};
