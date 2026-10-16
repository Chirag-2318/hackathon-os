/**
 * ideaService.ts — Ideas CRUD and Ideation flow service calling backend API directly.
 */
import { apiFetch } from '@/api/client';
import { API_BASE_URL } from '@/lib/apiClient';
import type { Idea, IdeaLink, IdeateResponse } from './types';

export const ideaService = {
  async getIdeateData(roomId: string): Promise<IdeateResponse> {
    return apiFetch<IdeateResponse>(`/api/v1/rooms/${roomId}/ideate`);
  },

  async listIdeas(roomId: string): Promise<Idea[]> {
    const data = await this.getIdeateData(roomId);
    return data.ideas || [];
  },

  async createIdea(
    roomId: string,
    draft: { text: string; links?: IdeaLink[]; notes?: string[]; anonymous?: boolean }
  ): Promise<Idea> {
    return apiFetch<Idea>(`/api/v1/rooms/${roomId}/ideas`, {
      method: 'POST',
      body: JSON.stringify(draft),
    });
  },

  async updateIdea(idea: Idea): Promise<Idea> {
    return apiFetch<Idea>(`/api/v1/rooms/${idea.roomId}/ideas/${idea.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        text: idea.text,
        links: idea.links,
        notes: idea.notes,
      }),
    });
  },

  async approveIdea(roomId: string, ideaId: string): Promise<Idea> {
    return apiFetch<Idea>(`/api/v1/rooms/${roomId}/ideas/${ideaId}/approve`, { method: 'POST' });
  },

  async rejectIdea(roomId: string, ideaId: string, reason?: string): Promise<Idea> {
    return apiFetch<Idea>(`/api/v1/rooms/${roomId}/ideas/${ideaId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async restoreIdea(roomId: string, ideaId: string): Promise<Idea> {
    return apiFetch<Idea>(`/api/v1/rooms/${roomId}/ideas/${ideaId}/restore`, { method: 'POST' });
  },

  async deleteIdea(roomId: string, ideaId: string): Promise<void> {
    await apiFetch(`/api/v1/rooms/${roomId}/ideas/${ideaId}`, { method: 'DELETE' });
  },

  async setPrimaryIdea(roomId: string, ideaId: string, isPrimary: boolean = true): Promise<void> {
    if (isPrimary) {
      await apiFetch<void>(`/api/v1/rooms/${roomId}/ideas/${ideaId}/primary`, { method: 'PUT' });
    } else {
      await apiFetch<void>(`/api/v1/rooms/${roomId}/ideas/${ideaId}/primary`, { method: 'DELETE' });
    }
  },

  async markIdeationDone(roomId: string): Promise<void> {
    await apiFetch<void>(`/api/v1/rooms/${roomId}/ideation/done`, { method: 'POST' });
  },

  async reopenIdeation(roomId: string): Promise<void> {
    await apiFetch<void>(`/api/v1/rooms/${roomId}/ideation/reopen`, { method: 'POST' });
  },

  async exportIdeasMarkdown(roomId: string): Promise<void> {
    const baseUrl = API_BASE_URL;
    const res = await fetch(`${baseUrl}/api/v1/rooms/${roomId}/ideas/export.md`, {
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Failed to export ideas');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ideas.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async seedSampleIdeas(roomId: string): Promise<any> {
    return apiFetch<any>(`/api/v1/dev/rooms/${roomId}/seed-ideas`, { method: 'POST' });
  },
};
