import * as React from 'react';
import { ProgressRow } from '@/components/primitives/progress-row';
import { UserAvatar } from '@/components/primitives/avatar-stack';

interface KpiRowProps {
  checkpointsPassed: { value: string; total: string; delta: string };
  tasksOpen: { value: string; delta: string };
  blockedTasksCount: number;
  overallProgress: number; // e.g. 55
  plannedProgress: number; // e.g. 60
  teamMembers: { id: string; avatarId: string; name: string }[];
}

export function KpiRow({ checkpointsPassed, tasksOpen, blockedTasksCount, overallProgress, plannedProgress, teamMembers }: KpiRowProps) {
  const progressDelta = overallProgress - plannedProgress;
  const isAhead = progressDelta >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
      {/* 1. Checkpoints */}
      <div className="flex flex-col justify-center gap-2 p-6 bg-surface rounded-card shadow-e1 border border-border">
        <span className="text-h3 text-ink">Checkpoints</span>
        <div className="flex items-baseline gap-1">
          <span className="text-display tabular-nums leading-none tracking-tight">{checkpointsPassed.value}</span>
          <span className="text-h3 text-ink-muted">/ {checkpointsPassed.total}</span>
        </div>
      </div>

      {/* 2. Tasks open */}
      <div className="flex flex-col justify-center gap-2 p-6 bg-surface rounded-card shadow-e1 border border-border">
        <span className="text-h3 text-ink">Tasks open</span>
        <span className="text-display tabular-nums leading-none tracking-tight">{tasksOpen.value}</span>
        <div className="flex items-center gap-3 text-caption text-ink-muted mt-1 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-info-solid" /> In progress</span>
          {blockedTasksCount > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger-solid" /> Blocked</span>}
        </div>
      </div>

      {/* 3. Overall progress */}
      <div className="flex flex-col justify-center gap-2 p-6 bg-surface rounded-card shadow-e1 border border-border">
        <div className="flex items-center justify-between">
          <span className="text-h3 text-ink">Overall progress</span>
          <span className={`text-caption px-2 py-0.5 rounded-pill ${isAhead ? 'bg-success-fill text-success-text' : 'bg-peach-fill text-peach-text'}`}>
            {isAhead ? '+' : ''}{progressDelta}% vs plan
          </span>
        </div>
        <ProgressRow label="Actual" percent={overallProgress} colorClass={isAhead ? "bg-success-solid" : "bg-peach-solid"} className="mt-2" />
      </div>

      {/* 4. Team active */}
      <div className="flex flex-col justify-center gap-2 p-6 bg-surface rounded-card shadow-e1 border border-border">
        <span className="text-h3 text-ink">Team active</span>
        <div className="flex items-center mt-2 -space-x-2">
          {teamMembers.slice(0, 4).map(m => (
            <div key={m.id} className="relative ring-2 ring-surface rounded-full">
              <UserAvatar initials={m.avatarId} size="md" />
            </div>
          ))}
          {teamMembers.length > 4 && (
            <div className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center text-caption font-bold ring-2 ring-surface z-10">
              +{teamMembers.length - 4}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
