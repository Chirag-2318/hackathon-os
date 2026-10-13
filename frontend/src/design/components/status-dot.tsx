import React from 'react';
import { cn } from '@/lib/utils';

export type StatusDotVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface StatusDotProps {
  /** Color variant of the dot */
  variant?: StatusDotVariant;
  /** Whether the dot pulses */
  pulse?: boolean;
  /** Custom className */
  className?: string;
  /** Accessible label */
  label?: string;
}

/**
 * StatusDot component with semantic colors and optional subtle pulsing ping animation.
 */
export function StatusDot({
  variant = 'neutral',
  pulse = false,
  className,
  label,
}: StatusDotProps) {
  const dotColor: Record<StatusDotVariant, string> = {
    neutral: 'bg-zinc-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
  };

  return (
    <span
      className={cn('relative inline-flex items-center justify-center shrink-0 h-2 w-2', className)}
      role="status"
      aria-label={label}
    >
      {pulse && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
            dotColor[variant]
          )}
        />
      )}
      <span className={cn('relative inline-flex rounded-full h-2 w-2', dotColor[variant])} />
    </span>
  );
}
