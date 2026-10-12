import * as React from 'react';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/primitives/progress-bar';
import { DarkCallout } from '@/components/primitives/dark-callout';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';
import type { HealthPanelData, TeamMember } from '@/api/client';

export interface HealthPanelProps {
  data?: any;
  members?: any[];
}

export function HealthPanel({ data, members = [] }: HealthPanelProps) {
  const [selectedCheckIn, setSelectedCheckIn] = React.useState<string | null>(null);

  // Compute or extract member health
  const safeMembers = members || [];
  const memberHealth: any[] = data?.memberHealth || safeMembers.map((m: any) => {
    const done = Number(m.tasksDone || 0);
    const totalAll = safeMembers.reduce((sum, curr) => sum + Number(curr.tasksDone || 0), 0);
    const workloadPercent = totalAll > 0 ? Math.round((done / totalAll) * 100) : 0;
    return {
      memberId: m.userId || m.id,
      workloadPercent,
      isOverloaded: workloadPercent > 50,
    };
  });

  const checkInOptions: any[] = data?.checkInOptions || [
    { id: 'good', label: 'Energized', icon: '⚡' },
    { id: 'ok', label: 'Steady', icon: '👍' },
    { id: 'tired', label: 'Stuck / Tired', icon: '☕' },
  ];

  // Find if anyone is overloaded
  const rescuer = memberHealth.find((h: any) => h.isOverloaded);
  const rescuerMember = rescuer
    ? safeMembers.find((m: any) => (m.userId || m.id) === rescuer.memberId)
    : null;

  return (
    <div className="flex flex-col gap-4 p-5 bg-surface border border-border shadow-e0 rounded-card">
      <header className="flex items-center justify-between">
        <h3 className="text-h3 text-ink">Team Health</h3>
      </header>

      <div className="flex flex-col gap-3 min-w-0">
        <span className="text-label text-ink-muted">Your check-in (optional)</span>
        <SegmentedControl className="w-full justify-between">
          {checkInOptions.map((opt: any) => (
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
            {rescuerMember.name || rescuerMember.fullName || 'Teammate'} has done {rescuer!.workloadPercent}% of the completed tasks.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-4 mt-2 min-w-0">
        <span className="text-label text-ink-muted">Workload share</span>
        <div className="flex flex-col gap-3">
          {memberHealth.map((health: any) => {
            const member = safeMembers.find(m => (m.userId || m.id) === health.memberId);
            if (!member) return null;
            const initials = member.initials || (member.name ? member.name.slice(0, 2).toUpperCase() : member.avatarId || 'ME');
            const displayName = member.name || member.fullName || 'Teammate';
            
            return (
              <div key={health.memberId} className="flex items-center gap-3 min-w-0">
                <div className="w-6 h-6 rounded-full bg-surface-sunken flex items-center justify-center shrink-0 overflow-hidden">
                  <span className="text-[10px] font-bold">{initials}</span>
                </div>
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex justify-between items-center text-caption min-w-0">
                    <span className="text-ink font-medium truncate pr-2">{displayName}</span>
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
