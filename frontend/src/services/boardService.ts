/**
 * boardService.ts — Jira-style Kanban board tasks and phases service calling backend API directly.
 */
import { apiFetch } from '@/api/client';
import type { Task, BoardPhase, TaskStatus, TaskPriority, RoomMember } from './types';

function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function mapBackendTaskToFrontend(t: any, defaultRoomId?: string): Task {
  return {
    id: String(t.id),
    key: t.key || t.taskKey || '',
    roomId: String(t.roomId || defaultRoomId || ''),
    summary: t.summary || t.title || 'Untitled task',
    description: t.description || '',
    status: (t.status || 'todo').toLowerCase().replace('_', '') as TaskStatus,
    flagged: Boolean(t.flagged),
    blockedReason: t.blockedReason || undefined,
    assigneeId: t.assigneeId
      ? String(t.assigneeId)
      : (t.assignee?.userId || t.assignee?.id ? String(t.assignee.userId || t.assignee.id) : undefined),
    reporterId: t.reporterId
      ? String(t.reporterId)
      : (t.reporter?.userId || t.reporter?.id ? String(t.reporter.userId || t.reporter.id) : undefined),
    priority: (t.priority || 'medium').toLowerCase() as TaskPriority,
    phaseId: t.phaseId ? String(t.phaseId) : (t.phase?.id ? String(t.phase.id) : 'p-0'),
    role: t.role || 'Frontend',
    labels: t.labels || [],
    estimateMin: Number(t.estimateMin) || 0,
    dueAt: t.dueAt || undefined,
    dependsOn: (t.dependsOn || []).map((d: any) => (typeof d === 'string' ? d : (d.key || String(d.id)))),
    acceptance: (t.acceptance || []).map((a: any) => (typeof a === 'string' ? a : a.text)),
    subtasks: (t.subtasks || []).map((s: any) => ({
      id: String(s.id),
      text: s.text || s.title || '',
      done: Boolean(s.done ?? s.isDone),
    })),
    comments: (t.comments || []).map((c: any) => ({
      id: String(c.id),
      authorId: String(c.authorId || c.author?.id || c.author?.userId || ''),
      text: c.text || '',
      createdAt: c.createdAt || new Date().toISOString(),
    })),
    history: (t.history || []).map((h: any) => ({
      id: String(h.id),
      actorId: String(h.actorId || h.actor?.id || h.actor?.userId || ''),
      text: h.text || '',
      at: h.at || h.createdAt || new Date().toISOString(),
    })),
    order: Number(t.position ?? t.order ?? 0),
    createdAt: t.createdAt || new Date().toISOString(),
    updatedAt: t.updatedAt || new Date().toISOString(),
    version: Number(t.version ?? 0),
  } as Task & { version?: number };
}

export const boardService = {
  async getBoard(roomId: string): Promise<{
    tasks: Task[];
    phases: BoardPhase[];
    members?: any[];
    summary?: any;
    currentPhase?: any;
    hoursLeft?: number;
    serverNow?: string;
  }> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/board`);
    const columns = res?.columns || { todo: [], inprogress: [], done: [] };
    const rawTasks: any[] = [
      ...(columns.todo || []),
      ...(columns.inprogress || []),
      ...(columns.done || []),
    ];
    const tasks = rawTasks.map((t) => mapBackendTaskToFrontend(t, roomId));
    const phases: BoardPhase[] = (res.phases || []).map((p: any) => ({
      id: String(p.id),
      name: p.name,
      startPct: p.startPct ?? 0,
      endPct: p.endPct ?? 100,
      exitCheckpoint: p.exitCheckpoint || '',
      goals: p.goals || [],
    }));

    return {
      tasks,
      phases,
      members: res.members,
      summary: res.summary,
      currentPhase: res.currentPhase,
      hoursLeft: res.hoursLeft,
      serverNow: res.serverNow,
    };
  },

  async getTasks(roomId: string): Promise<Task[]> {
    const board = await this.getBoard(roomId);
    return board.tasks;
  },

  async getTask(roomId: string, taskIdOrKey: string): Promise<Task> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/tasks/${taskIdOrKey}`);
    return mapBackendTaskToFrontend(res, roomId);
  },

  async createTask(roomId: string, draft: Partial<Task>): Promise<Task> {
    const payload = {
      summary: draft.summary || draft.title || 'New task',
      description: draft.description || '',
      status: draft.status || 'todo',
      priority: draft.priority || 'medium',
      phaseId: draft.phaseId || undefined,
      role: draft.role || 'Frontend',
      labels: draft.labels || [],
      estimateMin: draft.estimateMin || 45,
      dueAt: draft.dueAt || null,
      assigneeId: draft.assigneeId || null,
    };

    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapBackendTaskToFrontend(res, roomId);
  },

  async moveTask(
    roomId: string,
    taskId: string,
    toStatus: TaskStatus,
    targetIndex = 0,
    version?: number
  ): Promise<Task> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/tasks/${taskId}/move`, {
      method: 'POST',
      body: JSON.stringify({
        toStatus,
        toIndex: targetIndex ?? 0,
        targetIndex: targetIndex ?? 0,
        version: version ?? null,
      }),
    });
    return mapBackendTaskToFrontend(res.movedTask || res, roomId);
  },

  async flagTask(roomId: string, taskId: string, flagged: boolean, blockedReason?: string): Promise<Task> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/tasks/${taskId}/flag`, {
      method: 'POST',
      body: JSON.stringify({ flagged, blockedReason: blockedReason || null }),
    });
    return mapBackendTaskToFrontend(res, roomId);
  },

  async assignTask(roomId: string, taskId: string, assigneeId?: string | null): Promise<Task> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/tasks/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assigneeId: assigneeId || null }),
    });
    return mapBackendTaskToFrontend(res, roomId);
  },

  async updateTask(
    roomId: string,
    taskId: string,
    patch: Partial<Task> & { version?: number },
    historyNote?: string
  ): Promise<Task> {
    if (patch.flagged !== undefined && Object.keys(patch).length <= 2) {
      return this.flagTask(roomId, taskId, patch.flagged, patch.blockedReason);
    }
    if ('assigneeId' in patch && Object.keys(patch).length === 1) {
      return this.assignTask(roomId, taskId, patch.assigneeId);
    }
    if ('status' in patch && Object.keys(patch).length === 1 && patch.status) {
      return this.moveTask(roomId, taskId, patch.status, patch.order ?? 0, patch.version);
    }

    const payload: any = {
      summary: patch.summary,
      description: patch.description,
      priority: patch.priority,
      phaseId: patch.phaseId,
      role: patch.role,
      labels: patch.labels,
      estimateMin: patch.estimateMin,
      dueAt: patch.dueAt,
      version: patch.version ?? null,
    };

    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return mapBackendTaskToFrontend(res, roomId);
  },

  async updateTaskStatus(
    roomId: string,
    taskId: string,
    status: TaskStatus
  ): Promise<Task> {
    return this.moveTask(roomId, taskId, status, 0);
  },

  async deleteTask(roomId: string, taskId: string): Promise<void> {
    await apiFetch(`/api/v1/rooms/${roomId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  async addComment(roomId: string, taskId: string, text: string): Promise<Task> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return mapBackendTaskToFrontend(res, roomId);
  },

  async addSubtask(roomId: string, taskId: string, text: string): Promise<Task> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return mapBackendTaskToFrontend(res, roomId);
  },

  async toggleSubtask(roomId: string, _taskId: string, subtaskId: string, done: boolean): Promise<Task> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/subtasks/${subtaskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ done }),
    });
    return mapBackendTaskToFrontend(res, roomId);
  },

  async addAcceptance(roomId: string, taskId: string, text: string): Promise<Task> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/tasks/${taskId}/acceptance`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return mapBackendTaskToFrontend(res, roomId);
  },

  async updateDependencies(roomId: string, taskId: string, dependsOnIds: string[]): Promise<Task> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/tasks/${taskId}/dependencies`, {
      method: 'PUT',
      body: JSON.stringify({ dependsOnIds }),
    });
    return mapBackendTaskToFrontend(res);
  },

  createTasksFromPlan(
    roomId: string,
    parsedTasks: any[],
    phases: BoardPhase[],
    eventStartIso: string | null,
    durationHours: number,
    members: RoomMember[],
    leaderId?: string
  ): Task[] {
    const startTime = eventStartIso ? new Date(eventStartIso).getTime() : Date.now();
    const durationMs = (durationHours || 36) * 3600 * 1000;
    const now = new Date().toISOString();

    const roleToMembers: Record<string, RoomMember[]> = {};
    members.forEach(m => {
      (m.roleTags || []).forEach(tag => {
        const lower = tag.toLowerCase();
        if (!roleToMembers[lower]) roleToMembers[lower] = [];
        roleToMembers[lower].push(m);
      });
    });

    const rolePointers: Record<string, number> = {};

    return parsedTasks.map((t, idx) => {
      const key = `TASK-${idx + 1}`;
      const role = t.role || 'Frontend';
      const roleLower = role.toLowerCase();
      const candidates = roleToMembers[roleLower] || [];

      let assigneeId: string | undefined;
      if (candidates.length > 0) {
        const ptr = rolePointers[roleLower] || 0;
        assigneeId = candidates[ptr % candidates.length].id;
        rolePointers[roleLower] = ptr + 1;
      }

      const phase = phases.find(p => p.id === t.phaseId);
      const endPct = phase ? phase.endPct : 50;
      const dueMs = startTime + (endPct / 100) * durationMs;
      const dueAt = new Date(dueMs).toISOString();

      const acceptanceList: string[] = Array.isArray(t.acceptance)
        ? t.acceptance
        : t.acceptance
        ? String(t.acceptance).split(/\.\s+/).map(s => s.trim().replace(/\.$/, '')).filter(Boolean)
        : [];

      const hasDeps = Array.isArray(t.dependsOn) && t.dependsOn.length > 0;
      const priority: TaskPriority = hasDeps ? 'high' : 'medium';

      return {
        id: genId('task'),
        key,
        roomId,
        summary: t.title || t.summary || `Task ${idx + 1}`,
        description: t.description || `Sprint task generated for ${role} in ${phase?.name || 'Phase'}.`,
        status: 'todo',
        flagged: false,
        assigneeId,
        reporterId: leaderId,
        priority,
        phaseId: t.phaseId || (phases[0]?.id || 'p-0'),
        role,
        labels: [role],
        estimateMin: Number(t.estimateMin) || 45,
        dueAt,
        dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn : [],
        acceptance: acceptanceList,
        subtasks: [],
        comments: [],
        history: [{
          id: genId('hist'),
          actorId: leaderId,
          text: 'Generated from Plan Step 4',
          at: now,
        }],
        order: idx,
        createdAt: now,
        updatedAt: now,
      };
    });
  },
};
