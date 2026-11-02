import {
  BackendHttpError,
  BackendErrorResponse,
  BackendErrorResponseSchema,
  BackendRoom,
  BackendRoomSchema,
  BackendStep,
  BackendStepSchema,
  BackendStepBrief,
  BackendStepBriefSchema,
  BackendSubmitResponse,
  BackendSubmitResponseSchema,
  StepKey,
} from './types.js';
import { z } from 'zod';

export type BackendClient = {
  listRooms(toolName?: string): Promise<BackendRoom[]>;
  getPlanSteps(roomId: string, toolName?: string): Promise<BackendStep[]>;
  getStepBrief(roomId: string, step: StepKey, toolName?: string): Promise<BackendStepBrief>;
  submitStep(
    roomId: string,
    step: StepKey,
    body: { text: string; confirm?: boolean; override?: boolean },
    toolName?: string
  ): Promise<BackendSubmitResponse>;
};

export type FetchFunction = typeof fetch;

export function createBackendClient(
  token: string,
  baseUrl: string,
  requestId: string,
  fetchFn: FetchFunction = fetch
): BackendClient {
  const cleanBase = baseUrl.replace(/\/+$/, '');

  async function requestWithRetry<T>(
    endpoint: string,
    options: RequestInit,
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
    toolName: string
  ): Promise<T> {
    const isGet = options.method === 'GET' || !options.method;
    const url = `${cleanBase}${endpoint}`;

    let lastError: Error | null = null;
    const maxAttempts = isGet ? 2 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const startTime = Date.now();
      let status: number | string = 'network_error';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'X-Request-Id': requestId,
          ...(options.headers as Record<string, string> | undefined),
        };

        const response = await fetchFn(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        status = response.status;
        const duration = Date.now() - startTime;

        // Log sanitized operational metadata only: requestId, toolName, backend status, duration
        console.log(
          JSON.stringify({
            requestId,
            tool: toolName,
            status,
            durationMs: duration,
            attempt,
          })
        );

        if (!response.ok) {
          let errorPayload: BackendErrorResponse | undefined;
          let code = `HTTP_${response.status}`;
          let message = response.statusText || `Backend responded with HTTP ${response.status}`;

          try {
            const rawJson = await response.json();
            const parsed = BackendErrorResponseSchema.safeParse(rawJson);
            if (parsed.success) {
              errorPayload = parsed.data;
              code = errorPayload.code;
              message = errorPayload.message;
            }
          } catch {
            // Non-JSON error body fallback
          }

          const httpError = new BackendHttpError(response.status, code, message, errorPayload);

          // Retry condition for GET only: 502 or 503
          if (isGet && attempt < maxAttempts && (response.status === 502 || response.status === 503)) {
            lastError = httpError;
            continue;
          }

          throw httpError;
        }

        const data = await response.json();
        return schema.parse(data);
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        if (err instanceof BackendHttpError) {
          throw err;
        }

        const error = err instanceof Error ? err : new Error(String(err));
        lastError = error;

        console.log(
          JSON.stringify({
            requestId,
            tool: toolName,
            status: error.name === 'AbortError' ? 'timeout' : 'error',
            durationMs: duration,
            attempt,
          })
        );

        // Retry condition for GET only: network errors or timeouts
        if (isGet && attempt < maxAttempts) {
          continue;
        }

        if (error.name === 'AbortError') {
          throw new BackendHttpError(
            504,
            'TIMEOUT',
            'Backend request timed out after 60 seconds (Render cold start or service unresponsive).'
          );
        }

        throw new BackendHttpError(
          503,
          'NETWORK_ERROR',
          `Network error connecting to backend: ${error.message}`
        );
      }
    }

    throw lastError || new BackendHttpError(500, 'UNKNOWN_ERROR', 'Unknown backend client error');
  }

  return {
    async listRooms(toolName = 'list_rooms'): Promise<BackendRoom[]> {
      return requestWithRetry(
        '/api/v1/mcp/rooms',
        { method: 'GET' },
        z.array(BackendRoomSchema),
        toolName
      );
    },

    async getPlanSteps(roomId: string, toolName = 'get_plan_steps'): Promise<BackendStep[]> {
      return requestWithRetry(
        `/api/v1/mcp/rooms/${encodeURIComponent(roomId)}/steps`,
        { method: 'GET' },
        z.array(BackendStepSchema),
        toolName
      );
    },

    async getStepBrief(
      roomId: string,
      step: StepKey,
      toolName = 'get_step_brief'
    ): Promise<BackendStepBrief> {
      return requestWithRetry(
        `/api/v1/mcp/rooms/${encodeURIComponent(roomId)}/steps/${encodeURIComponent(step)}/brief`,
        { method: 'GET' },
        BackendStepBriefSchema,
        toolName
      );
    },

    async submitStep(
      roomId: string,
      step: StepKey,
      body: { text: string; confirm?: boolean; override?: boolean },
      toolName = 'submit_step_document'
    ): Promise<BackendSubmitResponse> {
      return requestWithRetry(
        `/api/v1/mcp/rooms/${encodeURIComponent(roomId)}/steps/${encodeURIComponent(step)}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        BackendSubmitResponseSchema,
        toolName
      );
    },
  };
}
