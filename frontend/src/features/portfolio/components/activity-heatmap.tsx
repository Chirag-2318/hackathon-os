import React, { useState } from 'react';
import type { ActivityHeatmapDto, DailyActivityDto } from '../types';

interface ActivityHeatmapProps {
  heatmap: ActivityHeatmapDto;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ heatmap }) => {
  const [hoveredDay, setHoveredDay] = useState<DailyActivityDto | null>(null);

  if (!heatmap || !heatmap.days || heatmap.days.length === 0) return null;

  // Group 84 days into 12 columns of 7 rows (weeks)
  const weeks: DailyActivityDto[][] = [];
  let currentWeek: DailyActivityDto[] = [];

  heatmap.days.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === heatmap.days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-neutral-900 border-neutral-800/80';
    if (count <= 2) return 'bg-emerald-950/80 border-emerald-900/70';
    if (count <= 5) return 'bg-emerald-800/80 border-emerald-700/80';
    return 'bg-emerald-500 border-emerald-400';
  };

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

  return (
    <section className="space-y-3 px-4 sm:px-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-neutral-100 flex items-center gap-2">
            <span>Build Activity</span>
            <span className="font-mono text-xs text-neutral-400">({heatmap.totalActions} actions)</span>
          </h2>
          <p className="text-xs text-neutral-400">Tasks confirmed, code commits, ideas validated, and docs updated</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
          <span>Less</span>
          <div className="h-2.5 w-2.5 rounded-xs border bg-neutral-900 border-neutral-800/80" />
          <div className="h-2.5 w-2.5 rounded-xs border bg-emerald-950/80 border-emerald-900/70" />
          <div className="h-2.5 w-2.5 rounded-xs border bg-emerald-800/80 border-emerald-700/80" />
          <div className="h-2.5 w-2.5 rounded-xs border bg-emerald-500 border-emerald-400" />
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="relative rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 overflow-x-auto">
        <div className="flex gap-2 min-w-[500px]">
          {/* Day of week labels */}
          <div className="flex flex-col justify-between py-0.5 text-[9px] font-mono text-neutral-400 select-none">
            {dayLabels.map((label, idx) => (
              <span key={idx} className="h-3 leading-3">{label}</span>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex flex-1 gap-1.5">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5 flex-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`h-3 w-full rounded-xs border cursor-pointer transition-transform hover:scale-125 ${getColorClass(day.count)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {hoveredDay && (
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-300 font-mono border-t border-neutral-800 pt-2 animate-in fade-in duration-100">
            <span>{hoveredDay.date}: <strong className="text-emerald-400">{hoveredDay.count} actions</strong></span>
            <span className="text-[11px] text-neutral-400">
              {hoveredDay.tasksCount} tasks • {hoveredDay.commitsCount} commits • {hoveredDay.ideasCount} ideas • {hoveredDay.docsCount} docs
            </span>
          </div>
        )}
      </div>

      {/* Busiest day caption */}
      {heatmap.busiestDay && (
        <p className="text-xs text-neutral-400 font-mono">
          Biggest day:{' '}
          <span className="text-neutral-200">
            {heatmap.busiestDay.count} actions on {heatmap.busiestDay.date}
            {heatmap.busiestDay.roomName ? ` across ${heatmap.busiestDay.roomName}` : ''}.
          </span>
        </p>
      )}
    </section>
  );
};
