/**
 * Shared primitive: Pill
 * Fully round pill badge/chip. Variants: default, success, warn, danger.
 */
import * as React from 'react';
import { cn } from 'cn';

interface PillProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warn' | 'danger' | 'neutral';
  className?: string;
}

const variantMap = {
  default: 'bg-active text-ink-2 border border-border',
  neutral: 'bg-active text-ink-2 border border-border',
  success: 'bg-success-bg text-success-fg',
  warn:    'bg-warn-bg text-warn-fg',
  danger:  'bg-danger text-on-danger',
};

export function Pill({ children, variant = 'default', className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold leading-none tabular-nums',
        variantMap[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
