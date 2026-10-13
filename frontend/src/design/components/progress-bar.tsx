import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  /** Value between 0 and 100 */
  value: number;
  /** Maximum value, defaults to 100 */
  max?: number;
  /** Whether to render as segmented steps */
  segments?: number;
  /** Current completed segment index (1-based) if segmented */
  currentSegment?: number;
  /** Size/height */
  size?: 'sm' | 'md' | 'lg';
  /** Optional marker position (0-100) such as feature freeze */
  markerPercent?: number;
  /** Marker label */
  markerLabel?: string;
  /** Color variant */
  variant?: 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
}

/**
 * ProgressBar supporting both continuous animated progress and discrete segmented steps,
 * with optional freeze/milestone marker ticks.
 */
export function ProgressBar({
  value,
  max = 100,
  segments,
  currentSegment,
  size = 'md',
  markerPercent,
  markerLabel,
  variant = 'brand',
  className,
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const heightStyles: Record<string, string> = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const fillColors: Record<string, string> = {
    brand: 'bg-indigo-600',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  };

  if (segments && segments > 1) {
    const activeCount = currentSegment ?? Math.round((percent / 100) * segments);

    return (
      <div className={cn('flex items-center gap-1.5 w-full', className)}>
        {Array.from({ length: segments }).map((_, idx) => {
          const isFilled = idx < activeCount;
          const isCurrent = idx === activeCount - 1;
          return (
            <div
              key={idx}
              className={cn(
                'flex-1 rounded-full transition-all duration-300',
                heightStyles[size],
                isFilled
                  ? isCurrent && variant === 'brand'
                    ? 'bg-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-900'
                    : fillColors[variant]
                  : 'bg-zinc-200 dark:bg-zinc-800'
              )}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('relative w-full', className)}>
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800',
          heightStyles[size]
        )}
      >
        <div
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            fillColors[variant]
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {typeof markerPercent === 'number' && (
        <div
          className="absolute -top-1 bottom-0 flex flex-col items-center pointer-events-none"
          style={{ left: `${Math.min(99, Math.max(1, markerPercent))}%` }}
        >
          <div className="w-0.5 h-4 bg-amber-500 shadow-xs rounded-full" />
          {markerLabel && (
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-1 whitespace-nowrap">
              {markerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
