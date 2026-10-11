import React, { useState, useRef, useContext } from 'react';
import { cn } from '@/lib/utils';
import { BarChart2 } from 'lucide-react';
import { Dropdown, PairedBarRow, type ChartHue } from './HomeDesignSystem';
import { HomeContext } from '../home-page';

interface MemberWorkload {
  userId: string;
  name: string;
  avatarUrl?: string;
  status: string;
  done: number;
  expected: number;
}

export function TeamWorkload() {
  const { homeData } = useContext(HomeContext);
  const rawMembers: MemberWorkload[] = homeData?.selected?.workload || [];

  const [filter, setFilter] = useState('This phase');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const hueMap: ChartHue[] = ['blue', 'cyan', 'purple', 'teal'];

  const blockedMember = rawMembers.find((m) => m.status === 'blocked');
  const multiplier = filter === 'Overall' ? 2 : 1;

  const maxVal = Math.max(
    16,
    ...rawMembers.map((m) => Math.max(m.done, m.expected) * multiplier)
  );
  const maxAxis = Math.ceil(maxVal / 4) * 4;

  const handleMouseMove = (e: React.MouseEvent, id: string) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setHoveredId(id);
  };

  return (
    <div
      className="bg-white rounded-[var(--radius-home-card)] shadow-[var(--shadow-home-card)] font-[var(--font-inter)] overflow-hidden flex flex-col relative"
      ref={containerRef}
    >
      {/* Header */}
      <div className="px-7 py-6 flex items-center justify-between z-10 relative bg-white">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-[var(--color-home-text-secondary)]" />
          <h2 className="text-[20px] font-[600] text-[var(--color-home-text-primary)]">
            Team workload
          </h2>
        </div>
        <Dropdown
          value={filter}
          options={['This phase', 'Overall']}
          onChange={setFilter}
        />
      </div>

      <div className="h-[1px] bg-[var(--color-home-hairline)] w-full relative z-10" />

      {/* Chart Area */}
      <div className="p-7 relative z-10 bg-white flex-1 min-h-[220px]">
        {/* Gridlines Background */}
        <div className="absolute top-7 bottom-7 left-[148px] right-7 flex justify-between pointer-events-none z-0">
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <div key={pct} className="relative h-full flex flex-col items-center">
              <div className="flex-1 w-px border-l border-dashed border-[#D0D0D0]" />
              <div className="absolute -bottom-6 text-[14px] font-[500] text-[var(--color-home-text-tertiary)] bg-white px-1 -translate-x-1/2 left-1/2">
                {Math.round(maxAxis * pct)}
              </div>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="relative z-10 mb-8" onMouseLeave={() => setHoveredId(null)}>
          {rawMembers.length > 0 ? (
            rawMembers.map((member, idx) => (
              <div
                key={member.userId}
                className={cn(
                  'transition-opacity duration-300',
                  hoveredId && hoveredId !== member.userId ? 'opacity-40' : 'opacity-100'
                )}
                onMouseMove={(e) => handleMouseMove(e, member.userId)}
              >
                <PairedBarRow
                  label={member.name}
                  status={member.status as any}
                  hue={hueMap[idx % hueMap.length]}
                  doneValue={member.done * multiplier}
                  expectedValue={member.expected * multiplier}
                  maxValue={maxAxis}
                />
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-[var(--color-home-text-secondary)]">
              No workload data recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Blocked Alert (Conditional) */}
      {blockedMember && (
        <div className="bg-[var(--color-home-chip-red-bg)] px-7 py-4 flex items-center justify-between border-t border-[var(--color-home-chip-red-bg)] shrink-0 animate-slide-up-alert relative z-20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-home-chip-red-fg)]" />
            <span className="text-[15px] font-[500] text-[var(--color-home-text-primary)]">
              {blockedMember.name} is currently blocked
            </span>
          </div>
          <button
            type="button"
            className="h-8 px-4 rounded-[var(--radius-home-checkbox)] bg-white text-[14px] font-[600] text-[var(--color-home-text-primary)] shadow-sm hover:bg-gray-50 focus-visible:outline-[var(--color-home-accent)] transition-colors"
          >
            Help
          </button>
        </div>
      )}

      {/* Tooltip */}
      <div
        className={cn(
          'absolute pointer-events-none bg-[var(--color-home-tooltip-bg)] text-white p-3 rounded-[12px] shadow-[var(--shadow-home-tooltip)] z-50 min-w-[140px] transition-opacity duration-150 transform -translate-x-1/2 -translate-y-full mt-[-12px]',
          hoveredId ? 'opacity-100' : 'opacity-0'
        )}
        style={{ left: tooltipPos.x, top: tooltipPos.y }}
      >
        {hoveredId && (() => {
          const m = rawMembers.find((x) => x.userId === hoveredId);
          if (!m) return null;
          return (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-baseline">
                <span className="text-[15px] font-[600]">
                  {m.done * multiplier} <span className="font-[400]">done</span>
                </span>
                <span className="text-[12px] text-[var(--color-home-tooltip-lbl)]">
                  {filter.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[15px] font-[600]">
                  {m.expected * multiplier} <span className="font-[400]">expected</span>
                </span>
                <span className="text-[12px] text-[var(--color-home-tooltip-lbl)]">
                  by now
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      <style>{`
        @keyframes slide-up-alert {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up-alert {
          animation: slide-up-alert 400ms var(--ease-home) forwards;
        }
      `}</style>
    </div>
  );
}
