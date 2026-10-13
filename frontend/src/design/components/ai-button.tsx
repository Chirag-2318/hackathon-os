import React, { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button, type ButtonProps } from './button';
import { Tooltip } from './tooltip';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

export function getAiErrorMessage(code?: string, defaultMsg = 'AI request failed'): string {
  if (code === 'AI_OUTPUT_INVALID') {
    return 'The AI gave an unusable answer. Try again.';
  }
  if (code === 'AI_UNAVAILABLE') {
    return 'AI is busy right now. Try again in a moment.';
  }
  return defaultMsg;
}

export interface AiButtonProps extends Omit<ButtonProps, 'onClick'> {
  aiAllowed?: boolean;
  onClick?: () => void;
  statusLines?: string[];
  onCancel?: () => void;
}

/**
 * AI Action Button adhering to event policy constraints (aiAllowed)
 * and providing rotating status updates instead of indefinite spinners.
 */
export function AiButton({
  aiAllowed = true,
  onClick,
  onCancel,
  isLoading,
  children,
  className,
  statusLines = [
    'Analyzing context...',
    'Synthesizing output...',
    'Polishing details...',
  ],
  ...props
}: AiButtonProps) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setLineIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLineIndex((prev) => (prev + 1) % statusLines.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isLoading, statusLines]);

  if (!aiAllowed) {
    return (
      <Tooltip content="This event restricts AI use">
        <span>
          <Button
            {...props}
            disabled
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-zinc-400" />}
            className={cn('opacity-60 cursor-not-allowed', className)}
          >
            {children}
          </Button>
        </span>
      </Tooltip>
    );
  }

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2">
        <Button
          {...props}
          disabled
          leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />}
          className={cn('bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800', className)}
        >
          <span className="text-xs font-mono">{statusLines[lineIndex]}</span>
        </Button>
        {onCancel && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            className="h-8 px-2 text-zinc-500 hover:text-zinc-700"
            title="Cancel generation"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Button
      {...props}
      onClick={onClick}
      leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
      className={className}
    >
      {children}
    </Button>
  );
}

/**
 * Skeleton shown while AI is generating result with status line and Cancel option
 */
export function AiGeneratingSkeleton({
  onCancel,
  status = 'Generating with AI...',
  rows = 3,
}: {
  onCancel?: () => void;
  status?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-3 p-4 rounded-[10px] border border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>{status}</span>
        </div>
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel} className="text-xs h-6 px-2">
            Cancel
          </Button>
        )}
      </div>
      <div className="space-y-2 pt-1">
        <Skeleton variant="text" count={rows} />
      </div>
    </div>
  );
}
