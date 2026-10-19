import React from 'react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
import type { QnaMapResponse } from '../api/qna-api';

interface QnaDefenceMapProps {
  mapData: QnaMapResponse;
  onSelectCriterion: (criterion: string) => void;
  onDrillCriterion: (criterion: string) => void;
}

export function QnaDefenceMap({
  mapData,
  onSelectCriterion,
  onDrillCriterion,
}: QnaDefenceMapProps) {
  const totalWeight = React.useMemo(() => {
    const sum = mapData.lanes.reduce((acc, lane) => acc + (lane.weight || 10), 0);
    return sum > 0 ? sum : 100;
  }, [mapData.lanes]);

  return (
    <div className="space-y-8">
      {/* Segmented Bar Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs tracking-wider uppercase text-muted-foreground font-mono">
          <span>Where the judges will push</span>
          <span>
            {mapData.solidQuestions} of {mapData.totalQuestions} solid ({mapData.solidPercent}%)
          </span>
        </div>

        {/* The segmented bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/40 gap-0.5 p-0.5 border border-border">
          {mapData.lanes.map((lane) => {
            const laneWidthPct = Math.max(10, ((lane.weight || 10) / totalWeight) * 100);
            const solidPct = lane.total > 0 ? Math.round((lane.solid / lane.total) * 100) : 0;

            return (
              <button
                key={lane.criterion}
                type="button"
                onClick={() => onSelectCriterion(lane.criterion)}
                className="relative h-full bg-muted/60 hover:bg-muted transition-colors rounded-sm overflow-hidden text-left focus:outline-none focus:ring-1 focus:ring-ring"
                style={{ width: `${laneWidthPct}%` }}
                title={`${lane.criterion}: ${lane.solid}/${lane.total} solid (${solidPct}%) · Weight: ${lane.weight}%`}
              >
                <div
                  className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-300"
                  style={{ width: `${solidPct}%` }}
                />
              </button>
            );
          })}
        </div>

        {/* Criterion Labels under bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
          {mapData.lanes.map((lane) => {
            const solidPct = lane.total > 0 ? Math.round((lane.solid / lane.total) * 100) : 0;
            return (
              <button
                key={lane.criterion}
                type="button"
                onClick={() => onSelectCriterion(lane.criterion)}
                className="text-left group focus:outline-none"
              >
                <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {lane.criterion}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground flex items-center justify-between mt-0.5">
                  <span>{lane.weight}%</span>
                  <span>
                    {lane.solid}/{lane.total} solid
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Weakest Area Alert Callout */}
        {mapData.weakestCriterion && (
          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
            <span className="text-muted-foreground">
              Weakest area:{' '}
              <strong className="font-semibold text-foreground">
                {mapData.weakestCriterion}
              </strong>{' '}
              ({mapData.lanes.find((l) => l.criterion === mapData.weakestCriterion)?.weight ?? 20}%),{' '}
              <span className="font-mono">
                {mapData.weakestSolidCount} of {mapData.weakestTotalCount} solid
              </span>
              .
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs font-mono font-normal tracking-wide px-3"
              onClick={() => onDrillCriterion(mapData.weakestCriterion)}
            >
              Drill it
            </Button>
          </div>
        )}
      </div>

      {/* Team Progress Section */}
      <div className="space-y-2 border-t border-border pt-6">
        <h3 className="text-xs font-mono tracking-wider uppercase text-muted-foreground">
          Team
        </h3>
        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden bg-card/40">
          {mapData.teamMembers.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between px-4 py-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <UserAvatar user={{ name: member.userName, username: member.userHandle }} size={24} />
                <span className="font-mono text-foreground font-medium">
                  @{member.userHandle}
                </span>
                <span className="text-muted-foreground">
                  {member.userName}
                </span>
              </div>

              <div className="flex items-center gap-6">
                <span className="font-mono text-muted-foreground">
                  {member.practisedCount} of {mapData.totalQuestions} practised
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  {member.solidCount} solid
                </span>
                {member.weakestOwnedCount > 0 && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-mono">
                    {member.weakestOwnedCount} need practice
                  </span>
                )}
              </div>
            </div>
          ))}

          {mapData.teamMembers.length === 0 && (
            <div className="p-4 text-xs text-muted-foreground text-center font-mono">
              No team members have practised yet.
            </div>
          )}
        </div>

        {mapData.weakestOwnerHandle && mapData.weakestOwnerCount > 0 && (
          <p className="text-xs text-muted-foreground font-mono mt-2">
            {mapData.weakestOwnerCount} questions owned by @{mapData.weakestOwnerHandle} need practice.
          </p>
        )}
      </div>
    </div>
  );
}
