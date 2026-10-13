import React from 'react';
import {
  Tooltip as RadixTooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

export interface SimpleTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
}

/**
 * Convenient Tooltip component with accessible keyboard focus and hover triggers.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delayDuration = 200,
}: SimpleTooltipProps) {
  if (!content) return children;

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <RadixTooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} align={align} className="text-xs py-1 px-2.5 bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-md rounded-[6px]">
          {content}
        </TooltipContent>
      </RadixTooltip>
    </TooltipProvider>
  );
}

export { TooltipProvider, TooltipTrigger, TooltipContent, RadixTooltip };
