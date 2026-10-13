import React, { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface CountdownProps {
  /** Target timestamp in milliseconds (epoch) */
  targetMs?: number;
  /** Initial remaining milliseconds */
  initialRemainingMs?: number;
  /** Server timestamp (epoch ms) at the time the clock snapshot was received */
  serverNow?: number;
  /** Format: 'compact' (e.g. 14h 20m) or 'detailed' (e.g. 14h 20m 12s) */
  format?: 'compact' | 'detailed' | 'digital';
  /** Callback when time reaches zero */
  onEnd?: () => void;
  className?: string;
}

/**
 * Countdown component with mono digits, 1-second drift-corrected tick using backend serverNow,
 * and tabular-nums rendering.
 */
export function Countdown({
  targetMs,
  initialRemainingMs,
  serverNow,
  format = 'detailed',
  onEnd,
  className,
}: CountdownProps) {
  // Capture local timestamp when props arrive to compensate for clock drift
  const [mountedAt] = useState(() => Date.now());

  const calculateRemaining = () => {
    const elapsedSinceMount = Date.now() - mountedAt;

    if (typeof targetMs === 'number') {
      const estimatedServerNow = (serverNow ?? mountedAt) + elapsedSinceMount;
      return Math.max(0, targetMs - estimatedServerNow);
    }

    if (typeof initialRemainingMs === 'number') {
      return Math.max(0, initialRemainingMs - elapsedSinceMount);
    }

    return 0;
  };

  const [remainingMs, setRemainingMs] = useState(calculateRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const rem = calculateRemaining();
      setRemainingMs(rem);
      if (rem <= 0) {
        clearInterval(interval);
        onEnd?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetMs, initialRemainingMs, serverNow, mountedAt]);

  const formatted = useMemo(() => {
    const totalSecs = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    if (remainingMs <= 0) {
      return '00:00:00';
    }

    if (format === 'compact') {
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m ${seconds}s`;
    }

    if (format === 'digital') {
      const pad = (n: number) => n.toString().padStart(2, '0');
      if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    // Default 'detailed'
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${seconds.toString().padStart(2, '0')}s`);
    return parts.join(' ');
  }, [remainingMs, format]);

  return (
    <span
      className={cn(
        'font-mono tabular-nums tracking-tight font-semibold select-none',
        className
      )}
    >
      {formatted}
    </span>
  );
}
