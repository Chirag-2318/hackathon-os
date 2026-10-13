import React from 'react';
import { cn } from '@/lib/utils';

export type SkeletonVariant = 'text' | 'avatar' | 'card' | 'row';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  count?: number;
}

/**
 * Skeleton loading placeholder with subtle pulse shimmer matching final page layouts.
 */
export function Skeleton({
  variant = 'text',
  count = 1,
  className,
  ...props
}: SkeletonProps) {
  const baseShimmer = 'animate-pulse bg-zinc-200/80 dark:bg-zinc-800/80';

  const renderSingle = (key?: number) => {
    switch (variant) {
      case 'avatar':
        return (
          <div
            key={key}
            className={cn(baseShimmer, 'h-9 w-9 rounded-full shrink-0', className)}
            {...props}
          />
        );
      case 'card':
        return (
          <div
            key={key}
            className={cn(baseShimmer, 'h-32 w-full rounded-[10px] p-4', className)}
            {...props}
          />
        );
      case 'row':
        return (
          <div
            key={key}
            className={cn(
              'flex items-center gap-3 w-full py-2.5 px-3 rounded-[8px] border border-zinc-100 dark:border-zinc-800/60',
              className
            )}
            {...props}
          >
            <div className={cn(baseShimmer, 'h-8 w-8 rounded-full shrink-0')} />
            <div className="flex-1 space-y-1.5">
              <div className={cn(baseShimmer, 'h-3.5 w-1/3 rounded-[4px]')} />
              <div className={cn(baseShimmer, 'h-3 w-2/3 rounded-[4px]')} />
            </div>
            <div className={cn(baseShimmer, 'h-6 w-16 rounded-[4px]')} />
          </div>
        );
      case 'text':
      default:
        return (
          <div
            key={key}
            className={cn(baseShimmer, 'h-4 w-full rounded-[4px]', className)}
            {...props}
          />
        );
    }
  };

  if (count > 1) {
    return (
      <div className="flex flex-col gap-2.5 w-full">
        {Array.from({ length: count }).map((_, idx) => renderSingle(idx))}
      </div>
    );
  }

  return renderSingle();
}
