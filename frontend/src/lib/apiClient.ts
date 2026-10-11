export interface FieldErrors {
  [field: string]: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  fieldErrors?: FieldErrors;
  details?: any;

  constructor(status: number, message: string, code?: string, fieldErrors?: FieldErrors, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.details = details;
  }
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
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

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (err: any) {
    throw new ApiError(0, 'Network error. Please check your connection and retry.');
  }

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
    throw new ApiError(401, 'Authentication required', 'UNAUTHORIZED');
  }

  if (!res.ok) {
    let body: any = {};
    try {
      body = await res.json();
    } catch {
      body = { message: res.statusText };
    }

    const message = body.message || body.detail || (res.status === 429 ? 'Too many attempts, try again in a few minutes' : 'Request failed');
    const code = body.code;
    const fieldErrors = body.fieldErrors;
    const details = body.details;

    throw new ApiError(res.status, message, code, fieldErrors, details);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/markdown') || contentType.includes('text/plain')) {
    return (await res.text()) as unknown as T;
  }

  return res.json();
}
