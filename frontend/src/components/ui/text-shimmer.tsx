import React from 'react';
import { cn } from '@/lib/utils';

export interface TextShimmerProps {
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export function TextShimmer({ children, duration = 1.5, className }: TextShimmerProps) {
  return (
    <span
      className={cn(
        'inline-block bg-[linear-gradient(110deg,#a1a1aa,45%,#ffffff,55%,#a1a1aa)] dark:bg-[linear-gradient(110deg,#71717a,45%,#ffffff,55%,#71717a)] bg-[length:250%_100%] bg-clip-text text-transparent animate-shimmer select-none font-medium text-xs',
        className
      )}
      style={{
        animationDuration: `${duration}s`,
      }}
    >
      {children}
    </span>
  );
}
