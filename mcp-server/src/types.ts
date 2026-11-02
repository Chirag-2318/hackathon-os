import { z } from 'zod';

export const StepKeySchema = z.enum(['prd', 'tech', 'phases', 'tasks', 'demo']);
export type StepKey = z.infer<typeof StepKeySchema>;

export const BackendRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  stage: z.string(),
  role: z.string(),
});
export type BackendRoom = z.infer<typeof BackendRoomSchema>;

export const BackendStepSchema = z.object({
  number: z.number(),
  key: z.string(),
  title: z.string(),
  expectedFiles: z.array(z.string()),
  status: z.string(),
});
export type BackendStep = z.infer<typeof BackendStepSchema>;

export const BackendStepBriefSchema = z.object({
  step: z.string(),
  expectedFiles: z.array(z.string()),
  prompt: z.string(),
  context: z.string(),
  webUrl: z.string(),
});
export type BackendStepBrief = z.infer<typeof BackendStepBriefSchema>;

export const BackendSubmitIssueSchema = z.object({
  severity: z.string(),
  code: z.string(),
  file: z.string().nullable().optional(),
  line: z.number().nullable().optional(),
  message: z.string(),
  expected: z.string().nullable().optional(),
  found: z.string().nullable().optional(),
});
export type BackendSubmitIssue = z.infer<typeof BackendSubmitIssueSchema>;

export const BackendSubmitResponseSchema = z.object({
  ok: z.boolean(),
  valid: z.boolean(),
  issues: z.array(BackendSubmitIssueSchema).optional().default([]),
  errors: z.array(z.string()).optional().default([]),
  warnings: z.array(z.string()).optional().default([]),
  repairPrompt: z.string().nullable().optional(),
  needsConfirmation: z.boolean().optional().default(false),
  webUrl: z.string(),
});
export type BackendSubmitResponse = z.infer<typeof BackendSubmitResponseSchema>;

export const BackendErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  requestId: z.string().optional(),
  timestamp: z.string().optional(),
  status: z.number().optional(),
});
export type BackendErrorResponse = z.infer<typeof BackendErrorResponseSchema>;

export class BackendHttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errorResponse?: BackendErrorResponse;

  constructor(status: number, code: string, message: string, errorResponse?: BackendErrorResponse) {
    super(message);
    this.name = 'BackendHttpError';
    this.status = status;
    this.code = code;
    this.errorResponse = errorResponse;
  }
}
