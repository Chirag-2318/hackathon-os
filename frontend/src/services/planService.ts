/**
 * planService.ts — Plan steps, validation pipeline, and stage advancing calling backend API directly.
 */
import { apiFetch } from '@/api/client';
import type { PlanData, PlanState } from './types';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  issues?: string[];
  warnings?: string[];
  summary?: string;
  repairPrompt?: string;
  nextStepKey?: string;
  planComplete?: boolean;
  completion?: any;
}

export const planService = {
  async getPlan(roomId: string): Promise<PlanData> {
    return apiFetch<PlanData>(`/api/v1/rooms/${roomId}/plan`);
  },

  async getPlanState(roomId: string): Promise<PlanState> {
    const plan = await this.getPlan(roomId);
    const stepsMap: any = {
      prd: { answer: '', validated: false, parsed: null, issues: [], warnings: [] },
      tech: { answer: '', validated: false, parsed: null, issues: [], warnings: [] },
      phases: { answer: '', validated: false, parsed: null, issues: [], warnings: [] },
      tasks: { answer: '', validated: false, parsed: null, issues: [], warnings: [] },
      demo: { answer: '', validated: false, parsed: null, issues: [], warnings: [] },
    };

    plan.steps.forEach(s => {
      if (stepsMap[s.key]) {
        stepsMap[s.key] = {
          answer: s.answer || '',
          validated: s.validated,
          parsed: null,
          issues: s.errors || [],
          warnings: s.warnings || [],
        };
      }
    });

    return {
      roomId,
      steps: stepsMap,
      completedAt: plan.completion?.completedAt,
    };
  },

  async saveStepDraft(roomId: string, stepKey: string, answer: string, confirmClear?: boolean): Promise<void> {
    await apiFetch<void>(`/api/v1/rooms/${roomId}/plan/steps/${stepKey}`, {
      method: 'PUT',
      body: JSON.stringify({ answer, confirmClear: !!confirmClear }),
    });
  },

  async validateStep(
    roomId: string,
    stepKey: string,
    answer: string
  ): Promise<ValidationResult> {
    const res = await apiFetch<any>(`/api/v1/rooms/${roomId}/plan/validate`, {
      method: 'POST',
      body: JSON.stringify({ stepKey, answer }),
    });

    return {
      valid: res.valid,
      errors: res.errors || [],
      issues: res.errors || [],
      warnings: res.warnings || [],
      summary: res.summary,
      repairPrompt: res.repairPrompt,
      nextStepKey: res.nextStepKey,
      planComplete: res.planComplete,
      completion: res.completion,
    };
  },

  async generateStep(roomId: string, stepKey: string): Promise<{ stepKey: string; answer: string }> {
    return apiFetch<{ stepKey: string; answer: string }>(`/api/v1/rooms/${roomId}/plan/steps/${stepKey}/generate`, {
      method: 'POST',
    });
  },

  async downloadContext(roomId: string, stepKey: string): Promise<void> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const res = await fetch(`${baseUrl}/api/v1/rooms/${roomId}/plan/context.md?step=${stepKey}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Failed to download context.md');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'context.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async enterBuild(roomId: string): Promise<void> {
    await apiFetch<void>(`/api/v1/rooms/${roomId}/stage/enter-build`, { method: 'POST' });
  },

  async unlockBuild(roomId: string): Promise<void> {
    await apiFetch<void>(`/api/v1/rooms/${roomId}/stage/unlock-build`, { method: 'POST' });
  },
};
