import * as React from 'react';
import { TeamHeatmap } from './team-heatmap';

export function ActivityHeatmap({ data }: { data: any[] }) {
  return (
    <div className="flex flex-col p-5 bg-surface-raised rounded-card border border-border shadow-e0">
      <header className="flex items-center justify-between mb-4">
        <h3 className="text-h3 text-ink">Activity heatmap</h3>
        <div className="flex items-center gap-3 text-caption text-ink-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-info-solid" /> Code</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning-solid" /> Docs</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-peach-solid" /> Pitch</span>
        </div>
      </header>
      <div className="w-full">
        <TeamHeatmap data={data} />
      </div>
    </div>
  );
}
