import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface RoomFooterProps {
  roomId: string;
  isCollapsed: boolean;
  clock: string;
  roomData?: any;
  overviewData?: any;
}

export function RoomFooter({
  roomId,
  isCollapsed,
  clock,
  roomData,
  overviewData,
}: RoomFooterProps) {
  // Derive next action from real state
  const nextAction = React.useMemo(() => {
    const stage = (roomData?.stage || 'brief').toLowerCase();
    const stageDone = roomData?.stageDone || {};

    if (['brief', 'ideate', 'plan', 'crowd', 'before'].includes(stage)) {
      if (!stageDone.brief) {
        return { title: 'Finalize project brief', path: `/app/room/${roomId}/brief` };
      }
      if (!stageDone.ideate) {
        return { title: 'Approve core features', path: `/app/room/${roomId}/ideate` };
      }
      if (!stageDone.plan) {
        return { title: 'Validate sprint plan', path: `/app/room/${roomId}/plan` };
      }
    }

    // Build stage actions
    const openTasks = Number(overviewData?.vitals?.tasks?.open ?? overviewData?.kpis?.tasksOpen?.value ?? 0);
    const blockedTasks = Number(overviewData?.vitals?.tasks?.blocked ?? 0);
    const unassignedTasks = Number(overviewData?.vitals?.tasks?.unassigned ?? 0);

    if (['build', 'freeze'].includes(stage)) {
      if (blockedTasks > 0) {
        return { title: 'Resolve blocked task', path: `/app/room/${roomId}/board` };
      }
      if (unassignedTasks > 0) {
        return { title: `Assign ${unassignedTasks} open ${unassignedTasks === 1 ? 'task' : 'tasks'}`, path: `/app/room/${roomId}/board` };
      }
      if (openTasks > 0) {
        return { title: `Work on ${openTasks} sprint ${openTasks === 1 ? 'task' : 'tasks'}`, path: `/app/room/${roomId}/board` };
      }
      return { title: 'Check MVP studio progress', path: `/app/room/${roomId}/mvp` };
    }

    // Polish / Present stage
    if (['polish', 'deck', 'pitch', 'rehearse'].includes(stage)) {
      return { title: 'Validate Demo & Pitch Kit', path: `/app/room/${roomId}/pitch-kit` };
    }

    if (['submit', 'submitted'].includes(stage)) {
      if (stage !== 'submitted') {
        return { title: 'Finish submission checklist', path: `/app/room/${roomId}/submission` };
      }
      return { title: "You're all caught up", path: `/app/room/${roomId}/overview`, isDone: true };
    }

    // Fallback if all caught up
    return { title: "You're all caught up", path: `/app/room/${roomId}/overview`, isDone: true };
  }, [roomId, roomData?.stage, roomData?.stageDone, overviewData?.vitals?.tasks, overviewData?.kpis?.tasksOpen]);

  // Submission countdown from real clock data
  const countdown = React.useMemo(() => {
    const clockStatus = overviewData?.clock;
    if (clockStatus?.hoursLeft !== undefined && clockStatus?.hoursLeft >= 0) {
      const h = clockStatus.hoursLeft;
      const m = clockStatus.minutesLeft ?? 0;
      return `${h}h ${m}m to submit`;
    }
    const formatted = overviewData?.kpis?.timeLeft || overviewData?.clock?.formattedRemaining;
    if (formatted) return `${formatted} to submit`;
    return null;
  }, [overviewData?.clock, overviewData?.kpis?.timeLeft]);

  if (isCollapsed) {
    return (
      <div className="pt-2 mt-auto border-t border-border/70 flex flex-col items-center gap-1.5 shrink-0 select-none">
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Link
              to={nextAction.path}
              className={cn(
                'size-7 rounded-full flex items-center justify-center transition-colors',
                nextAction.isDone
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-active text-ink hover:bg-hover'
              )}
              aria-label={`Next up: ${nextAction.title}`}
            >
              {nextAction.isDone ? (
                <Check className="size-3.5" />
              ) : (
                <Sparkles className="size-3.5 text-blue-600" />
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[200px] text-xs">
            <span className="font-semibold block text-[10px] uppercase text-ink-3">Next Up</span>
            <span>{nextAction.title}</span>
            {countdown && <span className="block text-[10px] font-mono text-muted-foreground mt-0.5">{countdown}</span>}
          </TooltipContent>
        </Tooltip>

        <span className="text-[10px] font-mono text-ink-3 tabular-nums text-center" title={clock}>
          {clock.split(' ')[0]}
        </span>
      </div>
    );
  }

  return (
    <div className="pt-2.5 pb-0.5 mt-auto border-t border-border/70 flex flex-col gap-1.5 shrink-0 select-none">
      {/* 1. Header label "NEXT UP" */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wider uppercase text-ink-3">
          Next up
        </span>
      </div>

      {/* 2. Action row (single most important next action) */}
      <Link
        to={nextAction.path}
        className={cn(
          'group flex items-center justify-between gap-2 p-1.5 -mx-1 rounded-[8px] transition-colors cursor-pointer',
          'hover:bg-hover'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {nextAction.isDone ? (
            <span className="size-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Check className="size-2.5 stroke-[3]" />
            </span>
          ) : (
            <span className="size-1.5 rounded-full bg-blue-600 shrink-0 animate-pulse" />
          )}
          <span className="text-[13px] font-medium text-ink truncate leading-tight">
            {nextAction.title}
          </span>
        </div>

        {!nextAction.isDone && (
          <span className="size-5 rounded flex items-center justify-center text-ink-3 group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0">
            <ArrowRight className="size-3.5" />
          </span>
        )}
      </Link>

      {/* 3. Bottom status line: Countdown in --font-mono + IST Clock */}
      <div className="flex items-center justify-between text-[11px] text-ink-3 pt-0.5 mt-0.5">
        {countdown ? (
          <span
            className="font-mono text-[11px] tabular-nums font-medium text-ink-2 truncate"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            {countdown}
          </span>
        ) : (
          <span />
        )}
        <span
          className="font-mono text-[11px] tabular-nums text-ink-3 shrink-0 ml-auto"
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
          aria-live="polite"
        >
          {clock}
        </span>
      </div>
    </div>
  );
}
