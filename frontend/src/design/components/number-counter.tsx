import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface NumberCounterProps {
  value: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Animated number counter with smooth interpolation, mono digits, and tabular-nums.
 */
export function NumberCounter({
  value,
  durationMs = 400,
  prefix = '',
  suffix = '',
  className,
}: NumberCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const startValue = displayValue;
    const diff = value - startValue;
    if (diff === 0) return;

    const startTime = performance.now();

    const frame = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // easeOutQuad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(startValue + diff * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setDisplayValue(value);
      }
    };

    const animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [value, durationMs]);

  return (
    <span className={cn('font-mono tabular-nums inline-block', className)}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
