import React from 'react';
import { cn } from '@/lib/utils';
import { Search, User, X, ChevronDown, Check } from 'lucide-react';
import type { RoomMember } from '@/services/types';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export type GroupByOption = 'none' | 'assignee' | 'phase';

export interface BoardFilterState {
  search: string;
  selectedAssigneeId: string | null; // null = none, 'unassigned' = unassigned, member id = specific
  onlyMine: boolean;
  blocked: boolean;
  dueSoon: boolean;
  groupBy: GroupByOption;
}

export interface BoardFilterBarProps {
  members: RoomMember[];
  currentUserId?: string;
  filterState: BoardFilterState;
  onFilterChange: (updates: Partial<BoardFilterState>) => void;
  onClearFilters: () => void;
}

export function BoardFilterBar({
  members,
  currentUserId,
  filterState,
  onFilterChange,
  onClearFilters,
}: BoardFilterBarProps) {
  const isAnyFilterActive =
    Boolean(filterState.search) ||
    filterState.selectedAssigneeId !== null ||
    filterState.onlyMine ||
    filterState.blocked ||
    filterState.dueSoon ||
    filterState.groupBy !== 'none';

  return (
    <div className="flex items-center gap-3 h-10 flex-wrap shrink-0">
      {/* Search Input (gray #F3F3F3, radius 12, 240px) */}
      <div className="relative w-[240px] shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={filterState.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Search board"
          className="w-full h-8 pl-8 pr-3 rounded-[12px] bg-[#F3F3F3] dark:bg-muted/70 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent transition-all"
        />
        {filterState.search && (
          <button
            onClick={() => onFilterChange({ search: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Assignee Avatar Stack Toggle + Unassigned slot */}
      <div className="flex items-center -space-x-1.5 shrink-0 px-1">
        {members.map((member) => {
          const isSelected = filterState.selectedAssigneeId === member.id;
          const isDimmed = filterState.selectedAssigneeId !== null && !isSelected;

          return (
            <button
              key={member.id}
              onClick={() => {
                onFilterChange({
                  selectedAssigneeId: isSelected ? null : member.id,
                });
              }}
              title={member.name}
              className={cn(
                'relative size-7 rounded-full bg-neutral-200 dark:bg-neutral-800 text-[10px] font-bold flex items-center justify-center transition-all duration-150 border-2 border-background',
                isSelected && 'ring-2 ring-blue-600 scale-105 z-10',
                isDimmed && 'opacity-60 hover:opacity-100'
              )}
            >
              {member.avatar ? (
                <img src={member.avatar} alt={member.name || 'Member'} className="size-full rounded-full object-cover" />
              ) : (
                (member.name || 'TM').slice(0, 2).toUpperCase()
              )}
            </button>
          );
        })}

        {/* Unassigned slot */}
        <button
          onClick={() => {
            const isSelected = filterState.selectedAssigneeId === 'unassigned';
            onFilterChange({
              selectedAssigneeId: isSelected ? null : 'unassigned',
            });
          }}
          title="Unassigned tasks"
          className={cn(
            'relative size-7 rounded-full border-2 border-dashed border-muted-foreground/60 flex items-center justify-center text-muted-foreground text-[10px] bg-background transition-all duration-150',
            filterState.selectedAssigneeId === 'unassigned' && 'ring-2 ring-blue-600 border-blue-600 text-blue-600 z-10 scale-105',
            filterState.selectedAssigneeId !== null && filterState.selectedAssigneeId !== 'unassigned' && 'opacity-60 hover:opacity-100'
          )}
        >
          <User className="size-3" />
        </button>
      </div>

      {/* Toggle Chips */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onFilterChange({ onlyMine: !filterState.onlyMine })}
          className={cn(
            'h-7 px-3 rounded-full text-xs font-medium border transition-colors inline-flex items-center select-none',
            filterState.onlyMine
              ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black'
              : 'bg-background text-muted-foreground border-border hover:bg-muted'
          )}
        >
          Only mine
        </button>

        <button
          onClick={() => onFilterChange({ blocked: !filterState.blocked })}
          className={cn(
            'h-7 px-3 rounded-full text-xs font-medium border transition-colors inline-flex items-center select-none',
            filterState.blocked
              ? 'bg-rose-600 text-white border-rose-600'
              : 'bg-background text-muted-foreground border-border hover:bg-muted'
          )}
        >
          Blocked
        </button>

        <button
          onClick={() => onFilterChange({ dueSoon: !filterState.dueSoon })}
          className={cn(
            'h-7 px-3 rounded-full text-xs font-medium border transition-colors inline-flex items-center select-none',
            filterState.dueSoon
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-background text-muted-foreground border-border hover:bg-muted'
          )}
        >
          Due soon
        </button>
      </div>

      {/* Group By Dropdown */}
      <div className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 px-3 rounded-full text-xs font-medium border border-border bg-background text-foreground hover:bg-muted inline-flex items-center gap-1.5 select-none">
              <span className="text-muted-foreground">Group by:</span>
              <span className="capitalize">{filterState.groupBy}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36 text-xs">
            <DropdownMenuItem onClick={() => onFilterChange({ groupBy: 'none' })}>
              {filterState.groupBy === 'none' && <Check className="size-3 mr-1.5 text-blue-600" />}
              None
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange({ groupBy: 'assignee' })}>
              {filterState.groupBy === 'assignee' && <Check className="size-3 mr-1.5 text-blue-600" />}
              Assignee
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange({ groupBy: 'phase' })}>
              {filterState.groupBy === 'phase' && <Check className="size-3 mr-1.5 text-blue-600" />}
              Phase
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Clear Filters (Far Right) */}
      {isAnyFilterActive && (
        <button
          onClick={onClearFilters}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground font-medium underline-offset-4 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
