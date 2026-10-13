import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NextStepData {
  label?: string;
  route?: string;
  reason?: string;
}

export interface NextUpBlockProps {
  nextStep?: NextStepData | null;
  roomId?: string;
  variant?: 'card' | 'sidebar' | 'banner' | 'inline';
  className?: string;
}

/**
 * Shared "Next up" component driven directly by backend nextStep { label, route, reason }.
 * Navigates to nextStep.route on click.
 */
export function NextUpBlock({
  nextStep,
  roomId,
  variant = 'card',
  className,
}: NextUpBlockProps) {
  const navigate = useNavigate();

  if (!nextStep || !nextStep.route || !nextStep.label) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    let targetRoute = nextStep.route!;
    // Ensure route has roomId if needed
    if (roomId && targetRoute.includes(':roomId')) {
      targetRoute = targetRoute.replace(':roomId', roomId);
    } else if (roomId && !targetRoute.startsWith('/app/room/')) {
      targetRoute = `/app/room/${roomId}/${targetRoute.replace(/^\//, '')}`;
    }
    navigate(targetRoute);
  };

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'w-full p-2.5 rounded-[12px] text-left transition-all cursor-pointer group',
          'bg-surface hover:bg-hover border border-border shadow-2xs',
          'flex flex-col gap-1',
          className
        )}
      >
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          <span className="flex items-center gap-1">
            <Sparkles className="size-3" />
            <span>Next up</span>
          </span>
          <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
        <p className="text-[12px] font-semibold text-ink truncate leading-tight">
          {nextStep.label}
        </p>
        {nextStep.reason && (
          <p className="text-[11px] text-ink-3 truncate leading-none">
            {nextStep.reason}
          </p>
        )}
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer',
          'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 transition-colors',
          className
        )}
      >
        <Sparkles className="size-3.5 text-blue-600" />
        <span className="font-semibold">{nextStep.label}</span>
        {nextStep.reason && <span className="opacity-75 hidden sm:inline">· {nextStep.reason}</span>}
        <ArrowRight className="size-3.5 ml-0.5" />
      </button>
    );
  }

  // Default 'card' or 'banner'
  return (
    <div
      onClick={handleClick}
      className={cn(
        'group flex items-center justify-between p-3.5 rounded-[14px] cursor-pointer transition-all',
        'bg-card hover:bg-surface border border-blue-200/80 dark:border-blue-900/60 shadow-xs hover:shadow-sm',
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Next Up
            </span>
          </div>
          <h4 className="text-[13px] font-semibold text-ink truncate mt-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {nextStep.label}
          </h4>
          {nextStep.reason && (
            <p className="text-[12px] text-ink-2 truncate mt-0.5">
              {nextStep.reason}
            </p>
          )}
        </div>
      </div>

      <div className="size-7 rounded-lg bg-surface border border-border group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-ink-2 shrink-0 transition-colors ml-3">
        <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
}
