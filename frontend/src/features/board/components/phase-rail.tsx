import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Circle, Lock } from 'lucide-react';
import type { PhaseSummary } from '@/services/phaseService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { playSound } from '@/shared/sound/sound-effects';

export interface PhaseRailProps {
  phases: PhaseSummary[];
  selectedPhaseKey: string | null; // null for 'All'
  onSelectPhase: (phaseKey: string | null) => void;
  size?: 'default' | 'small';
  className?: string;
}

export function PhaseRail({
  phases,
  selectedPhaseKey,
  onSelectPhase,
  size = 'default',
  className,
}: PhaseRailProps) {
  const isCompactKeys = phases.length > 6;
  const isSmall = size === 'small';

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn(
          'w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 select-none',
          isSmall ? 'text-xs' : 'text-sm',
          className
        )}
      >
        {/* 'All' option first */}
        <button
          onClick={() => onSelectPhase(null)}
          className={cn(
            'px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 inline-flex items-center gap-1.5 cursor-pointer border',
            selectedPhaseKey === null
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border-border/60'
          )}
        >
          <span>All</span>
        </button>

        {phases.map((phase) => {
          const isSelected = selectedPhaseKey?.toUpperCase() === phase.key?.toUpperCase();
          const isCompleted = phase.status === 'COMPLETED';
          const isActive = phase.status === 'ACTIVE';
          const isLocked = !isActive && !isCompleted;

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
                'group relative px-3 py-1.5 rounded-full font-medium transition-all shrink-0 inline-flex items-center gap-2 border',
                isLocked ? 'opacity-60 cursor-not-allowed bg-muted/40 text-muted-foreground/60 border-border/40' : 'cursor-pointer',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : !isLocked && 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/60',
                isCompleted && !isSelected && 'text-muted-foreground/80'
              )}
            >
              {/* State indicator */}
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

              {/* Key and Name */}
              <span className="font-mono font-semibold">{phase.key}</span>
              {!isCompactKeys && (
                <span className="max-w-[140px] truncate text-xs">{phase.name}</span>
              )}

              {/* Amber Overdue mono tag */}
              {phase.overdue && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Overdue
                </span>
              )}

              {/* Completed read-only tag if selected */}
              {isCompleted && isSelected && (
                <span className="text-[10px] font-mono opacity-80">(Read-only)</span>
              )}
            </button>
          );

          // Wrap with tooltip for hour window and name (if compact)
          return (
            <Tooltip key={phase.id || phase.key}>
              <TooltipTrigger asChild>
                {buttonContent}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-mono py-1 px-2.5">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <span>{phase.key}: {phase.name}</span>
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
    </TooltipProvider>
  );
}
