import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';

export interface CheckpointData {
  id: string;
  label: string;
  status: 'done' | 'current' | 'upcoming';
  timeLabel?: string;
  progress?: { done: number; total: number };
}

export interface OverviewCheckpointsProps {
  roomId: string;
  checkpoints: CheckpointData[];
  onPassCheckpoint?: (id: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function OverviewCheckpoints({
  roomId,
  checkpoints,
  onPassCheckpoint,
  isLoading,
  isError,
  onRetry,
}: OverviewCheckpointsProps) {
  const [view, setView] = useState<'remaining' | 'all'>('remaining');
  const [doneExpanded, setDoneExpanded] = useState(false);

  const doneList = checkpoints.filter((c) => c.status === 'done');
  const restList = checkpoints.filter((c) => c.status !== 'done');
  const passedCount = doneList.length;

  const shown =
    view === 'all'
      ? checkpoints
      : doneExpanded
      ? [...doneList, ...restList]
      : restList;

  return (
    <section className="space-y-4">
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-[22px] font-normal text-foreground tracking-tight">
            Checkpoints
          </h2>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {passedCount} / {checkpoints.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/app/room/${roomId}/board`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Edit checkpoints
          </Link>

          <SegmentedControl className="h-7 p-0.5">
            <SegmentedControlItem
              active={view === 'remaining'}
              onClick={() => setView('remaining')}
              className="text-xs px-2.5 py-0.5"
            >
              Remaining
            </SegmentedControlItem>
            <SegmentedControlItem
              active={view === 'all'}
              onClick={() => setView('all')}
              className="text-xs px-2.5 py-0.5"
            >
              All
            </SegmentedControlItem>
          </SegmentedControl>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-3">
          <div className="h-5 bg-muted/40 rounded w-2/3 animate-pulse" />
          <div className="h-5 bg-muted/30 rounded w-1/2 animate-pulse" />
          <div className="h-5 bg-muted/20 rounded w-3/4 animate-pulse" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between py-2 text-xs text-muted-foreground">
          <span>Failed to load checkpoints.</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-foreground hover:underline font-medium cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      ) : checkpoints.length === 0 ? (
        <p className="text-sm text-muted-foreground font-normal py-2">
          No checkpoints defined yet.
        </p>
      ) : (
        <div className="space-y-2">
          {/* Collapsible Done Summary (only in 'remaining' view) */}
          {view === 'remaining' && doneList.length > 0 && (
            <button
              type="button"
              onClick={() => setDoneExpanded(!doneExpanded)}
              className="w-full flex items-center justify-between py-2 px-2.5 rounded-[8px] hover:bg-surface transition-colors duration-150 text-left cursor-pointer min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-5 rounded-full bg-inverse text-on-inverse flex items-center justify-center shrink-0">
                  <Check className="size-3 text-current" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  {passedCount} checkpoint{passedCount === 1 ? '' : 's'} done
                </span>
              </div>
              <ChevronRight
                className={cn(
                  'size-4 text-muted-foreground transition-transform duration-200',
                  doneExpanded && 'rotate-90'
                )}
              />
            </button>
          )}

          {/* Vertical Rail of Nodes */}
          <div className="relative pl-6 space-y-3 py-1">
            {/* Connecting Vertical Hairline */}
            <div className="absolute left-[9px] top-2.5 bottom-2.5 w-px bg-border" />

            {shown.map((cp) => {
              const isDone = cp.status === 'done';
              const isCurrent = cp.status === 'current';

              return (
                <div
                  key={cp.id}
                  onClick={() => !isDone && onPassCheckpoint?.(cp.id)}
                  className={cn(
                    'relative flex items-center justify-between gap-3 py-1.5 rounded-[6px] transition-colors',
                    !isDone && onPassCheckpoint && 'cursor-pointer hover:bg-surface/50'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Node Glyphs */}
                    <div className="relative z-10 -ml-6 shrink-0 flex items-center justify-center">
                      {isDone ? (
                        <div className="size-5 rounded-full bg-inverse text-on-inverse flex items-center justify-center">
                          <Check className="size-3 text-current" strokeWidth={2.5} />
                        </div>
                      ) : isCurrent ? (
                        <div className="size-5 rounded-full border-2 border-accent bg-page flex items-center justify-center relative">
                          <div className="size-2 rounded-full bg-accent animate-ping absolute opacity-40" />
                          <div className="size-1.5 rounded-full bg-accent" />
                        </div>
                      ) : (
                        <div className="size-5 rounded-full border border-border bg-page" />
                      )}
                    </div>

                    <span
                      className={cn(
                        'text-sm truncate font-normal',
                        isDone ? 'text-muted-foreground line-through' : 'text-foreground'
                      )}
                    >
                      {cp.label}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-muted-foreground tabular-nums shrink-0">
                    {cp.timeLabel || 'Phase exit'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
