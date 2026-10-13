import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/apiClient';

/**
 * Downloads a comprehensive offline ZIP export of all room artifacts
 * from GET /api/v1/rooms/{roomId}/export with progress toast.
 */
export async function exportRoomZip(roomId: string, roomName = 'hackathon-room'): Promise<void> {
  const toastId = toast.loading('Packaging room ZIP export…');
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/rooms/${roomId}/export`, { credentials: 'include' });
    if (!res.ok) {
      let message = 'Failed to download room export';
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const errJson = await res.json();
          message = errJson?.message || message;
        }
      } catch {}
      throw new Error(message);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanName = roomName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    a.download = `${cleanName}-export.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Room ZIP export ready', { id: toastId });
  } catch (err: any) {
    toast.error(err?.message || 'Could not export room artifacts', { id: toastId });
  }
}
