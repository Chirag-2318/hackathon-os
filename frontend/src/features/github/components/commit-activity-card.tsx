import React, { useState } from 'react';
import {
  SegmentedControl, SegmentedControlItem
} from '@/components/primitives/segmented-control';
import { ActivityChart } from './activity-chart';
import { ContributorsList } from './contributors-list';
import type { Commit } from '@/services/types';

interface CommitActivityCardProps {
  commits: Commit[];
  eventStartIso?: string;
}

export function CommitActivityCard({
  commits,
  eventStartIso,
}: CommitActivityCardProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'contributors'>('activity');

  return (
    <div
      id="commit-activity"
      className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden font-[var(--font-inter)]"
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 border-b border-border/60 min-h-[48px]">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold text-foreground">Commit activity</h3>
          <span className="h-5 px-2 rounded-full bg-muted text-[11px] font-bold text-muted-foreground tabular-nums flex items-center justify-center">
            {commits.length} commits
          </span>
        </div>

        {/* Tab switch */}
        <SegmentedControl>
          <SegmentedControlItem
            active={activeTab === 'activity'}
            onClick={() => setActiveTab('activity')}
            className="cursor-pointer text-xs"
          >
            Activity
          </SegmentedControlItem>
          <SegmentedControlItem
            active={activeTab === 'contributors'}
            onClick={() => setActiveTab('contributors')}
            className="cursor-pointer text-xs"
          >
            Contributors
          </SegmentedControlItem>
        </SegmentedControl>
      </div>

      {/* ── Body ── */}
      <div className="p-5">
        {activeTab === 'activity' ? (
          <ActivityChart commits={commits} eventStartIso={eventStartIso} />
        ) : (
          <ContributorsList commits={commits} />
        )}
      </div>
    </div>
  );
}
