/**
 * phaseService.ts — Phase engine and phase task generation API client.
 */
import { apiFetch } from '@/api/client';
import { API_BASE_URL } from '@/lib/apiClient';
import type { ValidationIssueDto } from '@/services/types';

export interface PhaseWindow {
  startHour: number;
  endHour: number;
  startTime: string | null;
  endTime: string | null;
}

export interface PhaseTaskCounts {
  total: number;
  confirmed: number;
  awaiting: number;
  inProgress: number;
  todo: number;
  dropped: number;
}

export interface PhaseSummary {
  id: string;
  key: string;
  name: string;
  position: number;
  status: 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED';
  goal: string | null;
  exitCheckpoint: string | null;
  owners: string | null;
  deliverables: string | null;
  rawMarkdown: string | null;
  taskCounts: PhaseTaskCounts;
  hoursPlanned: number;
  hoursConfirmed: number;
  window: PhaseWindow;
  overdue: boolean;
  ready: boolean;
  tasksGenerated: boolean;
  isCurrent: boolean;
  nextPhaseKey: string | null;
}

export interface PhaseTaskPromptResponse {
  prompt: string;
  charCount: number;
  mode: 'FRESH' | 'APPEND';
  outputFileName: string;
  bundleName: string;
  targets: string;
  stale: boolean;
  canRegenerate: boolean;
}

export interface PhaseTaskImportSummary {
  ok: boolean;
  needsConfirmation: boolean;
  issues: any[];
  tasksCreated: number;
  totalHours: number;
  teamMemberCount: number;
  memberHours: Record<string, number>;
  uncoveredRequirements: string[];
  nextPhaseKey: string | null;
}

export interface PhaseAdvanceResponse {
  buildComplete: boolean;
  nextPhaseKey: string | null;
  details?: string[];
}

export const phaseService = {
  async getPhases(roomId: string): Promise<PhaseSummary[]> {
    return apiFetch<PhaseSummary[]>(`/api/v1/rooms/${roomId}/phases`);
  },

  async advancePhase(
    roomId: string,
    phaseKey: string,
    carryover?: 'DEFER_ALL' | 'DROP_ALL'
  ): Promise<PhaseAdvanceResponse> {
    return apiFetch<PhaseAdvanceResponse>(`/api/v1/rooms/${roomId}/phases/${encodeURIComponent(phaseKey)}/advance`, {
      method: 'POST',
      body: JSON.stringify(carryover ? { carryover } : {}),
    });
  },

  async deferTask(roomId: string, taskId: string): Promise<any> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/tasks/${taskId}/defer`, {
      method: 'POST',
    });
  },

  async dropTask(roomId: string, taskId: string, reason?: string): Promise<any> {
    return apiFetch<any>(`/api/v1/rooms/${roomId}/tasks/${taskId}/drop`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Dropped by leader' }),
    });
  },

  async dismissReady(roomId: string, phaseKey: string): Promise<void> {
    await apiFetch(`/api/v1/rooms/${roomId}/phases/${encodeURIComponent(phaseKey)}/dismiss-ready`, {
      method: 'POST',
    });
  },

  async getPhaseTaskPrompt(
    roomId: string,
    phaseKey: string,
    mode: 'FRESH' | 'APPEND' = 'FRESH'
  ): Promise<PhaseTaskPromptResponse> {
    return apiFetch<PhaseTaskPromptResponse>(
      `/api/v1/rooms/${roomId}/phases/${encodeURIComponent(phaseKey)}/tasks/prompt?mode=${mode}`
    );
  },

  getContextPackUrl(roomId: string): string {
    const baseUrl = API_BASE_URL;
    return `${baseUrl}/api/v1/rooms/${roomId}/context-pack.md`;
  },

  async validateAndImportTasks(
    roomId: string,
    phaseKey: string,
    files: File[],
    mode: 'FRESH' | 'APPEND' = 'FRESH',
    confirmRegenerate = false
  ): Promise<PhaseTaskImportSummary> {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }
    const url = `/api/v1/rooms/${roomId}/phases/${encodeURIComponent(phaseKey)}/tasks/validate?mode=${mode}&confirmRegenerate=${confirmRegenerate}`;
    return apiFetch<PhaseTaskImportSummary>(url, {
      method: 'POST',
      body: formData,
    });
  },

  async generatePhaseTasks(roomId: string, phaseKey: string): Promise<{ content: string }> {
    return apiFetch<{ content: string }>(
      `/api/v1/rooms/${roomId}/phases/${encodeURIComponent(phaseKey)}/tasks/generate`,
      {
        method: 'POST',
      }
    );
  },
};
