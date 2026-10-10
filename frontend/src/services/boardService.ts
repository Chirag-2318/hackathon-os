/**
 * boardService.ts — Jira-style Kanban board tasks and phases service.
 * Supports optimistic updates, history tracking, and plan task generation.
 */
import { apiFetch } from '@/api/client';
import type { Task, BoardPhase, TaskStatus, TaskPriority, RoomMember } from './types';
import {
  getTasks, setTasks, getPhases, setPhases, upsertTask, deleteTask,
  getRoom, getAllMembers, mockDelay, genId, CURRENT_USER_ID, addNotification
} from './mockStore';
import { USE_MOCKS } from './roomService';

function getRoomInitials(roomName: string): string {
  const words = roomName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return words.map(w => w[0]).join('').slice(0, 4).toUpperCase();
}

export const boardService = {
  async getBoard(roomId: string): Promise<{ tasks: Task[]; phases: BoardPhase[] }> {
    if (USE_MOCKS) {
      await mockDelay(60, 150);
      return {
        tasks: getTasks(roomId),
        phases: getPhases(roomId),
      };
    }
    const [tasks, phases] = await Promise.all([
      apiFetch<Task[]>(`/api/v1/rooms/${roomId}/board/tasks`),
      apiFetch<BoardPhase[]>(`/api/v1/rooms/${roomId}/board/phases`),
    ]);
    return { tasks, phases };
  },

  async setTasksAndPhases(roomId: string, tasks: Task[], phases: BoardPhase[]): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(60, 150);
      setTasks(roomId, tasks);
      setPhases(roomId, phases);
      return;
    }
    await apiFetch(`/api/v1/rooms/${roomId}/board`, {
      method: 'PUT',
      body: JSON.stringify({ tasks, phases }),
    });
  },

  getNextKey(roomId: string): string {
    const room = getRoom(roomId);
    const prefix = room ? getRoomInitials(room.name) : 'HOS';
    const tasks = getTasks(roomId);
    let maxNum = 0;
    tasks.forEach(t => {
      const match = t.key?.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `${prefix}-${maxNum + 1}`;
  },

  async createTask(roomId: string, draft: Partial<Task>): Promise<Task> {
    if (USE_MOCKS) {
      await mockDelay(60, 180);
      const room = getRoom(roomId);
      const key = draft.key || this.getNextKey(roomId);
      const now = new Date().toISOString();
      const phases = getPhases(roomId);
      const defaultPhaseId = phases[0]?.id || 'p-0';
      const actorId = CURRENT_USER_ID;

      const newTask: Task = {
        id: genId('task'),
        key,
        roomId,
        summary: draft.summary || draft.title || 'New task',
        description: draft.description || '',
        status: draft.status || 'todo',
        flagged: Boolean(draft.flagged),
        blockedReason: draft.blockedReason,
        assigneeId: draft.assigneeId,
        reporterId: draft.reporterId || actorId,
        priority: draft.priority || 'medium',
        phaseId: draft.phaseId || defaultPhaseId,
        role: draft.role || 'Frontend',
        labels: draft.labels || (draft.role ? [draft.role] : []),
        estimateMin: draft.estimateMin || 45,
        dueAt: draft.dueAt,
        dependsOn: draft.dependsOn || [],
        acceptance: draft.acceptance || [],
        subtasks: draft.subtasks || [],
        comments: draft.comments || [],
        history: [{
          id: genId('hist'),
          actorId,
          text: 'Created task',
          at: now,
        }],
        order: draft.order ?? getTasks(roomId).length,
        createdAt: now,
        updatedAt: now,
      };

      upsertTask(newTask);

      if (newTask.assigneeId && newTask.assigneeId !== actorId) {
        addNotification({
          id: genId('notif'),
          roomId,
          type: 'new_idea',
          message: `You were assigned ${newTask.key}: "${newTask.summary.slice(0, 35)}"`,
          createdAt: now,
          read: false,
          link: `/app/room/${roomId}/board?task=${newTask.key}`,
        });
      }

      return newTask;
    }

    return apiFetch<Task>(`/api/v1/rooms/${roomId}/board/tasks`, {
      method: 'POST',
      body: JSON.stringify(draft),
    });
  },

  async updateTask(
    roomId: string,
    taskId: string,
    patch: Partial<Task>,
    historyText?: string,
    actorId = CURRENT_USER_ID
  ): Promise<Task> {
    if (USE_MOCKS) {
      await mockDelay(50, 150);
      const tasks = getTasks(roomId);
      const idx = tasks.findIndex(t => t.id === taskId || t.key === taskId);
      if (idx < 0) throw new Error('Task not found');

      const current = tasks[idx];
      const now = new Date().toISOString();
      const updatedHistory = [...(current.history || [])];

      if (historyText) {
        updatedHistory.unshift({
          id: genId('hist'),
          actorId,
          text: historyText,
          at: now,
        });
      }

      const updated: Task = {
        ...current,
        ...patch,
        history: updatedHistory,
        updatedAt: now,
      };

      tasks[idx] = updated;
      setTasks(roomId, tasks);

      if (patch.flagged && !current.flagged) {
        addNotification({
          id: genId('notif'),
          roomId,
          type: 'idea_rejected',
          message: `${updated.key} was flagged as blocked`,
          createdAt: now,
          read: false,
          link: `/app/room/${roomId}/board?task=${updated.key}`,
        });
      }

      if (patch.assigneeId && patch.assigneeId !== current.assigneeId && patch.assigneeId !== actorId) {
        const actorName = actorId === CURRENT_USER_ID ? 'Aarav' : 'Teammate';
        addNotification({
          id: genId('notif'),
          roomId,
          type: 'new_idea',
          message: `${actorName} assigned you ${updated.key}`,
          createdAt: now,
          read: false,
          link: `/app/room/${roomId}/board?task=${updated.key}`,
        });
      }

      return updated;
    }

    return apiFetch<Task>(`/api/v1/rooms/${roomId}/board/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  async updateTaskStatus(
    roomId: string,
    taskId: string,
    status: TaskStatus,
    actorName = 'Aarav'
  ): Promise<Task> {
    const statusLabel = status === 'todo' ? 'To do' : status === 'inprogress' ? 'In progress' : 'Done';
    return this.updateTask(roomId, taskId, { status }, `${actorName} moved this to ${statusLabel}`);
  },

  async deleteTask(roomId: string, taskId: string): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(50, 150);
      deleteTask(roomId, taskId);
      return;
    }
    await apiFetch(`/api/v1/rooms/${roomId}/board/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  async addComment(roomId: string, taskId: string, text: string, authorId = CURRENT_USER_ID): Promise<Task> {
    const tasks = getTasks(roomId);
    const task = tasks.find(t => t.id === taskId || t.key === taskId);
    if (!task) throw new Error('Task not found');

    const comment = {
      id: genId('comm'),
      authorId,
      text,
      createdAt: new Date().toISOString(),
    };
    const comments = [...(task.comments || []), comment];
    return this.updateTask(roomId, task.id, { comments }, `${authorId === 'u-aarav' ? 'Aarav' : 'Team member'} commented`);
  },

  async toggleSubtask(roomId: string, taskId: string, subtaskId: string, done: boolean): Promise<Task> {
    const tasks = getTasks(roomId);
    const task = tasks.find(t => t.id === taskId || t.key === taskId);
    if (!task) throw new Error('Task not found');

    const subtasks = (task.subtasks || []).map(st => st.id === subtaskId ? { ...st, done } : st);
    return this.updateTask(roomId, task.id, { subtasks });
  },

  async addSubtask(roomId: string, taskId: string, text: string): Promise<Task> {
    const tasks = getTasks(roomId);
    const task = tasks.find(t => t.id === taskId || t.key === taskId);
    if (!task) throw new Error('Task not found');

    const newSubtask = { id: genId('sub'), text, done: false };
    const subtasks = [...(task.subtasks || []), newSubtask];
    return this.updateTask(roomId, task.id, { subtasks });
  },

  createTasksFromPlan(
    roomId: string,
    parsedTasks: any[],
    phases: BoardPhase[],
    eventStartIso: string | null,
    durationHours: number,
    members: RoomMember[],
    leaderId = CURRENT_USER_ID
  ): Task[] {
    const room = getRoom(roomId);
    const prefix = room ? getRoomInitials(room.name) : 'HOS';
    const startTime = eventStartIso ? new Date(eventStartIso).getTime() : Date.now();
    const durationMs = (durationHours || 36) * 3600 * 1000;
    const now = new Date().toISOString();

    // Map members by role tag for round robin matching
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
      const key = `${prefix}-${idx + 1}`;
      const role = t.role || 'Frontend';
      const roleLower = role.toLowerCase();
      const candidates = roleToMembers[roleLower] || [];

      let assigneeId: string | undefined;
      if (candidates.length > 0) {
        const ptr = rolePointers[roleLower] || 0;
        assigneeId = candidates[ptr % candidates.length].id;
        rolePointers[roleLower] = ptr + 1;
      }

      // Derive dueAt from phase endPct
      const phase = phases.find(p => p.id === t.phaseId);
      const endPct = phase ? phase.endPct : 50;
      const dueMs = startTime + (endPct / 100) * durationMs;
      const dueAt = new Date(dueMs).toISOString();

      // Split acceptance string by sentences
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
