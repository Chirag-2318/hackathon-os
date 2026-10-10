/**
 * ideaService.ts — Ideas CRUD for the Ideate page.
 */
import { apiFetch } from '@/api/client';
import type { Idea, IdeaStatus, IdeaLink } from './types';
import {
  getIdeas, setIdeas, upsertIdea, deleteIdea, getRoom, setRoom,
  mockDelay, genId, CURRENT_USER_ID, addNotification, getMember,
} from './mockStore';
import { USE_MOCKS } from './roomService';

export const ideaService = {
  async listIdeas(roomId: string): Promise<Idea[]> {
    if (USE_MOCKS) {
      await mockDelay(50, 150);
      return getIdeas(roomId);
    }
    return apiFetch<Idea[]>(`/api/v1/rooms/${roomId}/ideas`);
  },

  async createIdea(
    roomId: string,
    draft: { text: string; links?: IdeaLink[]; notes?: string[] }
  ): Promise<Idea> {
    if (USE_MOCKS) {
      await mockDelay(60, 180);
      const idea: Idea = {
        id: genId('idea'),
        roomId,
        authorId: CURRENT_USER_ID,
        createdAt: new Date().toISOString(),
        text: draft.text,
        links: draft.links || [],
        notes: draft.notes || [],
        status: 'pending',
        isPrimary: false,
      };
      upsertIdea(idea);

      addNotification({
        id: genId('notif'),
        roomId,
        type: 'new_idea',
        message: `New idea: "${idea.text.slice(0, 50)}"`,
        createdAt: new Date().toISOString(),
        read: false,
        link: `/app/room/${roomId}/ideate`,
      });
      return idea;
    }
    return apiFetch<Idea>(`/api/v1/rooms/${roomId}/ideas`, {
      method: 'POST',
      body: JSON.stringify(draft),
    });
  },

  async updateIdea(idea: Idea): Promise<Idea> {
    if (USE_MOCKS) {
      await mockDelay(50, 150);
      upsertIdea(idea);
      return idea;
    }
    return apiFetch<Idea>(`/api/v1/rooms/${idea.roomId}/ideas/${idea.id}`, {
      method: 'PATCH',
      body: JSON.stringify(idea),
    });
  },

  async approveIdea(roomId: string, ideaId: string): Promise<Idea> {
    if (USE_MOCKS) {
      await mockDelay(50, 150);
      const ideas = getIdeas(roomId);
      const idx = ideas.findIndex(i => i.id === ideaId);
      if (idx < 0) throw new Error('Idea not found');
      ideas[idx] = { ...ideas[idx], status: 'approved' };
      setIdeas(roomId, ideas);

      addNotification({
        id: genId('notif'),
        roomId,
        type: 'idea_approved',
        message: `Your idea "${ideas[idx].text.slice(0, 40)}" was approved!`,
        createdAt: new Date().toISOString(),
        read: false,
        link: `/app/room/${roomId}/ideate`,
      });
      return ideas[idx];
    }
    return apiFetch<Idea>(`/api/v1/rooms/${roomId}/ideas/${ideaId}/approve`, { method: 'POST' });
  },

  async rejectIdea(roomId: string, ideaId: string, reason?: string): Promise<Idea> {
    if (USE_MOCKS) {
      await mockDelay(50, 150);
      const ideas = getIdeas(roomId);
      const idx = ideas.findIndex(i => i.id === ideaId);
      if (idx < 0) throw new Error('Idea not found');
      ideas[idx] = { ...ideas[idx], status: 'rejected', rejectReason: reason };
      setIdeas(roomId, ideas);

      addNotification({
        id: genId('notif'),
        roomId,
        type: 'idea_rejected',
        message: `An idea was rejected`,
        createdAt: new Date().toISOString(),
        read: false,
        link: `/app/room/${roomId}/ideate`,
      });
      return ideas[idx];
    }
    return apiFetch<Idea>(`/api/v1/rooms/${roomId}/ideas/${ideaId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async restoreIdea(roomId: string, ideaId: string): Promise<Idea> {
    if (USE_MOCKS) {
      await mockDelay(50, 120);
      const ideas = getIdeas(roomId);
      const idx = ideas.findIndex(i => i.id === ideaId);
      if (idx < 0) throw new Error('Idea not found');
      ideas[idx] = { ...ideas[idx], status: 'pending', rejectReason: undefined };
      setIdeas(roomId, ideas);
      return ideas[idx];
    }
    return apiFetch<Idea>(`/api/v1/rooms/${roomId}/ideas/${ideaId}/restore`, { method: 'POST' });
  },

  async deleteIdea(roomId: string, ideaId: string): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(50, 120);
      deleteIdea(roomId, ideaId);
      return;
    }
    await apiFetch(`/api/v1/rooms/${roomId}/ideas/${ideaId}`, { method: 'DELETE' });
  },

  async setPrimaryIdea(roomId: string, ideaId: string): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(50, 120);
      const ideas = getIdeas(roomId);
      const updated = ideas.map(i => ({
        ...i,
        isPrimary: i.id === ideaId ? !i.isPrimary : false,
      }));
      setIdeas(roomId, updated);
      return;
    }
    await apiFetch<void>(`/api/v1/rooms/${roomId}/ideas/${ideaId}/set-primary`, { method: 'POST' });
  },

  async markIdeationDone(roomId: string): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(100, 200);
      const room = getRoom(roomId);
      if (!room) throw new Error('Room not found');
      room.stageDone.ideate = true;
      room.stageDone.crowd = true; // No crowd gate
      if (room.stage === 'ideate') {
        room.stage = 'plan';
      }
      setRoom(room);
      addNotification({
        id: genId('notif'),
        roomId,
        type: 'ideation_done',
        message: 'Ideation complete. Moving to Plan.',
        createdAt: new Date().toISOString(),
        read: false,
        link: `/app/room/${roomId}/plan`,
      });
      return;
    }
    await apiFetch<void>(`/api/v1/rooms/${roomId}/ideate/done`, { method: 'POST' });
  },

  async reopenIdeation(roomId: string): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(50, 150);
      const room = getRoom(roomId);
      if (!room) throw new Error('Room not found');
      room.stageDone.ideate = false;
      setRoom(room);
      return;
    }
    await apiFetch<void>(`/api/v1/rooms/${roomId}/ideate/reopen`, { method: 'POST' });
  },

  /** Seed sample ideas from teammates for testing */
  async seedSampleIdeas(roomId: string): Promise<Idea[]> {
    if (!USE_MOCKS) return [];
    await mockDelay(150, 300);
    const sample = [
      {
        authorId: 'u-ishita',
        text: 'Tinder for hackathon teammates, matching verified GitHub profiles with sprint ambitions. Instant mutual match triggers an automated repo fork, Discord room, and shared planning board in 2 seconds.',
        links: [{ url: 'https://github.com', title: 'GitHub API' }],
        notes: ['Focus on skill complementarity rather than resume bullet points', 'Auto-scaffold project board'],
        isPrimary: true,
      },
      {
        authorId: 'u-kabir',
        text: 'AI-driven code review bot that parses pull requests for hackathon teams and suggests quick MVP performance wins before judges test the live demo.',
        links: [{ url: 'https://openai.com', title: 'OpenAI Embeddings' }],
        notes: ['Check rate limits under concurrent traffic'],
        isPrimary: false,
      },
      {
        authorId: 'u-sanjay',
        text: 'Late-night campus food aggregator for hostel students with UPI group payments and dorm delivery tracking on a live campus map.',
        links: [],
        notes: ['Requires local vendor phone numbers'],
        isPrimary: false,
      },
    ];

    const ideas: Idea[] = sample.map((d, i) => ({
      id: genId('idea'),
      roomId,
      authorId: d.authorId,
      createdAt: new Date(Date.now() - (sample.length - i) * 60 * 1000).toISOString(),
      text: d.text,
      links: d.links,
      notes: d.notes,
      status: 'pending' as IdeaStatus,
      isPrimary: d.isPrimary,
    }));

    const existing = getIdeas(roomId);
    setIdeas(roomId, [...ideas, ...existing]);
    return ideas;
  },
};
