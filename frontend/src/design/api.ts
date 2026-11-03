import { toast } from './components/toast';
import { triggerServerWaking } from '../components/ServerWakingOverlay';

export interface UnifiedErrorResponse {
  code?: string;
  message?: string;
  details?: any;
  requestId?: string;
  timestamp?: string;
  fieldErrors?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: any;
  requestId?: string;
  fieldErrors?: Record<string, string>;

  constructor(
    status: number,
    message = 'Request failed',
    code = 'UNKNOWN',
    detailsOrFieldErrors?: any,
    requestIdOrDetails?: any,
    fieldErrors?: Record<string, string>
  ) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'UNKNOWN';

    if (requestIdOrDetails && typeof requestIdOrDetails === 'object') {
      this.fieldErrors = detailsOrFieldErrors;
      this.details = requestIdOrDetails;
    } else {
      this.details = detailsOrFieldErrors;
      this.requestId = typeof requestIdOrDetails === 'string' ? requestIdOrDetails : undefined;
      this.fieldErrors = fieldErrors;
    }
  }
}

let last429ToastTime = 0;

export function showThrottled429Toast(retryAfterSeconds?: number | null) {
  const now = Date.now();
  if (now - last429ToastTime < 10_000) {
    return;
  }
  last429ToastTime = now;
  const message = retryAfterSeconds && retryAfterSeconds > 0
    ? `Too many requests. Please retry in ${retryAfterSeconds}s.`
    : 'Too many requests. Please slow down and try again.';
  toast.warning(message);
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== '')
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
  : (import.meta.env.DEV ? (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8080' : 'http://localhost:8080') : '');

export interface ApiFetchOptions extends RequestInit {
  skipRetry?: boolean;
  skipIdempotency?: boolean;
}

/**
 * Shared API client wrapper:
 * - Credentials included
 * - Unified error shape parsing ({ code, message, details, requestId })
 * - Network error retry on idempotent GET
 * - Idempotency-Key header on creates (POST/PUT)
 * - 401 redirect to sign-in preserving return path
 * - 429 rate limit toast notification
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  // Attach CSRF token if present
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }

    // Attach Idempotency-Key for creates
    if (!options.skipIdempotency && !headers['Idempotency-Key']) {
      headers['Idempotency-Key'] =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }

    // Retry idempotent GET once on network failure
    if (method === 'GET' && !options.skipRetry) {
      return apiFetch<T>(path, { ...options, skipRetry: true });
    }

    throw new ApiError(
      0,
      `Network connection error (${err?.message || 'Check your internet connection'})`,
      'NETWORK_ERROR'
    );
  }

  // Automatic retry on 403 CSRF token refresh
  if (res.status === 403 && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !headers['X-CSRF-RETRIED']) {
    const freshToken = getCookie('XSRF-TOKEN');
    if (freshToken) {
      return apiFetch<T>(path, {
        ...options,
        headers: {
          ...headers,
          'X-XSRF-TOKEN': freshToken,
          'X-CSRF-RETRIED': 'true',
        },
      });
    }
  }

  // Handle 401 Session Expired / Unauthorized
  if (res.status === 401) {
    let body: UnifiedErrorResponse = {};
    try {
      body = await res.clone().json();
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      const currentPath = window.location.pathname + window.location.search;
      if (!currentPath.includes('/login') && !currentPath.includes('/auth')) {
        const returnUrl = encodeURIComponent(currentPath);
        window.location.href = `/login?returnUrl=${returnUrl}`;
      }
    }

    throw new ApiError(
      401,
      body.message || 'Session expired. Please sign in again.',
      body.code || 'UNAUTHORIZED',
      body.details,
      body.requestId
    );
  }

  // Handle 429 Rate Limited
  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After');
    const retryMessage = retryAfter
      ? `Rate limit reached. Please retry in ${retryAfter} seconds.`
      : 'Too many requests. Please slow down and try again.';
    const retrySec = retryAfter ? parseInt(retryAfter, 10) : null;
    showThrottled429Toast(retrySec);

    throw new ApiError(429, retryMessage, 'RATE_LIMITED');
  }

  if (!res.ok) {
    let body: UnifiedErrorResponse = {};
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try {
        body = await res.json();
      } catch {
        body = { message: res.statusText };
      }
    } else {
      body = { message: res.statusText };
    }

    const code = body.code || `HTTP_${res.status}`;

    if (res.status === 502 || res.status === 504) {
      triggerServerWaking();
    }

    // Auto-retry ONCE for AI actions on SERVER_BUSY (503)
    const isAiAction = Boolean(
      headers['X-AI-ACTION'] === 'true' ||
      url.includes('/ai') ||
      url.includes('/plan/generate') ||
      url.includes('/brief/extract') ||
      url.includes('/brief/auto-extract') ||
      url.includes('/brief/images') ||
      url.includes('/pitch/deck/audit') ||
      url.includes('/pitch/deck/slides/draft') ||
      url.includes('/pitch/rehearse/audio') ||
      url.includes('/pitch/rehearse/coach') ||
      url.includes('/pitch/qa/grade') ||
      url.includes('/pitch/qa/generate') ||
      url.includes('/pitch/edit') ||
      url.includes('/docs/ask') ||
      url.includes('/diagrams/fix') ||
      url.includes('/phases/generate-tasks') ||
      url.includes('/qna/session/audio') ||
      url.includes('/qna/grade') ||
      url.includes('/qna/generate') ||
      url.includes('/readiness/simulate') ||
      url.includes('/submission/generate-draft')
    );

    if ((res.status === 503 || code === 'SERVER_BUSY') && isAiAction && !headers['X-SERVER-BUSY-RETRIED']) {
      const retryHeader = res.headers.get('Retry-After');
      const retrySec = retryHeader ? parseInt(retryHeader, 10) : (body?.details?.retryAfterSeconds ?? 5);
      const waitMs = Math.max(1, Math.min(15, isNaN(retrySec) ? 5 : retrySec)) * 1000;

      try {
        toast.info('Our AI helper is busy - trying again in a few seconds');
      } catch {}

      await new Promise(resolve => setTimeout(resolve, waitMs));

      return apiFetch<T>(path, {
        ...options,
        headers: {
          ...headers,
          'X-SERVER-BUSY-RETRIED': 'true',
        },
      });
    }

    const message = body.message || 'Request failed';

    if (code === 'LIMIT_REACHED') {
      toast.info(message);
    }

    throw new ApiError(res.status, message, code, body.details, body.requestId, body.fieldErrors);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/markdown') || contentType.includes('text/plain')) {
    return (await res.text()) as unknown as T;
  }

  const text = await res.text();
  if (!text || !text.trim()) {
    return undefined as T;
  }

  const trimmed = text.trim();
  if (
    contentType.includes('text/html') ||
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html')
  ) {
    throw new ApiError(
      res.status,
      `API returned HTML instead of JSON (${res.status} ${res.statusText})`,
      'INVALID_CONTENT_TYPE'
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch (err: any) {
    throw new ApiError(
      res.status,
      `Failed to parse response JSON: ${err?.message || 'Invalid JSON format'}`,
      'PARSE_ERROR'
    );
  }
}
