import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { BarChart2 } from 'lucide-react';
import { Dropdown, PairedBarRow, type ChartHue } from './HomeDesignSystem';
import { mockTeamMembers } from '../homeMock';

export function TeamWorkload() {
  const [filter, setFilter] = useState('This phase');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple mapping of member index to hue for consistency
  const hueMap: ChartHue[] = ['blue', 'cyan', 'purple', 'teal'];

  const blockedMember = mockTeamMembers.find(m => m.status === 'blocked');

  // Multiplier for mock "Overall" data switch
  const multiplier = filter === 'Overall' ? 3 : 1;
  const maxAxis = 16 * multiplier;

  const handleMouseMove = (e: React.MouseEvent, id: string) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setHoveredId(id);
  };

  return (
    <div className="bg-white rounded-[var(--radius-home-card)] shadow-[var(--shadow-home-card)] font-[var(--font-inter)] overflow-hidden flex flex-col relative" ref={containerRef}>
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
      <div className="p-7 relative z-10 bg-white flex-1">
        
        {/* Gridlines Background */}
        <div className="absolute top-7 bottom-7 left-[148px] right-7 flex justify-between pointer-events-none z-0">
          {[0, 4, 8, 12, 16].map((tick) => (
            <div key={tick} className="relative h-full flex flex-col items-center">
              <div className="flex-1 w-px border-l border-dashed border-[#D0D0D0]" />
              <div className="absolute -bottom-6 text-[14px] font-[500] text-[var(--color-home-text-tertiary)] bg-white px-1 -translate-x-1/2 left-1/2">
                {tick * multiplier}
              </div>
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="relative z-10 mb-8" onMouseLeave={() => setHoveredId(null)}>
          {mockTeamMembers.map((member, idx) => (
            <div
              key={member.id}
              className={cn(
                "transition-opacity duration-300",
                hoveredId && hoveredId !== member.id ? "opacity-40" : "opacity-100"
              )}
              onMouseMove={(e) => handleMouseMove(e, member.id)}
            >
              <PairedBarRow 
                label={member.firstName}
                status={member.status}
                hue={hueMap[idx % hueMap.length]}
                doneValue={member.tasksDoneThisPhase * multiplier}
                expectedValue={member.tasksExpectedByNow * multiplier}
                maxValue={maxAxis}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Blocked Alert (Conditional) */}
      {blockedMember && (
        <div className="bg-[var(--color-home-chip-red-bg)] px-7 py-4 flex items-center justify-between border-t border-[var(--color-home-chip-red-bg)] shrink-0 animate-slide-up-alert relative z-20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-home-chip-red-fg)]" />
            <span className="text-[15px] font-[500] text-[var(--color-home-text-primary)]">
              {blockedMember.firstName} is blocked on API deploy
            </span>
          </div>
          <button className="h-8 px-4 rounded-[var(--radius-home-checkbox)] bg-white text-[14px] font-[600] text-[var(--color-home-text-primary)] shadow-sm hover:bg-gray-50 focus-visible:outline-[var(--color-home-accent)] transition-colors">
            Help
          </button>
        </div>
      )}

      {/* Tooltip */}
      <div 
        className={cn(
          "absolute pointer-events-none bg-[var(--color-home-tooltip-bg)] text-white p-3 rounded-[12px] shadow-[var(--shadow-home-tooltip)] z-50 min-w-[140px] transition-opacity duration-150 transform -translate-x-1/2 -translate-y-full mt-[-12px]",
          hoveredId ? "opacity-100" : "opacity-0"
        )}
        style={{ left: tooltipPos.x, top: tooltipPos.y }}
      >
        {hoveredId && (() => {
          const m = mockTeamMembers.find(x => x.id === hoveredId)!;
          return (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-baseline">
                <span className="text-[15px] font-[600]">{m.tasksDoneThisPhase * multiplier} <span className="font-[400]">done</span></span>
                <span className="text-[12px] text-[var(--color-home-tooltip-lbl)]">{filter.toLowerCase()}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[15px] font-[600]">{m.tasksExpectedByNow * multiplier} <span className="font-[400]">expected</span></span>
                <span className="text-[12px] text-[var(--color-home-tooltip-lbl)]">by now</span>
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
