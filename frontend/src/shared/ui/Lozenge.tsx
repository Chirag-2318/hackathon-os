import type { HTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LozengeVariant = 'neutral' | 'success' | 'warn' | 'custom';

export interface LozengeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: LozengeVariant;
  icon?: LucideIcon;
  iconNode?: ReactNode;
  children: ReactNode;
}

export function Lozenge({
  variant = 'neutral',
  icon: Icon,
  iconNode,
  children,
  className,
  ...props
}: LozengeProps) {
  const variantClasses =
    variant === 'neutral'
      ? 'bg-shell border border-border text-ink-2'
      : variant === 'success'
      ? 'bg-success-bg text-success-fg'
      : variant === 'warn'
      ? 'bg-warn-bg text-warn-fg'
      : '';

  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-[var(--r-tag)] px-2 text-xs font-medium whitespace-nowrap',
        variantClasses,
        className
      )}
      {...props}
    >
      {Icon && <Icon className="size-3 shrink-0" strokeWidth={1.75} />}
      {iconNode}
      <span>{children}</span>
    </span>
  );
}
