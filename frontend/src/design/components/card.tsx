import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type CardVariant = 'flat' | 'raised' | 'interactive';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant: flat border, raised shadow, or interactive with hover lift */
  variant?: CardVariant;
  /** Custom padding option: none, sm (12px), md (16px), lg (24px) */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Card container component with flat, raised, and interactive variants.
 * Interactive variant lifts 2px with soft layered shadow and keyboard focus ring.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    children,
    className,
    variant = 'flat',
    padding = 'md',
    tabIndex,
    ...props
  },
  ref
) {
  const baseStyles = 'rounded-[10px] bg-white border border-zinc-200 transition-all duration-150 dark:bg-zinc-900 dark:border-zinc-800';

  const variantStyles: Record<CardVariant, string> = {
    flat: 'shadow-none',
    raised: 'shadow-xs border-zinc-200/80',
    interactive:
      'cursor-pointer hover:-translate-y-[2px] hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
  };

  const paddingStyles: Record<string, string> = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      ref={ref}
      tabIndex={variant === 'interactive' ? tabIndex ?? 0 : tabIndex}
      className={cn(baseStyles, variantStyles[variant], paddingStyles[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
});
