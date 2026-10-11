import React from 'react';
import { cn } from '@/lib/utils';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';
import type { Task, BoardPhase } from '@/services/types';

export interface BoardHeaderProps {
  currentPhaseName?: string;
  timeLeftText?: string;
  viewMode: 'board' | 'list';
  onViewModeChange: (mode: 'board' | 'list') => void;
  onCreateClick: () => void;
  // Summary counts
  tasks: Task[];
  activeFilter?: string | null;
  onSelectSummaryFilter: (filter: 'open' | 'blocked' | 'unassigned' | 'duetoday' | null) => void;
}

export function BoardHeader({
  currentPhaseName = 'Sprint',
  timeLeftText,
  viewMode,
  onViewModeChange,
  onCreateClick,
  tasks,
  activeFilter,
  onSelectSummaryFilter,
}: BoardHeaderProps) {
  // Compute summary numbers
  const openCount = tasks.filter(t => t.status !== 'done').length;
  const blockedCount = tasks.filter(t => Boolean(t.flagged || (t as any).blockedReason)).length;
  const unassignedCount = tasks.filter(t => !t.assigneeId).length;
  const dueTodayCount = tasks.filter(t => {
    if (!t.dueAt) return false;
    const diff = new Date(t.dueAt).getTime() - Date.now();
    return diff >= 0 && diff <= 24 * 3600 * 1000;
  }).length;

  return (
    <div className="flex flex-col gap-2 shrink-0">
      {/* Header row (56px) */}
      <div className="flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Board
          </h1>
          <span className="h-7 px-3 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/50 inline-flex items-center">
            {timeLeftText ? `${currentPhaseName} · ${timeLeftText}` : currentPhaseName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* SegmentedControl Board | List */}
          <SegmentedControl className="h-9">
            <SegmentedControlItem
              active={viewMode === 'board'}
              onClick={() => onViewModeChange('board')}
              className="gap-1.5 text-xs font-medium px-3"
            >
              <LayoutGrid className="size-3.5" />
              <span>Board</span>
            </SegmentedControlItem>
            <SegmentedControlItem
              active={viewMode === 'list'}
              onClick={() => onViewModeChange('list')}
              className="gap-1.5 text-xs font-medium px-3"
            >
              <List className="size-3.5" />
              <span>List</span>
            </SegmentedControlItem>
          </SegmentedControl>

          {/* Dark Create button */}
          <Button
            onClick={onCreateClick}
            className="group h-9 px-4 rounded-full bg-[#18181B] text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            <Plus className="size-3.5 transition-transform duration-200 group-hover:rotate-90" />
            <span>Create</span>
            <kbd className="ml-1 text-[10px] font-mono opacity-60 bg-white/20 dark:bg-black/20 px-1 rounded">
              C
            </kbd>
          </Button>
        </div>
      </div>

      {/* Summary chips line (12px text, edge aligned) */}
      <div className="flex items-center gap-2 text-xs flex-wrap pb-1">
        {openCount > 0 && (
          <button
            onClick={() => onSelectSummaryFilter(activeFilter === 'open' ? null : 'open')}
            className={cn(
              'h-6 px-2.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5',
              activeFilter === 'open'
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black'
                : 'bg-muted text-muted-foreground border-border/60 hover:bg-muted/80'
            )}
          >
            <span className="font-semibold">{openCount}</span> open
          </button>
        )}

        {blockedCount > 0 && (
          <button
            onClick={() => onSelectSummaryFilter(activeFilter === 'blocked' ? null : 'blocked')}
            className={cn(
              'h-6 px-2.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5',
              activeFilter === 'blocked'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50 hover:bg-rose-100'
            )}
          >
            <span className="font-semibold">{blockedCount}</span> blocked
          </button>
        )}

        {unassignedCount > 0 && (
          <button
            onClick={() => onSelectSummaryFilter(activeFilter === 'unassigned' ? null : 'unassigned')}
            className={cn(
              'h-6 px-2.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5',
              activeFilter === 'unassigned'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50 hover:bg-amber-100'
            )}
          >
            <span className="font-semibold">{unassignedCount}</span> unassigned
          </button>
        )}

        {dueTodayCount > 0 && (
          <button
            onClick={() => onSelectSummaryFilter(activeFilter === 'duetoday' ? null : 'duetoday')}
            className={cn(
              'h-6 px-2.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5',
              activeFilter === 'duetoday'
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black'
                : 'bg-muted text-muted-foreground border-border/60 hover:bg-muted/80'
            )}
          >
            <span className="font-semibold">{dueTodayCount}</span> due today
          </button>
        )}
      </div>
    </div>
  );
}
