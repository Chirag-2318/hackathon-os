import { toast } from './components/toast';

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

  constructor(status: number, message = 'Request failed', code = 'UNKNOWN', details?: any, requestId?: string, fieldErrors?: Record<string, string>) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'UNKNOWN';
    this.details = details;
    this.requestId = requestId;
    this.fieldErrors = fieldErrors;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

import { API_BASE_URL } from '@/lib/apiClient';
export { API_BASE_URL };

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
    toast.warning(retryMessage);

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

    const message = body.message || 'Request failed';
    const code = body.code || `HTTP_${res.status}`;

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
