import React from 'react';
import { cn } from '@/lib/utils';
import { Plus, LayoutGrid, List, SlidersHorizontal, ChevronDown } from 'lucide-react';
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
  showControls?: boolean;
  isControlsCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  showControls = true,
  isControlsCollapsed = false,
  onToggleCollapse,
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
          <h1 className="text-3xl sm:text-4xl font-display font-normal tracking-tight text-foreground leading-none">
            Board
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border shrink-0 bg-muted/80 text-muted-foreground border-border/60">
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

          {/* Collapse/Expand Toggle Button */}
          {showControls && onToggleCollapse && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleCollapse}
              className="h-9 px-3 rounded-full text-xs font-medium border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={isControlsCollapsed ? 'Show filters & stats' : 'Collapse filters & stats'}
              aria-label={isControlsCollapsed ? 'Show filters & stats' : 'Collapse filters & stats'}
            >
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden sm:inline">{isControlsCollapsed ? 'Filters' : 'Collapse'}</span>
              <ChevronDown className={cn("size-3.5 transition-transform duration-200", !isControlsCollapsed && "rotate-180")} />
            </Button>
          )}

          {/* Dark/Cream Create button via primary token */}
          <Button
            onClick={onCreateClick}
            className="group h-9 px-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5 transition-transform duration-200 group-hover:rotate-90" />
            <span>Create</span>
            <kbd className="ml-1 text-[10px] font-mono opacity-60 bg-current/20 px-1 rounded">
              C
            </kbd>
          </Button>
        </div>
      </div>

      {/* Summary chips line - only shown when showControls && !isControlsCollapsed */}
      {showControls && !isControlsCollapsed && (
        <div className="flex items-center gap-2 text-xs flex-wrap pb-1">
          {openCount > 0 && (
            <button
              onClick={() => onSelectSummaryFilter(activeFilter === 'open' ? null : 'open')}
              className={cn(
                'h-6 px-2.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5 cursor-pointer',
                activeFilter === 'open'
                  ? 'bg-inverse text-on-inverse border-inverse'
                  : 'bg-muted text-muted-foreground border-border/60 hover:bg-muted/80'
              )}
            >
              <span className="font-mono font-semibold">{openCount}</span> open
            </button>
          )}

          {blockedCount > 0 && (
            <button
              onClick={() => onSelectSummaryFilter(activeFilter === 'blocked' ? null : 'blocked')}
              className={cn(
                'h-6 px-2.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5 cursor-pointer',
                activeFilter === 'blocked'
                  ? 'bg-danger text-on-danger border-danger'
                  : 'bg-semantic-danger-bg text-semantic-danger-fg border-semantic-danger-border hover:opacity-80'
              )}
            >
              <span className="font-mono font-semibold">{blockedCount}</span> blocked
            </button>
          )}

          {unassignedCount > 0 && (
            <button
              onClick={() => onSelectSummaryFilter(activeFilter === 'unassigned' ? null : 'unassigned')}
              className={cn(
                'h-6 px-2.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5 cursor-pointer',
                activeFilter === 'unassigned'
                  ? 'bg-accent text-on-accent border-accent'
                  : 'bg-semantic-warning-bg text-semantic-warning-fg border-semantic-warning-border hover:opacity-80'
              )}
            >
              <span className="font-mono font-semibold">{unassignedCount}</span> unassigned
            </button>
          )}

          {dueTodayCount > 0 && (
            <button
              onClick={() => onSelectSummaryFilter(activeFilter === 'duetoday' ? null : 'duetoday')}
              className={cn(
                'h-6 px-2.5 rounded-full text-xs font-medium border transition-colors inline-flex items-center gap-1.5 cursor-pointer',
                activeFilter === 'duetoday'
                  ? 'bg-inverse text-on-inverse border-inverse'
                  : 'bg-muted text-muted-foreground border-border/60 hover:bg-muted/80'
              )}
            >
              <span className="font-mono font-semibold">{dueTodayCount}</span> due today
            </button>
          )}
        </div>
      )}
    </div>
  );
}
