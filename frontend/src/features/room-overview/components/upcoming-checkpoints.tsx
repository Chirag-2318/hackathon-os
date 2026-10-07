import * as React from 'react';
import { ProgressRow } from '@/components/primitives/progress-row';

export function UpcomingCheckpoints() {
  return (
    <div className="flex flex-col p-5 bg-surface-raised rounded-card border border-border shadow-e0 min-w-0">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-h3 text-ink">Upcoming Checkpoints</h3>
      </header>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <span className="text-body-strong truncate flex-1 pr-2">Mid-point demo</span>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-caption text-ink-muted">In 2h</span>
              <span className="w-1.5 h-1.5 rounded-full bg-info-solid ml-1" />
            </div>
          </div>
          <ProgressRow label="Prep" percent={65} colorClass="bg-info-solid" />
        </div>
      </div>
    </div>
  );
}
