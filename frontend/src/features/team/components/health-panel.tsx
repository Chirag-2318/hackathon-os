import * as React from 'react';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/primitives/progress-bar';
import { DarkCallout } from '@/components/primitives/dark-callout';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';
import type { HealthPanelData, TeamMember } from '@/api/client';

export interface HealthPanelProps {
  data: HealthPanelData;
  members: TeamMember[];
}

export function HealthPanel({ data, members }: HealthPanelProps) {
  const [selectedCheckIn, setSelectedCheckIn] = React.useState<string | null>(null);

  // Find if anyone is overloaded
  const rescuer = data.memberHealth.find((h: any) => h.isOverloaded);
  const rescuerMember = rescuer ? members.find((m: any) => m.id === rescuer.memberId) : null;
  return (
    <div className="flex flex-col gap-4 p-5 bg-surface border border-border shadow-e0 rounded-card">
      <header className="flex items-center justify-between">
        <h3 className="text-h3 text-ink">Team Health</h3>
      </header>

      <div className="flex flex-col gap-3 min-w-0">
        <span className="text-label text-ink-muted">Your check-in (optional)</span>
        <SegmentedControl className="w-full justify-between">
          {data.checkInOptions.map((opt: any) => (
            <SegmentedControlItem 
              key={opt.id}
              active={selectedCheckIn === opt.id}
              onClick={() => setSelectedCheckIn(opt.id)}
              className="flex-1 min-w-0"
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="shrink-0">{opt.icon}</span>
                <span className="hidden sm:inline truncate">{opt.label}</span>
              </span>
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>

      {rescuerMember && (
        <div className="flex flex-col gap-2 bg-danger-fill text-ink rounded-control p-4 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-label font-bold text-ink">Rescuer alert</span>
            <button className="text-caption font-bold underline shrink-0 ml-2">View workload</button>
          </div>
          <span className="text-body min-w-0">
            {rescuerMember.fullName} has done {rescuer!.workloadPercent}% of the completed tasks.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-4 mt-2 min-w-0">
        <span className="text-label text-ink-muted">Workload share</span>
        <div className="flex flex-col gap-3">
          {data.memberHealth.map((health: any) => {
            const member = members.find(m => m.id === health.memberId);
            if (!member) return null;
            
            return (
              <div key={health.memberId} className="flex items-center gap-3 min-w-0">
                <div className="w-6 h-6 rounded-full bg-surface-sunken flex items-center justify-center shrink-0 overflow-hidden">
                  <span className="text-[10px] font-bold">{member.avatarId}</span>
                </div>
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex justify-between items-center text-caption min-w-0">
                    <span className="text-ink font-medium truncate pr-2">{member.fullName}</span>
                    <span className="text-ink-muted shrink-0 tabular-nums">{health.workloadPercent}%</span>
                  </div>
                  <ProgressBar 
                    value={health.workloadPercent} 
                    className="h-1.5 bg-surface-sunken [&>div]:bg-ink-muted" 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
