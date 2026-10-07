/**
 * useIsOnline — returns true when navigator.onLine is true.
 * Subscribes to online/offline events.
 * Used by S23 and S24 for offline banner [D §9].
 */
import { useState, useEffect } from 'react';

export function useIsOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}
