import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';

export interface TaskItemData {
  id: string;
  key: string;
  title: string;
  status: string;
  dueOrPhase: string;
  isMine: boolean;
}

export interface OverviewMyTasksProps {
  roomId: string;
  tasks: TaskItemData[];
  isLeader?: boolean;
  firstPhaseKey?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function OverviewMyTasks({
  roomId,
  tasks,
  isLeader,
  firstPhaseKey = 'P1',
  isLoading,
  isError,
  onRetry,
}: OverviewMyTasksProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'mine' | 'all'>('mine');

  const filteredTasks = filter === 'mine' ? tasks.filter((t) => t.isMine) : tasks;
  const totalCount = tasks.length;

  return (
    <section className="space-y-3">
      {/* Title & Segmented Control */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-[22px] font-normal text-foreground tracking-tight">
            My tasks
          </h2>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {filteredTasks.length}
          </span>
        </div>

        <SegmentedControl className="h-7 p-0.5">
          <SegmentedControlItem
            active={filter === 'mine'}
            onClick={() => setFilter('mine')}
            className="text-xs px-2.5 py-0.5"
          >
            Mine
          </SegmentedControlItem>
          <SegmentedControlItem
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            className="text-xs px-2.5 py-0.5"
          >
            All
          </SegmentedControlItem>
        </SegmentedControl>
      </div>

      {isLoading ? (
        <div className="space-y-2 py-2">
          <div className="h-4 bg-muted/40 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-muted/30 rounded w-2/3 animate-pulse" />
          <div className="h-4 bg-muted/20 rounded w-1/2 animate-pulse" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between py-2 text-xs text-muted-foreground">
          <span>Failed to load tasks.</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-foreground hover:underline font-medium cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-4 flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground font-normal">
            {isLeader
              ? `No tasks created for ${firstPhaseKey} yet.`
              : 'Nothing assigned to you yet.'}
          </p>
          {isLeader && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/app/room/${roomId}/board`)}
              className="min-h-[44px] sm:min-h-8 rounded-[8px] border border-border text-xs font-medium text-foreground cursor-pointer shadow-none"
            >
              Generate tasks for {firstPhaseKey}
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filteredTasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="py-2.5 flex items-center justify-between gap-3 text-sm group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-xs text-muted-foreground shrink-0 min-w-[50px]">
                  {task.key}
                </span>
                <span className="truncate text-foreground font-normal">
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground capitalize">
                  {task.status}
                </span>
                <span className="text-xs font-mono text-muted-foreground tabular-nums">
                  {task.dueOrPhase}
                </span>
              </div>
            </div>
          ))}

          {/* View all tasks link */}
          <div className="pt-3">
            <Link
              to={`/app/room/${roomId}/board`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              View all {totalCount} tasks &rarr;
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
