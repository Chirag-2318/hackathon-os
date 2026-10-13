import React from 'react';
import { cn } from '@/lib/utils';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: React.ReactNode;
}

/**
 * Divider component with horizontal/vertical orientations and optional centered label.
 */
export function Divider({
  orientation = 'horizontal',
  label,
  className,
  ...props
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('inline-block h-full w-[1px] bg-zinc-200 self-stretch dark:bg-zinc-800', className)}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={cn('flex items-center gap-3 my-3', className)}
        {...props}
      >
        <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-xs text-zinc-500 font-medium select-none dark:text-zinc-400">
          {label}
        </span>
        <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn('h-[1px] w-full bg-zinc-200 my-2 dark:bg-zinc-800', className)}
      {...props}
    />
  );
}
