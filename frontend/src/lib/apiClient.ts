export interface FieldErrors {
  [field: string]: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: FieldErrors;
  details?: any;

  constructor(status: number, message: string = 'Request failed', code: string = 'UNKNOWN', fieldErrors?: FieldErrors, details?: any) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'UNKNOWN';
    this.fieldErrors = fieldErrors;
    this.details = details;
  }
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

import { isSampleRoomTarget, handleSampleRoomRequest } from '@/tour/guided/sample-room-adapter';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined
  ? import.meta.env.VITE_API_BASE_URL
  : (import.meta.env.DEV ? (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8080' : 'http://localhost:8080') : '');
const BASE_URL = API_BASE_URL;

export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (isSampleRoomTarget(path)) {
    return handleSampleRoomRequest<T>(path, options);
  }
  const method = (options.method ?? 'GET').toUpperCase();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken) {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http') ? path : `${BASE_URL}${normalizedPath}`;

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
    console.error(`[apiClient fetch error] ${method} ${url}:`, err);
    throw new ApiError(0, `Network error (${err?.message || 'Please check your connection and retry.'})`, 'NETWORK_ERROR');
  }

  if (res.status === 401) {
    let body: any = {};
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try {
        body = await res.clone().json();
      } catch {}
    }
    if (body?.code === 'GITHUB_TOKEN_INVALID') {
      throw new ApiError(401, body.message || "The server's GitHub token is invalid. Check APP_GITHUB_TOKEN in .env.", 'GITHUB_TOKEN_INVALID');
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
    throw new ApiError(401, body?.message || 'Authentication required', body?.code || 'UNAUTHORIZED');
  }

  // Automatic retry on 403 CSRF token refresh
  if (res.status === 403 && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !headers['X-CSRF-RETRIED']) {
    const freshToken = getCookie('XSRF-TOKEN');
    if (freshToken) {
      return apiClient<T>(path, {
        ...options,
        headers: {
          ...headers,
          'X-XSRF-TOKEN': freshToken,
          'X-CSRF-RETRIED': 'true',
        },
      });
    }
  }

  if (!res.ok) {
    let body: any = {};
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

    const message = body?.message || body?.detail || (res.status === 429 ? 'Too many attempts, try again in a few minutes' : 'Request failed');
    const code = body?.code || 'UNKNOWN';
    const fieldErrors = body?.fieldErrors;
    const details = body?.details;

    throw new ApiError(res.status, message, code, fieldErrors, details);
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
