/**
 * docsService.ts — Docs vault files service calling backend API directly.
 */
import { apiFetch } from '@/api/client';
import { API_BASE_URL } from '@/lib/apiClient';
import type { DocFile } from './types';

export interface DocHealth {
  status: 'ok' | 'warning';
  issues: string[];
}

export interface ExtendedDocFile extends DocFile {
  health?: DocHealth;
}

export const docsService = {
  async getDocs(roomId: string): Promise<ExtendedDocFile[]> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/docs`);
    const items = res?.items || (Array.isArray(res) ? res : []);
    return items.map((item: any) => ({
      id: item.id || item.fileName,
      name: item.fileName || item.name,
      title: item.title || item.fileName,
      content: item.content || '',
      version: item.currentVersion ?? item.version ?? 1,
      createdAt: item.updatedAt || new Date().toISOString(),
      updatedAt: item.updatedAt,
      health: item.health || { status: 'ok', issues: [] },
    }));
  },

  async getDoc(roomId: string, fileName: string): Promise<any> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/docs/${fileName}`);
  },

  async updateDoc(
    roomId: string,
    fileName: string,
    data: { content: string; baseVersion?: number; versionLabel?: string }
  ): Promise<any> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/docs/${fileName}`, {
      method: 'PUT',
      body: JSON.stringify({
        content: data.content,
        baseVersion: data.baseVersion ?? null,
        versionLabel: data.versionLabel || null,
      }),
    });
  },

  async restoreVersion(roomId: string, fileName: string, version: number): Promise<any> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/docs/${fileName}/restore`, {
      method: 'POST',
      body: JSON.stringify({ version }),
    });
  },

  async addComment(roomId: string, fileName: string, text: string): Promise<any> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/docs/${fileName}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async deleteComment(roomId: string, commentId: string): Promise<void> {
    await apiFetch(`/api/v1/rooms/${roomId}/docs/comments/${commentId}`, {
      method: 'DELETE',
    });
  },

  async addDoc(roomId: string, doc: Omit<DocFile, 'id' | 'createdAt'>): Promise<DocFile> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/docs`, {
      method: 'POST',
      body: JSON.stringify(doc),
    });
  },

  async saveDocs(roomId: string, docs: DocFile[]): Promise<void> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/docs`, {
      method: 'PUT',
      body: JSON.stringify(docs),
    });
  },

  downloadAllZipUrl(roomId: string): string {
    const baseUrl = API_BASE_URL;
    return `${baseUrl}/api/v1/rooms/${roomId}/docs/download.zip`;
  },

  downloadDocUrl(roomId: string, fileName: string): string {
    const baseUrl = API_BASE_URL;
    return `${baseUrl}/api/v1/rooms/${roomId}/docs/${fileName}/download`;
  },

  async askDocAi(
    roomId: string,
    fileName: string,
    data: { prompt: string; selectedText?: string; fullContent?: string; action?: string }
  ): Promise<{ answer: string; sources: string[]; model: string; latencyMs: number }> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/docs/${encodeURIComponent(fileName)}/ai`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
