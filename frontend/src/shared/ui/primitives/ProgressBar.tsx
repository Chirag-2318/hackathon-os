/**
 * Shared primitive: ProgressBar
 * 6px tall, radius pill, track = --border, fill = --ink by default.
 * Width animates with CSS transition on the fill element.
 */
import * as React from 'react';
import { cn } from 'cn';

interface ProgressBarProps {
  percent: number;
  className?: string;
  fillClassName?: string;
}

export function ProgressBar({ percent, className, fillClassName }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={cn('h-1 w-full rounded-full bg-border overflow-hidden', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full bg-ink transition-[width] duration-300', fillClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
