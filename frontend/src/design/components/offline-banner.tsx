import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOfflineStatus } from '../offline-cache';

export interface OfflineBannerProps {
  lastSavedAt?: number | null;
}

/**
 * Slim banner displayed when offline or disconnected.
 */
export function OfflineBanner({ lastSavedAt }: OfflineBannerProps) {
  const isOffline = useOfflineStatus();

  if (!isOffline) return null;

  const savedTimeText = lastSavedAt
    ? ` • Saved at ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '';

  return (
    <div
      role="status"
      className="sticky top-0 z-50 w-full bg-amber-500 text-amber-950 px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-2 shadow-xs"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>You’re offline. Showing last saved data.{savedTimeText}</span>
    </div>
  );
}
