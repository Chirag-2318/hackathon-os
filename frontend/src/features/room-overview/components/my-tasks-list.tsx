import * as React from 'react';
import { ProgressRow } from '@/components/primitives/progress-row';

interface MyTasksListProps {
  tasks: { id: string; title: string; checklistProgressPercent: number; isBlocked?: boolean }[];
}

export function MyTasksList({ tasks }: MyTasksListProps) {
  const displayTasks = tasks.slice(0, 4);

  return (
    <div className="flex flex-col p-5 bg-surface rounded-card border border-border shadow-e0">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-h3 text-ink">Pending tasks</h3>
        <span className="text-caption text-ink-muted bg-surface-sunken px-2 py-0.5 rounded-pill">{tasks.length} tasks</span>
      </header>
      <div className="flex flex-col divide-y divide-border">
        {displayTasks.map(task => (
          <div key={task.id} className="flex flex-col py-4 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.isBlocked ? 'var(--danger-solid)' : 'var(--info-solid)' }} />
              <span className="text-body-strong truncate min-w-0 flex-1">{task.title}</span>
            </div>
            {task.checklistProgressPercent !== undefined && (
              <ProgressRow label="Subtasks" percent={task.checklistProgressPercent} className="ml-5" colorClass="bg-info-solid" />
            )}
          </div>
        ))}
      </div>
      {tasks.length > 4 && (
        <button className="mt-4 text-body-strong text-info-text hover:underline text-left">
          View all {tasks.length} tasks
        </button>
      )}
    </div>
  );
}
