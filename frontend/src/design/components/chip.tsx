import React from 'react';
import { cn } from '@/lib/utils';
import { StatusDot, type StatusDotVariant } from './status-dot';

export type ChipVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';
export type ChipSize = 'sm' | 'md';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual theme */
  variant?: ChipVariant;
  /** Size variant */
  size?: ChipSize;
  /** Whether to render a colored status dot inside the chip */
  withDot?: boolean;
  /** Optional icon */
  icon?: React.ReactNode;
}

/**
 * Chip / Badge component with neutral and semantic styling, optional status dot,
 * and high contrast AA compliance.
 */
export function Chip({
  children,
  variant = 'neutral',
  size = 'md',
  withDot = false,
  icon,
  className,
  ...props
}: ChipProps) {
  const variantStyles: Record<ChipVariant, string> = {
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
    info: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
    brand: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
  };

  const dotVariantMap: Record<ChipVariant, StatusDotVariant> = {
    neutral: 'neutral',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'info',
    brand: 'info',
  };

  const sizeStyles: Record<ChipSize, string> = {
    sm: 'text-[11px] font-medium px-2 py-0.5 rounded-[6px] gap-1.5',
    md: 'text-xs font-medium px-2.5 py-1 rounded-[6px] gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border font-mono select-none tracking-tight',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {withDot && <StatusDot variant={dotVariantMap[variant]} />}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

export const Badge = Chip;
