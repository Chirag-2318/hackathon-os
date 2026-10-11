import { useState, useEffect } from 'react';

let serverTimeOffsetMs = 0;

export function setServerNow(serverNowIso: string) {
  try {
    const serverMs = new Date(serverNowIso).getTime();
    if (!isNaN(serverMs)) {
      serverTimeOffsetMs = serverMs - Date.now();
    }
  } catch {
    // Ignore invalid serverNow format
  }
}

export function getServerNowMs(): number {
  return Date.now() + serverTimeOffsetMs;
}

export function formatTime(
  instant: string | number | Date | null | undefined,
  userTimezone?: string
): string {
  if (!instant) return '—';
  try {
    const d = new Date(instant);
    if (isNaN(d.getTime())) return '—';
    const tz = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '—';
  }
}

export function formatTimeOnly(
  instant: string | number | Date | null | undefined,
  userTimezone?: string
): string {
  if (!instant) return '—';
  try {
    const d = new Date(instant);
    if (isNaN(d.getTime())) return '—';
    const tz = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '—';
  }
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0h 00m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}

export function useCountdown(targetInstant?: string | number | Date | null) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!targetInstant) return 0;
    const targetMs = new Date(targetInstant).getTime();
    return Math.max(0, Math.floor((targetMs - getServerNowMs()) / 1000));
  });

  useEffect(() => {
    if (!targetInstant) {
      setSecondsLeft(0);
      return;
    }
    const update = () => {
      const targetMs = new Date(targetInstant).getTime();
      const diffSec = Math.max(0, Math.floor((targetMs - getServerNowMs()) / 1000));
      setSecondsLeft(diffSec);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetInstant]);

  const formatted = formatDuration(secondsLeft);
  return { secondsLeft, formatted };
}
