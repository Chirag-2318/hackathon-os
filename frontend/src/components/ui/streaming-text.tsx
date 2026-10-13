import React from 'react';
import { cn } from '@/lib/utils';

export interface StreamingTextProps {
  children: string;
  className?: string;
  cursor?: boolean;
}

export function StreamingText({ children, className, cursor = true }: StreamingTextProps) {
  return (
    <span className={cn('inline font-sans text-sm text-foreground leading-relaxed', className)}>
      {children}
      {cursor && (
        <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-indigo-500 animate-pulse rounded-xs" />
      )}
    </span>
  );
}
