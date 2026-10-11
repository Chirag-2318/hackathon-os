import React, { useState, useMemo } from 'react';
import type { Commit } from '@/services/types';

interface ActivityChartProps {
  commits: Commit[];
  eventStartIso?: string;
}

interface Bucket {
  index: number;
  label: string;
  timeRange: string;
  commits: Commit[];
  isPreKickoff: boolean;
}

export function ActivityChart({
  commits,
  eventStartIso = '2026-10-07T07:00:00+05:30',
}: ActivityChartProps) {
  const [hoveredBucket, setHoveredBucket] = useState<{
    bucket: Bucket;
    x: number;
    y: number;
  } | null>(null);

  const startMs = new Date(eventStartIso).getTime();

  // 16 buckets across 48h (3h each: index 0 to 15)
  // Plus bucket -1 if pre-kickoff commits exist
  const buckets = useMemo(() => {
    const list: Bucket[] = [];

    // Pre-kickoff bucket
    const preCommits = commits.filter((c) => new Date(c.at).getTime() < startMs);
    if (preCommits.length > 0) {
      list.push({
        index: -1,
        label: 'Pre-kickoff',
        timeRange: 'Before event start',
        commits: preCommits,
        isPreKickoff: true,
      });
    }

    const bucketHours = 3;
    for (let i = 0; i < 16; i++) {
      const bStartMs = startMs + i * bucketHours * 3600 * 1000;
      const bEndMs = bStartMs + bucketHours * 3600 * 1000;

      const bCommits = commits.filter((c) => {
        const ms = new Date(c.at).getTime();
        return ms >= bStartMs && ms < bEndMs;
      });

      const startDate = new Date(bStartMs);
      const dayName = startDate.toLocaleDateString('en-US', { weekday: 'short' });
      const timeStr = startDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

      list.push({
        index: i,
        label: `${dayName} ${timeStr}`,
        timeRange: `${dayName} ${timeStr} – ${new Date(bEndMs).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}`,
        commits: bCommits,
        isPreKickoff: false,
      });
    }

    return list;
  }, [commits, startMs]);

  const maxCount = Math.max(...buckets.map((b) => b.commits.length), 10);

  // Chart dimensions
  const svgWidth = 840;
  const svgHeight = 160;
  const paddingLeft = 32;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 28;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const totalSlots = buckets.length;
  const slotWidth = chartWidth / Math.max(totalSlots, 16);
  const barWidth = 14;

  // Markers positions
  // Kickoff at start of normal buckets
  const kickoffX = paddingLeft + (buckets[0]?.isPreKickoff ? slotWidth : 0);
  // Feature freeze at hour 36 (bucket 12)
  const freezeX = kickoffX + 12 * slotWidth;
  // Now marker at hour 39 (bucket 13)
  const nowX = kickoffX + 13 * slotWidth;

  return (
    <div className="relative w-full overflow-x-auto select-none py-2">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-[160px] min-w-[700px] overflow-visible"
        onMouseLeave={() => setHoveredBucket(null)}
      >
        {/* Horizontal gridlines for Y ticks: 0, 5, 10 */}
        {[0, 5, 10].map((tick) => {
          const y = paddingTop + chartHeight - (tick / maxCount) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={svgWidth - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeDasharray="4 4"
                className="text-border/60"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[10px] fill-muted-foreground/70 font-mono"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Kickoff Vertical Line */}
        <line
          x1={kickoffX}
          y1={paddingTop - 6}
          x2={kickoffX}
          y2={paddingTop + chartHeight}
          stroke="#10B981"
          strokeDasharray="3 3"
          strokeWidth="1.5"
        />
        <text
          x={kickoffX + 4}
          y={paddingTop - 8}
          className="text-[10px] font-semibold fill-emerald-600 dark:fill-emerald-400"
        >
          Kickoff
        </text>

        {/* Feature Freeze Vertical Line */}
        <line
          x1={freezeX}
          y1={paddingTop - 6}
          x2={freezeX}
          y2={paddingTop + chartHeight}
          stroke="#F59E0B"
          strokeDasharray="3 3"
          strokeWidth="1.5"
        />
        <text
          x={freezeX + 4}
          y={paddingTop - 8}
          className="text-[10px] font-semibold fill-amber-600 dark:fill-amber-400"
        >
          Freeze
        </text>

        {/* Now Marker */}
        <line
          x1={nowX}
          y1={paddingTop - 6}
          x2={nowX}
          y2={paddingTop + chartHeight}
          stroke="#3B82F6"
          strokeWidth="2"
        />
        <text
          x={nowX + 4}
          y={paddingTop - 8}
          className="text-[10px] font-bold fill-blue-600 dark:fill-blue-400"
        >
          Now
        </text>

        {/* Bars */}
        {buckets.map((b, i) => {
          const count = b.commits.length;
          const barH = count > 0 ? Math.max(4, (count / maxCount) * chartHeight) : 0;
          const x = paddingLeft + i * slotWidth + (slotWidth - barWidth) / 2;
          const y = paddingTop + chartHeight - barH;

          const barColor = b.isPreKickoff
            ? '#EF4444' // Red tint for pre-kickoff rule breaks
            : '#3B5BFF';

          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredBucket({
                  bucket: b,
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                });
              }}
            >
              {/* Invisible touch target */}
              <rect
                x={x - 4}
                y={paddingTop}
                width={barWidth + 8}
                height={chartHeight}
                fill="transparent"
              />
              {/* Visible Bar */}
              {barH > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="4"
                  ry="4"
                  fill={barColor}
                  className="transition-all duration-300 hover:brightness-125"
                  style={{
                    animation: `growUp 500ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 30}ms forwards`,
                    transformOrigin: 'bottom',
                  }}
                />
              )}
            </g>
          );
        })}

        {/* X Axis Ticks (every 12h: Wed 7 AM, Wed 7 PM, Thu 7 AM, Thu 7 PM) */}
        {[0, 4, 8, 12].map((idx) => {
          const x = kickoffX + idx * slotWidth + slotWidth / 2;
          const label = idx === 0 ? 'Wed 7 AM' : idx === 4 ? 'Wed 7 PM' : idx === 8 ? 'Thu 7 AM' : 'Thu 7 PM';
          return (
            <text
              key={idx}
              x={x}
              y={svgHeight - 6}
              textAnchor="middle"
              className="text-[10px] fill-muted-foreground font-medium"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Floating Cursor Tooltip */}
      {hoveredBucket && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 rounded-lg bg-neutral-900 text-white text-xs shadow-xl font-[var(--font-inter)] space-y-1"
          style={{
            left: hoveredBucket.x,
            top: hoveredBucket.y - 8,
          }}
        >
          <div className="font-semibold text-white/90">
            {hoveredBucket.bucket.commits.length} commit{hoveredBucket.bucket.commits.length !== 1 ? 's' : ''}
          </div>
          <div className="text-[11px] text-neutral-300">{hoveredBucket.bucket.timeRange}</div>
          {hoveredBucket.bucket.commits.length > 0 && (
            <div className="text-[11px] text-neutral-400 pt-0.5 border-t border-neutral-700">
              {Object.entries(
                hoveredBucket.bucket.commits.reduce<Record<string, number>>((acc, c) => {
                  const author = (c as any).authorName?.split(' ')[0] || (c.authorId ? 'Teammate' : 'Contributor');
                  acc[author] = (acc[author] || 0) + 1;
                  return acc;
                }, {})
              )
                .map(([author, cnt]) => `${author} ${cnt}`)
                .join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
