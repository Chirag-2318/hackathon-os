import React, { useState } from 'react';
import type { ActivityHeatmapDto, DailyActivityDto } from '../types';
import { formatIsoDate } from '@/shared/lib/format';

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

  // Calculate month labels above weeks
  const monthLabels: { index: number; label: string }[] = [];
  let lastMonth = '';
  weeks.forEach((week, wIdx) => {
    const firstDay = week[0];
    if (firstDay?.date) {
      const m = firstDay.date.match(/^\d{4}-(\d{1,2})/);
      if (m) {
        const moNum = parseInt(m[1], 10);
        const moNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const name = moNames[moNum - 1] || '';
        if (name && name !== lastMonth) {
          monthLabels.push({ index: wIdx, label: name });
          lastMonth = name;
        }
      }
    }
  });

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-foreground/[0.06] border-border/40';
    if (count <= 2) return 'bg-emerald-500/25 border-emerald-500/35';
    if (count <= 5) return 'bg-emerald-500/55 border-emerald-500/65';
    if (count <= 9) return 'bg-emerald-500/80 border-emerald-500/90';
    return 'bg-emerald-500 border-emerald-400';
  };

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

  return (
    <section className="space-y-3 px-4 sm:px-6 pt-6">
      <div>
        <h2 className="text-[22px] font-display font-normal tracking-tight text-foreground flex items-center gap-2">
          <span>Build Activity</span>
          <span className="font-mono text-xs text-muted-foreground">({heatmap.totalActions} actions)</span>
        </h2>
        <p className="text-xs text-muted-foreground">Tasks confirmed, code commits, ideas validated, and docs updated</p>
      </div>

      {/* Heatmap Grid Container: no filled grey panel */}
      <div className="relative rounded-[14px] border border-border bg-transparent p-4 overflow-x-auto">
        <div className="inline-flex flex-col gap-2 min-w-max">
          {/* Month labels above */}
          <div className="flex pl-8 gap-[3px] text-[10px] font-mono text-muted-foreground h-4">
            {weeks.map((_, wIdx) => {
              const ml = monthLabels.find((m) => m.index === wIdx);
              return (
                <div key={wIdx} className="w-[12px] shrink-0 text-left overflow-visible whitespace-nowrap">
                  {ml ? ml.label : ''}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            {/* Day of week labels */}
            <div className="flex flex-col justify-between py-0.5 text-[9px] font-mono text-muted-foreground select-none w-6 shrink-0">
              {dayLabels.map((label, idx) => (
                <span key={idx} className="h-[12px] leading-[12px]">{label}</span>
              ))}
            </div>

            {/* Week columns: fixed 12px cells, 3px gap, 3px radius, left aligned */}
            <div className="flex gap-[3px] shrink-0">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px] shrink-0">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`h-[12px] w-[12px] min-h-[12px] min-w-[12px] rounded-[3px] border cursor-pointer transition-transform hover:scale-125 ${getColorClass(day.count)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend below */}
          <div className="flex items-center justify-between pt-2 pl-8 border-t border-border/50 text-[10px] font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="h-[10px] w-[10px] rounded-[2px] border bg-foreground/[0.06] border-border/40" />
              <div className="h-[10px] w-[10px] rounded-[2px] border bg-emerald-500/25 border-emerald-500/35" />
              <div className="h-[10px] w-[10px] rounded-[2px] border bg-emerald-500/55 border-emerald-500/65" />
              <div className="h-[10px] w-[10px] rounded-[2px] border bg-emerald-500/80 border-emerald-500/90" />
              <div className="h-[10px] w-[10px] rounded-[2px] border bg-emerald-500 border-emerald-400" />
              <span>More</span>
            </div>

            {hoveredDay && (
              <div className="flex items-center gap-2">
                <span>{formatIsoDate(hoveredDay.date)}: <strong className="text-emerald-500">{hoveredDay.count} actions</strong></span>
                <span className="hidden sm:inline text-muted-foreground">
                  ({hoveredDay.tasksCount} tasks, {hoveredDay.commitsCount} commits, {hoveredDay.ideasCount} ideas, {hoveredDay.docsCount} docs)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Busiest day caption */}
      {heatmap.busiestDay && (
        <p className="text-xs text-muted-foreground font-mono">
          Biggest day:{' '}
          <span className="text-foreground font-medium">
            {heatmap.busiestDay.count} actions on {formatIsoDate(heatmap.busiestDay.date)}
            {heatmap.busiestDay.roomName ? ` across ${heatmap.busiestDay.roomName}` : ''}.
          </span>
        </p>
      )}
    </section>
  );
};
