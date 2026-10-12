
import React, { useState, useRef, useContext } from 'react';
import { cn } from '@/lib/utils';
import { Users, BarChart2, Plus, Shield, User as UserIcon } from 'lucide-react';
import { Dropdown, PairedBarRow, type ChartHue, TagChip } from './HomeDesignSystem';
import { HomeContext } from '../home-page';
import { useOverlay } from '@/app/providers/overlay-store';

interface MemberWorkload {
  userId: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  status: string;
  done: number;
  expected: number;
}

export function TeamWorkload() {
  const { homeData } = useContext(HomeContext);
  const selected = homeData?.selected;
  const stage = (selected?.stage || '').toLowerCase();
  const isPlanning = selected?.variant === 'planning' || ['brief', 'ideate', 'plan'].includes(stage);

  const inviteModal = useOverlay('invite-code-dialog');

  // In planning mode, render the Team panel
  if (isPlanning) {
    const rawMembers: any[] = selected?.team?.members || selected?.members || selected?.workload || [];
    const members = rawMembers.map((m: any) => {
      const rawRole = (m.role || '').toUpperCase();
      const roleLabel = rawRole === 'LEADER' ? 'Leader' : rawRole === 'BUILDER' ? 'Member' : m.role || 'Member';
      return {
        id: m.userId || m.id || m.name,
        name: m.name || 'Team member',
        role: roleLabel,
        isLeader: rawRole === 'LEADER',
        avatarUrl: m.avatarUrl,
      };
    });

    return (
      <div className="bg-white rounded-[var(--radius-home-card)] shadow-[var(--shadow-home-card)] font-[var(--font-inter)] overflow-hidden flex flex-col w-full min-w-0">
        <div className="px-6 py-5 flex items-center justify-between border-b border-[var(--color-home-hairline)] bg-white">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--color-home-text-secondary)]" />
            <h2 className="text-[20px] font-[600] text-[var(--color-home-text-primary)]">
              Team
            </h2>
            <TagChip label={`${members.length} MEMBERS`} color="blue" />
          </div>
          <button
            type="button"
            onClick={() => inviteModal.open()}
            className="h-8 px-3 rounded-[var(--radius-home-btn)] bg-[var(--color-home-text-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5" /> Add member
          </button>
        </div>

        <div className="p-6 flex flex-col divide-y divide-[var(--color-home-hairline)] min-h-[180px]">
          {members.length > 0 ? (
            members.map((m) => (
              <div key={m.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-full bg-[var(--color-home-tray)] flex items-center justify-center font-bold text-xs text-[var(--color-home-text-primary)] shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-semibold text-[var(--color-home-text-primary)] truncate">
                      {m.name}
                    </span>
                    <span className="text-[12px] text-[var(--color-home-text-secondary)]">
                      {m.role}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {m.isLeader ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-[11px] font-semibold flex items-center gap-1">
                      <Shield className="size-3" /> Leader
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-medium flex items-center gap-1">
                      <UserIcon className="size-3" /> Member
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-[var(--color-home-text-secondary)]">
              No team members found.
            </div>
          )}
        </div>
      </div>
    );
  }

  const rawMembers: MemberWorkload[] = selected?.workload || [];
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
      className="bg-white rounded-[var(--radius-home-card)] shadow-[var(--shadow-home-card)] font-[var(--font-inter)] overflow-hidden flex flex-col relative w-full min-w-0"
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
