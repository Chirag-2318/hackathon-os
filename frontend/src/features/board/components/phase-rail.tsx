import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Circle, Lock } from 'lucide-react';
import type { PhaseSummary } from '@/services/phaseService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { playSound } from '@/shared/sound/sound-effects';

import type { Task } from '@/services/types';
import { selectTaskCounts, useTaskCounts } from '../task-selectors';

export interface PhaseRailProps {
  phases: PhaseSummary[];
  selectedPhaseKey: string | null; // null for 'All'
  onSelectPhase: (phaseKey: string | null) => void;
  size?: 'default' | 'small';
  className?: string;
  tasks?: Task[];
  roomId?: string;
  rightAction?: React.ReactNode;
}

export function formatPhaseLabel(
  phase: { key: string; name: string },
  isActive: boolean
): { label: string; subName: string; tooltipText: string } {
  const cleanKey = (phase.key || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const cleanName = (phase.name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // If key and name match ignoring case and punctuation, show the name only (sentence case)
  if (cleanKey === cleanName) {
    const raw = (phase.name || phase.key || '').trim();
    const sentenceCase = raw ? raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() : '';
    return {
      label: sentenceCase,
      subName: '',
      tooltipText: sentenceCase,
    };
  }

  // For parsed phases (P1, P2): show the key, and the name only on the active pill and in tooltips
  return {
    label: phase.key,
    subName: isActive ? phase.name : '',
    tooltipText: `${phase.key}: ${phase.name}`,
  };
}

export function PhaseRail({
  phases,
  selectedPhaseKey,
  onSelectPhase,
  size = 'default',
  className,
  tasks,
  roomId,
  rightAction,
}: PhaseRailProps) {
  const isSmall = size === 'small';

  const queryCounts = useTaskCounts(tasks ? undefined : roomId);
  const counts = React.useMemo(() => (tasks ? selectTaskCounts(tasks) : queryCounts), [tasks, queryCounts]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn('w-full flex items-center justify-between gap-2 h-10 select-none', className)}>
        <div
          className={cn(
            'flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar h-full py-0.5',
            isSmall ? 'text-xs' : 'text-sm'
          )}
        >
          {/* 'All' option first */}
          <button
            onClick={() => onSelectPhase(null)}
            className={cn(
              'h-9 px-3.5 rounded-full font-medium transition-colors shrink-0 inline-flex items-center gap-1.5 cursor-pointer border',
              selectedPhaseKey === null
                ? 'bg-card text-foreground border-foreground/30 shadow-xs ring-1 ring-border font-semibold'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60'
            )}
          >
            <span>All</span>
          </button>

          {phases.map((phase) => {
            const isSelected = selectedPhaseKey?.toUpperCase() === phase.key?.toUpperCase();
            const isCompleted = phase.status === 'COMPLETED';
            const isActive = phase.status === 'ACTIVE';
            const isLocked = !isActive && !isCompleted;

            const { label, subName, tooltipText } = formatPhaseLabel(phase, isActive);

            const startH = phase.window?.startHour != null ? Number(phase.window.startHour) : phase.position * 4;
            const endH = phase.window?.endHour != null ? Number(phase.window.endHour) : (phase.position + 1) * 4;
            const hourWindowText = `${startH}h – ${endH}h`;

            const buttonContent = (
              <button
                onClick={() => {
                  if (isLocked) {
                    playSound('blocked');
                    return;
                  }
                  onSelectPhase(phase.key);
                }}
                data-sound={isLocked ? 'blocked' : undefined}
                className={cn(
                  'group relative h-9 px-3.5 rounded-full font-medium transition-all shrink-0 inline-flex items-center gap-2 border',
                  isLocked
                    ? 'opacity-50 cursor-not-allowed bg-muted/30 text-muted-foreground/60 border-border/30'
                    : 'cursor-pointer',
                  isSelected
                    ? 'bg-card text-foreground border-foreground/30 shadow-xs ring-1 ring-border font-semibold'
                    : !isLocked && 'bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground border-border/60',
                  isCompleted && !isSelected && 'text-muted-foreground/80'
                )}
              >
                {/* State indicator glyph */}
                {isCompleted && (
                  <span className="size-4 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shrink-0">
                    <Check className="size-2.5 stroke-[3]" />
                  </span>
                )}

                {isActive && (
                  <span className="relative flex size-3.5 items-center justify-center shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                    <span className="relative inline-flex size-2.5 rounded-full ring-2 ring-amber-500 bg-amber-400" />
                  </span>
                )}

                {isLocked && (
                  <Lock className="size-3 text-muted-foreground/60 shrink-0" />
                )}

                {/* Single label or key */}
                <span className="font-mono font-semibold">{label}</span>
                {subName ? (
                  <span className="max-w-[140px] truncate text-xs font-normal text-muted-foreground">{subName}</span>
                ) : null}

                {/* Confirmed progress indicator from task selector */}
                {counts?.byPhase[phase.key.toUpperCase()] && counts.byPhase[phase.key.toUpperCase()].total > 0 && !isLocked && (
                  <span className={cn(
                    "ml-0.5 px-1.5 py-0.2 rounded-full font-mono text-[10px] font-semibold",
                    isSelected
                      ? "bg-muted text-foreground"
                      : isCompleted
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {counts.byPhase[phase.key.toUpperCase()].confirmed}/{counts.byPhase[phase.key.toUpperCase()].total}
                  </span>
                )}

                {/* Amber Overdue mono tag - only for active phase */}
                {phase.overdue && isActive && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium">
                    Overdue
                  </span>
                )}

                {/* Completed read-only tag if selected */}
                {isCompleted && isSelected && (
                  <span className="text-[10px] font-mono text-muted-foreground">(Read-only)</span>
                )}
              </button>
            );

            // Wrap with tooltip
            return (
              <Tooltip key={phase.id || phase.key}>
                <TooltipTrigger asChild>
                  {buttonContent}
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs font-mono py-1 px-2.5">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <span>{tooltipText}</span>
                      {isLocked && <span className="text-[10px] text-amber-500 font-mono">(Locked)</span>}
                    </div>
                    <span className="text-[11px] text-muted-foreground">Window: {hourWindowText}</span>
                    {isLocked ? (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400">Locked until active phase is completed</span>
                    ) : phase.goal ? (
                      <span className="text-[11px] text-muted-foreground/90 max-w-xs">{phase.goal}</span>
                    ) : null}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {rightAction && (
          <div className="shrink-0 flex items-center pl-2">
            {rightAction}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
