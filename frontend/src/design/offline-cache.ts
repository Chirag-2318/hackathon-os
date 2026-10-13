import { useEffect, useState } from 'react';
import { toast } from './components/toast';

const DB_NAME = 'hackathon_os_cache';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('room_cache')) {
        db.createObjectStore('room_cache', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('docs_cache')) {
        db.createObjectStore('docs_cache', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache room summary in IndexedDB
 */
export async function saveCachedRoom(roomId: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('room_cache', 'readwrite');
    tx.objectStore('room_cache').put({ id: roomId, data, savedAt: Date.now() });
  } catch (err) {
    console.warn('[IndexedDB] Could not cache room:', err);
  }
}

/**
 * Retrieve cached room from IndexedDB
 */
export async function getCachedRoom(roomId: string): Promise<{ data: any; savedAt: number } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('room_cache', 'readonly');
      const req = tx.objectStore('room_cache').get(roomId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Cache room docs in IndexedDB
 */
export async function saveCachedDocs(roomId: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('docs_cache', 'readwrite');
    tx.objectStore('docs_cache').put({ id: roomId, data, savedAt: Date.now() });
  } catch (err) {
    console.warn('[IndexedDB] Could not cache docs:', err);
  }
}

/**
 * Retrieve cached docs from IndexedDB
 */
export async function getCachedDocs(roomId: string): Promise<{ data: any; savedAt: number } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('docs_cache', 'readonly');
      const req = tx.objectStore('docs_cache').get(roomId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Hook detecting offline network status with quiet reconnect toast
 */
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
      toast.info('You’re back online. Reconnected to live server.', { duration: 3000 });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return isOffline;
}
