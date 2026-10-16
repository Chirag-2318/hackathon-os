import React from 'react';
import { useAiAction } from './use-ai-action';
import { useAiKeyDialogStore } from './use-ai-key-dialog-store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface AiGateProps {
  children: React.ReactNode;
  fallbackTooltip?: string;
  className?: string;
  asChild?: boolean;
}

/**
 * AiGate wraps any AI trigger button or control.
 * If user has no key, the button remains visible, showing a tooltip,
 * and clicking it opens the Add Key dialog in "needed" mode.
 */
export function AiGate({
  children,
  fallbackTooltip = 'Add your Groq API key to use this',
  className,
}: AiGateProps) {
  const { hasKey } = useAiAction();
  const openDialog = useAiKeyDialogStore((s) => s.openDialog);

  if (hasKey) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn('inline-flex items-center cursor-pointer', className)}
            onClickCapture={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openDialog('needed', "You haven't added your API key yet.");
            }}
          >
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{fallbackTooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
