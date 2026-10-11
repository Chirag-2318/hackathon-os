import { apiFetch } from '@/api/client';

export interface CheckpointItem {
  id: string;
  key: string;
  title: string;
  timingLabel: string;
  status: 'passed' | 'current' | 'upcoming';
  passedAt?: string;
  passedByName?: string;
  notes?: string;
  kind: 'AUTO' | 'MANUAL';
  targetPhaseName?: string;
  order: number;
  progressCurrent?: number;
  progressTarget?: number;
}

export const checkpointService = {
  async getCheckpoints(roomId: string): Promise<CheckpointItem[]> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/checkpoints`);
    const items = res?.items || (Array.isArray(res) ? res : []);
    return items.map((c: any) => ({
      id: String(c.id),
      key: c.key || '',
      title: c.title || '',
      timingLabel: c.timingLabel || '',
      status: (c.status || 'upcoming').toLowerCase(),
      passedAt: c.passedAt,
      passedByName: c.passedByName,
      notes: c.notes,
      kind: c.kind || 'MANUAL',
      targetPhaseName: c.targetPhaseName,
      order: c.order ?? 0,
      progressCurrent: c.progressCurrent,
      progressTarget: c.progressTarget,
    }));
  },

  async passCheckpoint(roomId: string, checkpointId: string, notes?: string): Promise<CheckpointItem> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/checkpoints/${checkpointId}/pass`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes || null }),
    });
    return {
      id: String(res.id),
      key: res.key || '',
      title: res.title || '',
      timingLabel: res.timingLabel || '',
      status: (res.status || 'passed').toLowerCase(),
      passedAt: res.passedAt,
      passedByName: res.passedByName,
      notes: res.notes,
      kind: res.kind || 'MANUAL',
      targetPhaseName: res.targetPhaseName,
      order: res.order ?? 0,
      progressCurrent: res.progressCurrent,
      progressTarget: res.progressTarget,
    };
  },

  async updateProgress(roomId: string, checkpointId: string, increment = 1): Promise<CheckpointItem> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/checkpoints/${checkpointId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ increment }),
    });
    return {
      id: String(res.id),
      key: res.key || '',
      title: res.title || '',
      timingLabel: res.timingLabel || '',
      status: (res.status || 'upcoming').toLowerCase(),
      passedAt: res.passedAt,
      passedByName: res.passedByName,
      notes: res.notes,
      kind: res.kind || 'MANUAL',
      targetPhaseName: res.targetPhaseName,
      order: res.order ?? 0,
      progressCurrent: res.progressCurrent,
      progressTarget: res.progressTarget,
    };
  },
};
