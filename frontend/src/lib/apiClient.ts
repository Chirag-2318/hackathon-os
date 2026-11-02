import { apiFetch, ApiError, API_BASE_URL } from '@/design/api';
import { isSampleRoomTarget, handleSampleRoomRequest } from '@/tour/guided/sample-room-adapter';

export type FieldErrors = Record<string, string>;
export { ApiError, API_BASE_URL };

/**
 * Thin wrapper around apiFetch preserving sample room interception
 * and full backward compatibility.
 */
export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (isSampleRoomTarget(path)) {
    return handleSampleRoomRequest<T>(path, options);
  }
  return apiFetch<T>(path, options);
}
