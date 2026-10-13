import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { IdeateTab } from './ideate-empty-state';

export type IdeateSort = 'newest' | 'attachments';
export type IdeateViewMode = 'cards' | 'compact';

export interface IdeateFilterBarProps {
  activeTab: IdeateTab;
  onSelectTab: (tab: IdeateTab) => void;
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  sort: IdeateSort;
  onSelectSort: (sort: IdeateSort) => void;
  viewMode: IdeateViewMode;
  onSelectViewMode: (viewMode: IdeateViewMode) => void;
}

const TABS: { id: IdeateTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export function IdeateFilterBar({
  activeTab,
  onSelectTab,
  counts,
  sort,
  onSelectSort,
  viewMode,
  onSelectViewMode,
}: IdeateFilterBarProps) {
  const getTabCount = (tab: IdeateTab) => {
    switch (tab) {
      case 'all':
        return counts.total ?? 0;
      case 'pending':
        return counts.pending ?? 0;
      case 'approved':
        return counts.approved ?? 0;
      case 'rejected':
        return counts.rejected ?? 0;
      default:
        return 0;
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap py-1">
      {/* Left: Segmented control with sliding active indicator and real mono counts */}
      <div
        role="tablist"
        aria-label="Idea status filters"
        className="flex items-center p-1 rounded-xl bg-muted/50 border border-border/60 gap-0.5 relative"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = getTabCount(tab.id);

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(tab.id)}
              className={cn(
                'relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors select-none flex items-center gap-1.5 z-10 cursor-pointer',
                isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="ideate-filter-active-pill"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  className="absolute inset-0 bg-background shadow-xs rounded-lg border border-border/80 -z-10"
                />
              )}
              <span>{tab.label}</span>
              <span className="font-mono text-[11px] opacity-75">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Sort and View mode toggle */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2.5 font-normal"
            >
              <ArrowUpDown className="size-3.5" />
              <span>
                {sort === 'newest' ? 'Newest' : 'Most attachments'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => onSelectSort('newest')}
              className={cn('text-xs cursor-pointer', sort === 'newest' && 'font-semibold')}
            >
              Newest
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSelectSort('attachments')}
              className={cn('text-xs cursor-pointer', sort === 'attachments' && 'font-semibold')}
            >
              Most attachments
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-[1px] bg-border/60" />

        {/* View toggle (cards vs compact list) */}
        <div className="flex items-center p-0.5 rounded-lg bg-muted/40 border border-border/60 gap-0.5">
          <button
            type="button"
            onClick={() => onSelectViewMode('cards')}
            aria-label="Cards view"
            title="Cards view"
            className={cn(
              'p-1.5 rounded-md transition-colors cursor-pointer',
              viewMode === 'cards'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGrid className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectViewMode('compact')}
            aria-label="Compact list view"
            title="Compact list view"
            className={cn(
              'p-1.5 rounded-md transition-colors cursor-pointer',
              viewMode === 'compact'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
