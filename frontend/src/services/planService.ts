/**
 * planService.ts — Plan steps, validation pipeline, and stage advancing calling backend API directly.
 */
import { apiFetch } from '@/api/client';
import { API_BASE_URL } from '@/lib/apiClient';
import type { PlanData, PlanState } from './types';

export type PrepareStageState = 'PENDING' | 'RUNNING' | 'DONE' | 'SKIPPED' | 'FALLBACK';

export interface PrepareStage {
  key: string;
  label: string;
  state: PrepareStageState;
  detail?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface PlanPrepareFacts {
  rubricCriterionNames?: string[];
  teamHandles?: string[];
  teamRoleTags?: string[];
  approvedIdeaTitles?: string[];
  mode?: 'BUILD_OUT' | 'BALANCED';
  verdict?: string;
  ideaVerdict?: string;
  ideaVerdictScore?: number;
  ideaVerdictSentence?: string;
}

export interface PlanPrepareStatus {
  jobId: string;
  status: 'QUEUED' | 'RUNNING' | 'READY' | 'PARTIAL' | 'FALLBACK' | 'FAILED';
  startedAt?: string;
  stages: PrepareStage[];
  facts: PlanPrepareFacts;
  mode?: string;
  verdict?: string;
  analysisState?: 'READY' | 'FALLBACK' | 'PENDING';
}

export interface StepPrepareResponse {
  status: 'QUEUED' | 'RUNNING' | 'READY' | 'FALLBACK' | 'FAILED';
  jobId: string;
}

export interface ValidationIssue {
  severity: 'BLOCK' | 'WARN';
  code: string;
  file?: string;
  line?: number;
  message: string;
  expected?: string;
  found?: string;
}

export interface ValidatedFile {
  name: string;
  chars: number;
  detectedAs?: string;
  sections?: string[];
}

export interface ValidationResult {
  ok?: boolean;
  valid: boolean;
  needsConfirmation?: boolean;
  files?: ValidatedFile[];
  issues?: ValidationIssue[] | string[];
  errors?: string[];
  warnings?: string[];
  summary?: string;
  repairPrompt?: string;
  nextStepKey?: string;
  planComplete?: boolean;
  completion?: any;
  diagnostics?: any;
  validatedWithOverrides?: boolean;
}

export interface StepPromptResponse {
  prompt: string;
  charCount: number;
  mode: string;
  ideaVerdict?: string;
  missingInputs: string[];
  stale: boolean;
  generatedAt: string;
  analysisState?: 'READY' | 'FALLBACK' | 'PENDING';
  ready?: boolean;
  outputFiles?: string[];
  bundleName?: string;
}

export const planService = {
  async prepareStep(roomId: string, stepIndex: number): Promise<StepPrepareResponse> {
    return apiFetch<StepPrepareResponse>(`/api/v1/rooms/${roomId}/plan/steps/${stepIndex}/prepare`, {
      method: 'POST',
    });
  },

  async getStepPrepareStatusWithEtag(
    roomId: string,
    stepIndex: number,
    etag?: string
  ): Promise<{ data?: PlanPrepareStatus; notModified: boolean; etag?: string }> {
    const baseUrl = API_BASE_URL;
    const headers: Record<string, string> = {};
    if (etag) {
      headers['If-None-Match'] = etag;
    }
    const res = await fetch(`${baseUrl}/api/v1/rooms/${roomId}/plan/steps/${stepIndex}/prepare/status`, {
      credentials: 'include',
      headers,
    });
    const newEtag = res.headers.get('ETag') || undefined;
    if (res.status === 304) {
      return { notModified: true, etag: newEtag || etag };
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch step prepare status: ${res.statusText}`);
    }
    const data = (await res.json()) as PlanPrepareStatus;
    return { data, notModified: false, etag: newEtag };
  },

  async prefetchNext(roomId: string, stepIndex: number): Promise<StepPrepareResponse> {
    return apiFetch<StepPrepareResponse>(`/api/v1/rooms/${roomId}/plan/steps/${stepIndex}/prefetch-next`, {
      method: 'POST',
    });
  },

  async preparePlan(roomId: string): Promise<PlanPrepareStatus> {
    return apiFetch<PlanPrepareStatus>(`/api/v1/rooms/${roomId}/plan/prepare`, {
      method: 'POST',
    });
  },

  async getPrepareStatus(roomId: string): Promise<PlanPrepareStatus> {
    return apiFetch<PlanPrepareStatus>(`/api/v1/rooms/${roomId}/plan/prepare/status`);
  },

  async getPlan(roomId: string): Promise<PlanData> {
    return apiFetch<PlanData>(`/api/v1/rooms/${roomId}/plan`);
  },

  async startPlan(roomId: string): Promise<void> {
    await apiFetch<void>(`/api/v1/rooms/${roomId}/plan/start`, { method: 'POST' });
  },

  async updatePlanNotes(roomId: string, notes: string): Promise<void> {
    await apiFetch<void>(`/api/v1/rooms/${roomId}/plan/notes`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
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

  async validateStepFiles(
    roomId: string,
    stepIndex: number,
    files: File[],
    confirm?: boolean,
    override?: boolean
  ): Promise<ValidationResult> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const params = new URLSearchParams();
    if (confirm) params.set('confirm', 'true');
    if (override) params.set('override', 'true');
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await apiFetch<any>(
      `/api/v1/rooms/${roomId}/plan/steps/${stepIndex}/validate${qs}`,
      {
        method: 'POST',
        body: formData,
      }
    );
    const issues: ValidationIssue[] = res.issues || [];
    const blockErrors = issues.filter((i) => i.severity === 'BLOCK').map((i) => i.message);
    const warnMessages = issues.filter((i) => i.severity === 'WARN').map((i) => i.message);
    return {
      ok: res.ok ?? res.valid ?? false,
      valid: res.ok ?? res.valid ?? false,
      needsConfirmation: res.needsConfirmation,
      files: res.files || [],
      issues,
      errors: res.errors && res.errors.length > 0 ? res.errors : blockErrors,
      warnings: res.warnings && res.warnings.length > 0 ? res.warnings : warnMessages,
      summary: res.summary,
      repairPrompt: res.repairPrompt,
      nextStepKey: res.nextStepKey,
      planComplete: res.planComplete,
      completion: res.completion,
      diagnostics: res.diagnostics,
      validatedWithOverrides: res.validatedWithOverrides,
    };
  },

  async validateStepText(
    roomId: string,
    stepIndex: number,
    text: string,
    confirm?: boolean
  ): Promise<ValidationResult> {
    const res = await apiFetch<any>(
      `/api/v1/rooms/${roomId}/plan/steps/${stepIndex}/validate${confirm ? '?confirm=true' : ''}`,
      {
        method: 'POST',
        body: JSON.stringify({ text, confirm: !!confirm }),
      }
    );
    const issues: ValidationIssue[] = res.issues || [];
    const blockErrors = issues.filter((i) => i.severity === 'BLOCK').map((i) => i.message);
    const warnMessages = issues.filter((i) => i.severity === 'WARN').map((i) => i.message);
    return {
      ok: res.ok ?? res.valid ?? false,
      valid: res.ok ?? res.valid ?? false,
      needsConfirmation: res.needsConfirmation,
      files: res.files || [],
      issues,
      errors: res.errors && res.errors.length > 0 ? res.errors : blockErrors,
      warnings: res.warnings && res.warnings.length > 0 ? res.warnings : warnMessages,
      summary: res.summary,
      repairPrompt: res.repairPrompt,
      nextStepKey: res.nextStepKey,
      planComplete: res.planComplete,
      completion: res.completion,
    };
  },

  async validateStep(
    roomId: string,
    stepKey: string,
    answer: string
  ): Promise<ValidationResult> {
    const STEP_KEYS = ['prd', 'tech', 'phases', 'tasks', 'demo'];
    const idx = STEP_KEYS.indexOf(stepKey.toLowerCase());
    const stepIndex = idx >= 0 ? idx + 1 : 1;
    return this.validateStepText(roomId, stepIndex, answer);
  },

  async generateStep(roomId: string, stepKey: string): Promise<{ stepKey: string; answer: string }> {
    return apiFetch<{ stepKey: string; answer: string }>(`/api/v1/rooms/${roomId}/plan/steps/${stepKey}/generate`, {
      method: 'POST',
    });
  },

  async downloadContext(roomId: string, stepKey: string): Promise<void> {
    const baseUrl = API_BASE_URL;
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

  async getStepPrompt(roomId: string, stepNumber: number): Promise<StepPromptResponse> {
    return apiFetch<StepPromptResponse>(`/api/v1/rooms/${roomId}/plan/steps/${stepNumber}/prompt`);
  },

  async refreshStepPrompt(roomId: string, stepNumber: number): Promise<StepPromptResponse> {
    return apiFetch<StepPromptResponse>(`/api/v1/rooms/${roomId}/plan/steps/${stepNumber}/prompt/refresh`, { method: 'POST' });
  },
};
