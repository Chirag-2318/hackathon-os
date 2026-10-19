import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AheadBehindBarProps {
  role: string;
  ahead?: number | null;
  behind?: number | null;
}

export function AheadBehindBar({ role, ahead, behind }: AheadBehindBarProps) {
  if (role === 'main') {
    return (
      <span className="h-5 px-2 rounded-full bg-muted/60 text-muted-foreground text-[11px] font-medium inline-flex items-center">
        Synced
      </span>
    );
  }

  if (ahead == null || behind == null || ahead < 0 || behind < 0) {
    return (
      <span className="text-[11px] text-muted-foreground font-mono tabular-nums px-1">
        —
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-help">
          {/* Ahead (Green) */}
          <div className="flex items-center gap-1">
            <div
              className="h-2 rounded-full bg-emerald-500"
              style={{ width: `${Math.min(20, Math.max(4, ahead * 3))}px` }}
            />
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
              +{ahead}
            </span>
          </div>
          {/* Behind (Red) */}
          <div className="flex items-center gap-1">
            <div
              className="h-2 rounded-full bg-rose-500"
              style={{ width: `${Math.min(20, Math.max(4, behind * 3))}px` }}
            />
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
              -{behind}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {ahead} commits ahead of main, {behind} behind
      </TooltipContent>
    </Tooltip>
  );
}
