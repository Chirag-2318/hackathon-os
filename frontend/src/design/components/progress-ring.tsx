import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressRingProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'brand' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
}

/**
 * ProgressRing component with SVG stroke animation and optional centered text.
 */
export function ProgressRing({
  value = 0,
  size = 36,
  strokeWidth = 3,
  variant = 'brand',
  showLabel = false,
  className,
  ...props
}: ProgressRingProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedValue / 100) * circumference;

  const colorMap: Record<string, string> = {
    brand: 'text-indigo-600',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-rose-500',
  };

  return (
    <div
      className={cn('relative inline-flex items-center justify-center shrink-0', className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-zinc-200 dark:text-zinc-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn('transition-all duration-500 ease-out', colorMap[variant])}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-[10px] font-mono font-semibold text-zinc-700 dark:text-zinc-300">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}
