/**
 * RoomOverviewPage — fully redesigned for Campus Build Sprint 2026.
 * Route: /app/room/:id/overview
 *
 * Follows the spec:
 *  - Two independent column stacks (left 7/12, right 5/12)
 *  - All components answer one question, no nesting containers
 *  - Reuses HomeDesignSystem tokens and primitives
 *  - Data from roomMock.ts (single source of truth)
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roomService } from '@/services';
import { PlanningOverview } from './components/PlanningOverview';
import { cn } from '@/lib/utils';
import {
  Check, ChevronDown, ChevronRight, Flag, Link2, AlertCircle,
  Users, BarChart2, Layers, Clock, Zap, X, Circle,
} from 'lucide-react';
import { TagChip, TimeChip, InlineHighlight, Checkbox, PairedBarRow, type ChartHue } from '../home/components/HomeDesignSystem';
import {
  PHASES, CURRENT_PHASE, CURRENT_PHASE_IDX, PHASE_PROGRESS_PCT, ELAPSED_HOURS,
  CHECKPOINTS, CHECKPOINTS_PASSED, CHECKPOINTS_TOTAL,
  ROSTER, ACTIVITY, PROJECT, SKILLS_COVERAGE, MY_TASKS,
  TASKS_SUMMARY, MILESTONES, PLANNED_WAYPOINTS, ACTUAL_WAYPOINTS,
  NOW_HOUR, NOW_ACTUAL_PCT, NOW_PLANNED_PCT, INVITE_LINK,
  type RoomMember, type Checkpoint, type RoomTask,
} from './roomMock';
import { getTasks, getPhases, getRoom, getRoomMembers, CURRENT_USER_ID } from '@/services/mockStore';
import type { Task, BoardPhase } from '@/services/types';

interface RoomOverviewContextValue {
  roomId: string;
  isDemo: boolean;
  tasks: Task[];
  phases: BoardPhase[];
  room: any;
}

const RoomOverviewContext = React.createContext<RoomOverviewContextValue>({
  roomId: 'r-1',
  isDemo: true,
  tasks: [],
  phases: [],
  room: null,
});

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────

/** Avatar with a status dot */
function Avatar({
  member, size = 32, showDot = true
}: { member: RoomMember; size?: 24 | 32; showDot?: boolean }) {
  const dotColor = member.status === 'working' ? '#22A55A'
    : member.status === 'blocked' ? '#E5484D'
    : '#B4B4B8';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center text-white font-[600] select-none"
        style={{
          width: size, height: size,
          background: member.avatarColor,
          fontSize: size === 24 ? 9 : 11,
        }}
        title={`${member.firstName} ${member.lastName}`}
      >
        {member.initials}
      </div>
      {showDot && (
        <span
          className="absolute -bottom-px -right-px rounded-full ring-2 ring-white"
          style={{ width: 8, height: 8, background: dotColor }}
        />
      )}
    </div>
  );
}

/** Overlapping avatar stack */
function AvatarStack({ memberIds, max = 4 }: { memberIds: string[]; max?: number }) {
  const members = memberIds.map(id => ROSTER.find(m => m.id === id)!).filter(Boolean);
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center" style={{ gap: -8 }}>
      {shown.map((m, i) => (
        <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: shown.length - i }}>
          <Avatar member={m} size={24} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="w-6 h-6 rounded-full bg-[#F0F0F0] text-[9px] font-[600] text-[#7A7A7E] flex items-center justify-center ring-2 ring-white"
          style={{ marginLeft: -8, zIndex: 0 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

/** Icon tile: 32×32, tinted background */
function IconTile({
  icon, tint = 'neutral'
}: { icon: React.ReactNode; tint?: 'red' | 'amber' | 'purple' | 'green' | 'blue' | 'neutral' }) {
  const colors = {
    red:     { bg: '#FDE6E6', fg: '#E5484D' },
    amber:   { bg: '#FFF1D6', fg: '#B7791F' },
    purple:  { bg: '#EDE7FF', fg: '#5B3FD0' },
    green:   { bg: '#E4F7E9', fg: '#2E9E55' },
    blue:    { bg: '#E3F1FF', fg: '#1D7FD1' },
    neutral: { bg: '#F0F0F0', fg: '#7A7A7E' },
  };
  const { bg, fg } = colors[tint];
  return (
    <div
      className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
      style={{ background: bg, color: fg }}
    >
      <div className="[&>svg]:w-4 [&>svg]:h-4 [&>svg]:stroke-current">{icon}</div>
    </div>
  );
}

/** SectionCard: white card with optional header, body, footer sections */
function SectionCard({
  children, className
}: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'bg-white rounded-[24px] overflow-hidden',
        'shadow-[0_1px_2px_rgba(16,16,20,0.04),_0_8px_24px_-12px_rgba(16,16,20,0.08)]',
        className
      )}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 flex items-center justify-between', 'h-[44px]', className)}>
      {children}
    </div>
  );
}

function CardHairline() {
  return <div className="h-px bg-[#EEEEEE] w-full" />;
}

function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <>
      <CardHairline />
      <div className={cn('px-5 h-[44px] flex items-center justify-between', className)}>
        {children}
      </div>
    </>
  );
}

/** Sliding SegmentedControl */
function SegmentedControl({
  options, value, onChange, height = 32, id
}: {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  height?: number;
  id?: string;
}) {
  const reactId = React.useId();
  const layoutId = `segmented-${(id || reactId).replace(/[:]/g, '')}`;

  return (
    <div
      role="tablist"
      aria-label="View selector"
      className="relative flex items-center bg-[#EFEFEF] rounded-[14px] p-[3px] shrink-0"
      style={{ height }}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex items-center justify-center gap-1.5 rounded-[11px] transition-colors duration-150 cursor-pointer',
              'text-[12px] font-[600] tracking-[0.01em] focus-visible:outline-2 focus-visible:outline-[#2F9BEA] focus-visible:outline-offset-2',
              isSelected ? 'text-[#141414]' : 'text-[#8A8A8E] hover:text-[#141414]'
            )}
            style={{
              flex: 1,
              height: height - 6,
              paddingInline: '10px',
            }}
            onKeyDown={(e) => {
              const idx = options.findIndex(o => o.value === opt.value);
              if (e.key === 'ArrowRight') onChange(options[(idx + 1) % options.length].value);
              if (e.key === 'ArrowLeft') onChange(options[(idx - 1 + options.length) % options.length].value);
            }}
          >
            {isSelected && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-white rounded-[11px] shadow-sm pointer-events-none"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5 truncate">
              {opt.icon && <span className="[&>svg]:w-3.5 [&>svg]:h-3.5 shrink-0">{opt.icon}</span>}
              <span className="truncate">{opt.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── ENTRANCE ANIMATION ────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={cn('transition-all duration-[520ms]', className)}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {children}
    </div>
  );
}

// ─── COMPONENT 1: PAGE HEADER ─────────────────────────────────────────────────
function PageHeader() {
  const { isDemo, room, phases } = React.useContext(RoomOverviewContext);
  const title = !isDemo && room ? room.name : 'Campus Build Sprint 2026';
  const phaseLabel = !isDemo && phases.length > 0 ? phases[0].name.replace(/^Phase\s*\d+:\s*/i, '').toUpperCase() : 'POLISH PHASE';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <h1 className="text-[24px] font-[600] text-[#141414] tracking-[-0.02em] shrink-0">
        {title}
      </h1>
      <div className="flex items-center gap-2 flex-wrap">
        <TagChip label="CAMPUS" color="green" />
        <TagChip label={phaseLabel} color="blue" />
        <div className="h-[28px] rounded-full flex items-center gap-1.5 px-3 bg-[#F0F0F0] text-[#7A7A7E] text-[12px] font-[600] uppercase tracking-[0.02em] shrink-0">
          <Clock className="w-3.5 h-3.5" />
          Hour {ELAPSED_HOURS} of 48
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT 2: STATUS BAND ─────────────────────────────────────────────────
function StatusBand() {
  const { isDemo, tasks, phases } = React.useContext(RoomOverviewContext);
  const [mounted, setMounted] = useState(false);
  const [tickCounts, setTickCounts] = useState(0);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setTickCounts(i);
        if (i >= CHECKPOINTS_TOTAL) clearInterval(interval);
      }, 40);
      return () => clearInterval(interval);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const activePhases = (!isDemo && phases.length > 0)
    ? phases.map(p => ({
        label: p.name.replace(/^Phase\s*\d+:\s*/i, ''),
        widthPct: p.endPct - p.startPct,
      }))
    : PHASES;

  // Calculate elapsed width for phase bar
  let elapsedWidth = 0;
  for (let i = 0; i < CURRENT_PHASE_IDX; i++) elapsedWidth += (activePhases[i]?.widthPct || 20);
  elapsedWidth += (activePhases[CURRENT_PHASE_IDX]?.widthPct || 20) * (PHASE_PROGRESS_PCT / 100);

  // Stacked task bar widths
  const openTasks = (!isDemo && tasks.length > 0) ? tasks.filter(t => t.status !== 'done') : [];
  const taskTotal = (!isDemo && tasks.length > 0) ? (openTasks.length || 1) : TASKS_SUMMARY.open;
  const toDoCount = (!isDemo && tasks.length > 0) ? tasks.filter(t => t.status === 'todo').length : TASKS_SUMMARY.toDo;
  const inProgressCount = (!isDemo && tasks.length > 0) ? tasks.filter(t => t.status === 'inprogress').length : TASKS_SUMMARY.inProgress;
  const blockedCount = (!isDemo && tasks.length > 0) ? tasks.filter(t => t.flagged || t.status === 'blocked').length : TASKS_SUMMARY.blocked;

  const toDoW = (toDoCount / taskTotal) * 100;
  const ipW = (inProgressCount / taskTotal) * 100;
  const blW = (blockedCount / taskTotal) * 100;

  return (
    <SectionCard>
      {/* Section 1: Timeline */}
      <div className="px-5 py-4">
        {/* Above bar label row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-[#8A8A8E] font-[500]">Hour {ELAPSED_HOURS} of 48</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] text-[#8A8A8E] font-[500]">Submit in</span>
            <TimeChip timeRemaining="9h 05m" urgent />
          </div>
        </div>

        {/* Phase bar */}
        <div className="relative">
          {/* Milestone flags above bar */}
          <div className="relative h-5 mb-1">
            {MILESTONES.map((m) => {
              const leftPct = (m.hourOffset / 48) * 100;
              return (
                <div
                  key={m.id}
                  className="absolute -translate-x-1/2 group"
                  style={{ left: `${leftPct}%` }}
                >
                  <Flag
                    className={cn(
                      'w-3.5 h-3.5 cursor-default',
                      m.passed ? 'text-[#141414]' : m.id === 'demo-video' ? 'text-[#B7791F]' : 'text-[#8A8A8E]'
                    )}
                    fill={m.passed ? '#141414' : 'none'}
                    strokeWidth={m.passed ? 0 : 1.75}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-20">
                    <div className="bg-[#222222] text-white text-[12px] px-2.5 py-1.5 rounded-[8px] whitespace-nowrap shadow-lg">
                      <div className="font-[600]">{m.label}</div>
                      <div className="text-[#9A9A9A] text-[11px]">{m.passed ? 'Passed' : m.id === 'demo-video' ? 'Fri 1:30 AM' : 'Fri 7:00 AM'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Segmented bar */}
          <div className="flex gap-[3px] h-[10px] w-full">
            {PHASES.map((phase, idx) => {
              const isPast = idx < CURRENT_PHASE_IDX;
              const isCurrent = idx === CURRENT_PHASE_IDX;
              return (
                <div
                  key={phase.label}
                  className="relative h-full rounded-[5px] overflow-hidden"
                  style={{ width: `${phase.widthPct}%`, backgroundColor: '#E8E8E8' }}
                >
                  <div
                    className="absolute left-0 top-0 h-full rounded-[5px] transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      width: mounted ? (isPast ? '100%' : isCurrent ? `${PHASE_PROGRESS_PCT}%` : '0%') : '0%',
                      backgroundColor: isPast ? '#141414' : isCurrent ? '#2F9BEA' : 'transparent',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Pulsing "you are here" marker */}
          <div
            className="absolute top-[5px] -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-[2.5px] border-[#2F9BEA] z-10 transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              left: mounted ? `${elapsedWidth}%` : '0%',
              animation: 'pulse-marker 2.4s infinite cubic-bezier(0.66, 0, 0, 1)',
            }}
          />

          {/* Phase labels */}
          <div className="flex gap-[3px] mt-2 w-full">
            {PHASES.map((phase, idx) => (
              <div
                key={phase.label}
                className={cn(
                  'text-[11px] text-center truncate',
                  idx === CURRENT_PHASE_IDX
                    ? 'text-[#141414] font-[600]'
                    : 'text-[#B4B4B8] font-[500]'
                )}
                style={{ width: `${phase.widthPct}%` }}
              >
                {phase.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <CardHairline />

      {/* Section 2: Vitals grid */}
      <div className="grid grid-cols-4 divide-x divide-[#EEEEEE]">
        {/* 1. Checkpoints */}
        <div className="px-5 py-3.5">
          <div className="text-[11px] text-[#8A8A8E] font-[500] uppercase tracking-[0.06em] mb-1">Checkpoints</div>
          <div className="text-[26px] font-[600] text-[#141414] tabular-nums leading-none mb-2">
            {CHECKPOINTS_PASSED} / {CHECKPOINTS_TOTAL}
          </div>
          <div className="flex items-center gap-[3px]">
            {CHECKPOINTS.map((cp, i) => (
              <div
                key={cp.id}
                className="h-[4px] rounded-[2px] transition-all duration-[200ms]"
                style={{
                  width: 16,
                  backgroundColor:
                    cp.status === 'done' && i < tickCounts ? '#141414'
                    : cp.status === 'current' && i < tickCounts ? '#2F9BEA'
                    : '#E8E8E8',
                  transitionDelay: `${i * 40}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* 2. Tasks open */}
        <div className="px-5 py-3.5">
          <div className="text-[11px] text-[#8A8A8E] font-[500] uppercase tracking-[0.06em] mb-1">Tasks open</div>
          <div className="text-[26px] font-[600] text-[#141414] tabular-nums leading-none mb-2">
            {TASKS_SUMMARY.open}
          </div>
          {/* Stacked bar */}
          <div className="flex h-[6px] rounded-[3px] overflow-hidden gap-[2px] mb-1.5">
            <div className="rounded-l-[3px] bg-[#E8E8E8] transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: mounted ? `${toDoW}%` : '0%' }} />
            <div className="bg-[#2F9BEA] transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: mounted ? `${ipW}%` : '0%', transitionDelay: '100ms' }} />
            <div className="rounded-r-[3px] bg-[#E5484D] transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: mounted ? `${blW}%` : '0%', transitionDelay: '200ms' }} />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#8A8A8E]">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#E8E8E8] inline-block" />{TASKS_SUMMARY.toDo}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#2F9BEA] inline-block" />{TASKS_SUMMARY.inProgress}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] inline-block" />{TASKS_SUMMARY.blocked}</span>
          </div>
        </div>

        {/* 3. Vs plan */}
        <div className="px-5 py-3.5">
          <div className="text-[11px] text-[#8A8A8E] font-[500] uppercase tracking-[0.06em] mb-1">Vs plan</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[26px] font-[600] text-[#141414] tabular-nums leading-none">
              {TASKS_SUMMARY.delta}%
            </span>
            <div className="h-[20px] rounded-[6px] px-2 flex items-center bg-[#FFF1D6] text-[#B7791F] text-[10px] font-[700] uppercase tracking-[0.06em]">
              BEHIND
            </div>
          </div>
          <div className="text-[11px] text-[#8A8A8E]">
            {TASKS_SUMMARY.actualPct}% done · {TASKS_SUMMARY.plannedPct}% planned
          </div>
        </div>

        {/* 4. Team active */}
        <div className="px-5 py-3.5">
          <div className="text-[11px] text-[#8A8A8E] font-[500] uppercase tracking-[0.06em] mb-1">Team active</div>
          <div className="text-[26px] font-[600] text-[#141414] tabular-nums leading-none mb-2">
            4 / 6
          </div>
          <AvatarStack memberIds={ROSTER.map(m => m.id)} max={4} />
        </div>
      </div>

      <style>{`
        @keyframes pulse-marker {
          0% { box-shadow: 0 0 0 0 rgba(47, 155, 234, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(47, 155, 234, 0); }
          100% { box-shadow: 0 0 0 0 rgba(47, 155, 234, 0); }
        }
      `}</style>
    </SectionCard>
  );
}

// ─── COMPONENT 3: NEEDS ATTENTION ─────────────────────────────────────────────
const ATTENTION_ITEMS = [
  {
    id: 'att1', tint: 'red' as const,
    title: '2 tasks blocked',
    reason: 'API deploy (Ishita), Auth callback (Priya)',
    ownerIds: ['m2', 'm5'],
    linkText: 'View blocked',
    href: '#',
  },
  {
    id: 'att2', tint: 'amber' as const,
    title: 'Demo rehearsed 1 of 3',
    reason: 'Must finish before recording the video',
    ownerIds: ['m1'],
    linkText: 'Open rehearsal',
    href: '#',
  },
  {
    id: 'att3', tint: 'purple' as const,
    title: 'No one covers Presentation',
    reason: 'Add a presenter before the demo',
    ownerIds: [],
    linkText: 'Assign role',
    href: '#',
  },
];

function NeedsAttention() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const items = ATTENTION_ITEMS.filter(i => !dismissed.includes(i.id));

  return (
    <SectionCard>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-[600] text-[#141414]">Needs attention</span>
          <div className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#F0F0F0] text-[11px] font-[600] text-[#7A7A7E] flex items-center justify-center tabular-nums">
            {items.length}
          </div>
        </div>
      </CardHeader>
      <CardHairline />

      {items.length === 0 ? (
        <div className="px-5 py-4 flex items-center gap-3">
          <IconTile icon={<Check />} tint="green" />
          <span className="text-[14px] text-[#8A8A8E] font-[500]">
            All clear. Nothing needs attention.
          </span>
        </div>
      ) : (
        <div>
          {items.map((item, i) => (
            <div
              key={item.id}
              className="px-5 py-3 flex items-center gap-3 hover:bg-[#FAFAFA] transition-colors duration-150 group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <IconTile
                icon={item.tint === 'red' ? <AlertCircle /> : item.tint === 'amber' ? <Clock /> : <Users />}
                tint={item.tint}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-[500] text-[#141414] truncate">{item.title}</div>
                <div className="text-[12px] text-[#8A8A8E] truncate">{item.reason}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.ownerIds.length > 0 && (
                  <AvatarStack memberIds={item.ownerIds} max={3} />
                )}
                <InlineHighlight asLink href={item.href}>
                  <span className="text-[13px] whitespace-nowrap">{item.linkText}</span>
                </InlineHighlight>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── COMPONENT 4: CHECKPOINTS ─────────────────────────────────────────────────
function CheckpointsCard() {
  const { isDemo, phases: flowPhases } = React.useContext(RoomOverviewContext);
  const [view, setView] = useState<'remaining' | 'all'>('remaining');
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [railMounted, setRailMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRailMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  const activeCheckpoints = (!isDemo && flowPhases.length > 0)
    ? flowPhases.map((p, idx) => ({
        id: p.id,
        label: p.exitCheckpoint || p.name,
        status: (idx === 0 ? 'done' : idx === 1 ? 'current' : 'upcoming') as 'done' | 'current' | 'upcoming',
        timeLabel: `Phase ${idx}`,
      }))
    : CHECKPOINTS;

  const done = activeCheckpoints.filter(c => c.status === 'done');
  const rest = activeCheckpoints.filter(c => c.status !== 'done');
  const passedCount = done.length;
  const totalCount = activeCheckpoints.length;

  const shown = view === 'all'
    ? activeCheckpoints
    : (doneExpanded ? [...done, ...rest] : rest);

  // Map for rail drawing
  const allForRail = view === 'all' ? activeCheckpoints : (doneExpanded ? [...done, ...rest] : rest);

  return (
    <SectionCard>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-[600] text-[#141414]">Checkpoints</span>
          <div className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#F0F0F0] text-[11px] font-[600] text-[#7A7A7E] flex items-center justify-center tabular-nums">
            {passedCount} / {totalCount}
          </div>
        </div>
        <SegmentedControl
          id="checkpoints-view"
          options={[
            { value: 'remaining', label: 'Remaining' },
            { value: 'all', label: 'All' },
          ]}
          value={view}
          onChange={(v) => setView(v as 'remaining' | 'all')}
          height={32}
        />
      </CardHeader>
      <CardHairline />

      <div className="px-5 py-3 relative">
        {/* Done summary row (only in "remaining" view) */}
        {view === 'remaining' && (
          <button
            className="w-full flex items-center gap-3 py-2 hover:bg-[#FAFAFA] rounded-[8px] px-1 -mx-1 transition-colors duration-150 mb-1"
            onClick={() => setDoneExpanded(!doneExpanded)}
            aria-expanded={doneExpanded}
          >
            {/* Status circle */}
            <div className="w-5 h-5 rounded-full bg-[#141414] flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <span className="text-[13px] text-[#8A8A8E] font-[500] flex-1 text-left">
              {passedCount} checkpoints done
            </span>
            <ChevronRight
              className={cn('w-4 h-4 text-[#B4B4B8] transition-transform duration-200', doneExpanded && 'rotate-90')}
            />
          </button>
        )}

        {/* Checkpoint rows with tree rail */}
        <div className="relative">
          {/* SVG rail */}
          <svg
            className="absolute left-[10px] top-0 pointer-events-none"
            style={{ width: 2, height: '100%' }}
            preserveAspectRatio="none"
          >
            <line
              x1="1" y1="0" x2="1" y2="100%"
              stroke="#EEEEEE"
              strokeWidth="2"
              strokeDasharray={railMounted ? 'none' : '4 4'}
            />
          </svg>

          {allForRail.map((cp, i) => {
            const isDone = cp.status === 'done';
            const isCurrent = cp.status === 'current';
            const isHidden = view === 'remaining' && !doneExpanded && isDone;
            return (
              <div
                key={cp.id}
                className={cn(
                  'flex items-center gap-3 py-2.5 pl-1 transition-all duration-[280ms]',
                  isHidden && 'hidden',
                  'hover:bg-[#FAFAFA] rounded-[8px] -mx-1 px-2 cursor-pointer group/cp'
                )}
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => {}} // placeholder
              >
                {/* Status circle */}
                <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center relative z-10"
                  style={{
                    background: isDone ? '#141414' : isCurrent ? 'white' : 'white',
                    border: isDone ? 'none' : isCurrent ? '2px solid #2F9BEA' : '2px solid #D0D0D0',
                  }}
                >
                  {isDone && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  {isCurrent && (
                    <div className="w-2.5 h-2.5 rounded-full" style={{
                      background: 'conic-gradient(#2F9BEA 50%, transparent 50%)'
                    }} />
                  )}
                </div>

                {/* Label */}
                <span className={cn(
                  'text-[14px] flex-1 truncate',
                  isDone ? 'text-[#8A8A8E] font-[400]' : isCurrent ? 'text-[#141414] font-[600]' : 'text-[#141414] font-[500]'
                )}>
                  {cp.label}
                </span>

                {/* Right value */}
                <div className="shrink-0">
                  {isCurrent ? (
                    <div className="flex items-center gap-1 h-[24px] rounded-[10px] px-2.5 bg-[#E3F1FF] text-[#1D7FD1] text-[12px] font-[600]">
                      <span>{cp.progress?.done} / {cp.progress?.total} rehearsals</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  ) : isDone ? (
                    <span className="text-[12px] text-[#B4B4B8] font-[500]">{cp.timeLabel}</span>
                  ) : (
                    <TimeChip timeRemaining={cp.timeLabel} urgent={cp.timeLabel.includes('3h') || cp.timeLabel.includes('9h')} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CardFooter>
        <button className="text-[13px] font-[500] text-[#8A8A8E] hover:text-[#141414] transition-colors focus-visible:outline-2 focus-visible:outline-[#2F9BEA] focus-visible:outline-offset-2 rounded-[4px]">
          Edit checkpoints
        </button>
        <span className="text-[12px] text-[#B4B4B8]">Next gate in 3h 30m</span>
      </CardFooter>
    </SectionCard>
  );
}

// ─── COMPONENT 5: MY TASKS ────────────────────────────────────────────────────
const ALL_ROOM_TASKS: RoomTask[] = [
  ...MY_TASKS,
  {
    id: 't-all-1',
    title: 'Review auth callback error handling',
    group: 'NOW',
    tagLabel: 'BACKEND',
    tagColor: 'blue',
    timeEstimate: 'in 1h',
    completed: false,
  },
  {
    id: 't-all-2',
    title: 'Fix responsive navigation drawer for mobile',
    group: 'TODAY',
    tagLabel: 'FRONTEND',
    tagColor: 'green',
    timeEstimate: 'in 3h',
    subtasks: { done: 1, total: 3 },
    completed: false,
  },
  {
    id: 't-all-3',
    title: 'Generate pitch presentation deck template',
    group: 'TODAY',
    tagLabel: 'DESIGN',
    tagColor: 'purple',
    timeEstimate: 'in 4h',
    completed: false,
  },
  {
    id: 't-all-4',
    title: 'Prepare final submission zip package',
    group: 'LATER',
    tagLabel: 'SUBMIT',
    tagColor: 'red',
    timeEstimate: 'in 7h',
    completed: false,
  },
];

function MyTasksCard() {
  const { isDemo, tasks: flowTasks } = React.useContext(RoomOverviewContext);
  const [taskView, setTaskView] = useState<'mine' | 'all'>('mine');

  const userRoomTasks: RoomTask[] = (!isDemo && flowTasks.length > 0)
    ? flowTasks
        .filter(t => t.assigneeId === CURRENT_USER_ID && t.status !== 'done')
        .slice(0, 4)
        .map(t => ({
          id: t.id,
          title: t.summary,
          group: 'NOW' as const,
          tagLabel: (t.role || 'FRONTEND').toUpperCase(),
          tagColor: 'blue' as const,
          timeEstimate: t.estimateMin ? `${t.estimateMin}m` : '45m',
          completed: false,
        }))
    : MY_TASKS;

  const allRoomTasks: RoomTask[] = (!isDemo && flowTasks.length > 0)
    ? flowTasks
        .filter(t => t.status !== 'done')
        .slice(0, 10)
        .map(t => ({
          id: t.id,
          title: t.summary,
          group: 'TODAY' as const,
          tagLabel: (t.role || 'TASK').toUpperCase(),
          tagColor: 'green' as const,
          timeEstimate: t.estimateMin ? `${t.estimateMin}m` : '45m',
          completed: false,
        }))
    : ALL_ROOM_TASKS;

  const [tasks, setTasks] = useState<RoomTask[]>(userRoomTasks);

  useEffect(() => {
    setTasks(taskView === 'all' ? allRoomTasks : userRoomTasks);
  }, [taskView, flowTasks, isDemo]);

  const count = tasks.filter(t => !t.completed).length;

  const handleComplete = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
    setTimeout(() => setTasks(prev => prev.filter(t => t.id !== taskId)), 320);
  };

  const groups: ('NOW' | 'TODAY' | 'LATER')[] = ['NOW', 'TODAY', 'LATER'];
  const activeTasks = tasks.filter(t => !t.completed);

  return (
    <SectionCard>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-[600] text-[#141414]">My tasks</span>
          <div className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#F0F0F0] text-[11px] font-[600] text-[#7A7A7E] flex items-center justify-center tabular-nums">
            {count}
          </div>
        </div>
        <SegmentedControl
          id="tasks-view"
          options={[
            { value: 'mine', label: 'Mine' },
            { value: 'all', label: 'All' },
          ]}
          value={taskView}
          onChange={(v) => setTaskView(v as 'mine' | 'all')}
          height={32}
        />
      </CardHeader>
      <CardHairline />

      <div className="px-5 py-2">
        {groups.map(group => {
          const groupTasks = activeTasks.filter(t => t.group === group);
          if (groupTasks.length === 0) return null;
          return (
            <div key={group}>
              <div className="text-[11px] font-[600] uppercase tracking-[0.08em] text-[#B4B4B8] pt-3 pb-1 pl-[28px]">
                {group}
              </div>
              {groupTasks.map(task => (
                <TaskRow key={task.id} task={task} onComplete={handleComplete} />
              ))}
            </div>
          );
        })}
        {activeTasks.length === 0 && (
          <div className="py-6 flex flex-col items-center gap-2">
            <IconTile icon={<Check />} tint="green" />
            <span className="text-[14px] text-[#8A8A8E] font-[500]">All tasks complete!</span>
          </div>
        )}
      </div>

      <CardFooter>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[6px] bg-[#F0F0F0] flex items-center justify-center text-[12px] font-[600] text-[#7A7A7E]">/</div>
          <span className="text-[13px] text-[#8A8A8E] font-[500]">Open board</span>
        </div>
        <InlineHighlight asLink href="#">
          <span className="text-[13px]">View all {MY_TASKS.length} tasks</span>
        </InlineHighlight>
      </CardFooter>
    </SectionCard>
  );
}

function TaskRow({ task, onComplete }: { task: RoomTask; onComplete: (id: string) => void }) {
  const [checked, setChecked] = useState(false);

  const handleCheck = (val: boolean) => {
    setChecked(val);
    if (val) setTimeout(() => onComplete(task.id), 320);
  };

  return (
    <div className={cn(
      'flex items-center gap-2.5 py-2 hover:bg-[#FAFAFA] rounded-[8px] -mx-1 px-1 transition-all duration-[320ms]',
      checked && 'opacity-0 h-0 py-0 overflow-hidden'
    )}>
      <Checkbox checked={checked} onChange={handleCheck} className="w-5 h-5 shrink-0" />
      {task.blocked && (
        <div className="w-2 h-2 rounded-full bg-[#E5484D] shrink-0" />
      )}
      <span className={cn(
        'text-[14px] font-[500] text-[#141414] flex-1 truncate',
        checked && 'line-through text-[#8A8A8E]'
      )}>
        {task.title}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        {task.subtasks && (
          <div className="flex items-center gap-1">
            <svg viewBox="0 0 18 18" className="w-4.5 h-4.5">
              <circle cx="9" cy="9" r="7" stroke="#E8E8E8" strokeWidth="2" fill="none" />
              <circle
                cx="9" cy="9" r="7"
                stroke="#2F9BEA" strokeWidth="2" fill="none"
                strokeDasharray={`${(task.subtasks.done / task.subtasks.total) * 44} 44`}
                strokeLinecap="round"
                transform="rotate(-90 9 9)"
              />
            </svg>
            <span className="text-[11px] text-[#8A8A8E] tabular-nums">{task.subtasks.done}/{task.subtasks.total}</span>
          </div>
        )}
        <TagChip label={task.tagLabel} color={task.tagColor} className="h-[22px] text-[10px]" />
        {task.timeEstimate && <TimeChip timeRemaining={task.timeEstimate} />}
      </div>
    </div>
  );
}

// ─── COMPONENT 6: RECENT ACTIVITY ─────────────────────────────────────────────
function RecentActivity() {
  return (
    <SectionCard>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-[600] text-[#141414]">Recent activity</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#22A55A]" style={{ animation: 'live-pulse 2s infinite' }} />
            <span className="text-[12px] text-[#8A8A8E] font-[500]">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardHairline />

      <div className="px-5 py-2">
        {ACTIVITY.map((item, i) => {
          const member = ROSTER.find(m => m.id === item.memberId)!;
          return (
            <div
              key={item.id}
              className="flex items-center gap-2.5 py-2.5 hover:bg-[#FAFAFA] rounded-[8px] -mx-1 px-1 transition-colors duration-150"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {member && <Avatar member={member} size={24} />}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] leading-snug truncate">
                  <span className="font-[600] text-[#141414]">{item.memberName}</span>
                  {' '}
                  <span className="text-[#8A8A8E]">{item.action}</span>
                  {' '}
                  <InlineHighlight>{item.object}</InlineHighlight>
                </p>
              </div>
              <span className="text-[12px] text-[#B4B4B8] shrink-0 tabular-nums">{item.relativeTime}</span>
            </div>
          );
        })}
      </div>

      <CardFooter>
        <InlineHighlight asLink href="#">
          <span className="text-[13px]">View all activity</span>
        </InlineHighlight>
      </CardFooter>

      <style>{`
        @keyframes live-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </SectionCard>
  );
}

// ─── COMPONENT 7: PROJECT SNAPSHOT ────────────────────────────────────────────
function ProjectSnapshot() {
  const [hovered, setHovered] = useState<number | null>(null);

  const totalWeight = PROJECT.rubric.reduce((s, r) => s + r.weight, 0);

  return (
    <SectionCard>
      <CardHeader>
        <span className="text-[15px] font-[600] text-[#141414]">Project</span>
        <InlineHighlight asLink href="#">
          <span className="text-[13px]">Edit brief</span>
        </InlineHighlight>
      </CardHeader>
      <CardHairline />

      <div className="px-5 py-4 space-y-3">
        {/* 1. Name + identity */}
        <div>
          <div className="text-[16px] font-[600] text-[#141414]">{PROJECT.name}</div>
          <div className="text-[13px] text-[#8A8A8E] mt-0.5 leading-snug">{PROJECT.identity}</div>
        </div>

        {/* 2. Chips */}
        <div className="flex items-center gap-1.5">
          {PROJECT.chips.map(c => (
            <TagChip key={c.label} label={c.label} color={c.color} />
          ))}
        </div>

        {/* 3. Rubric */}
        <div>
          <div className="text-[11px] text-[#8A8A8E] font-[500] uppercase tracking-[0.06em] mb-1.5">Rubric</div>
          <div className="flex h-[8px] rounded-[4px] overflow-hidden gap-[2px]">
            {PROJECT.rubric.map((seg, i) => (
              <div
                key={seg.label}
                className="relative cursor-default group/seg"
                style={{ width: `${(seg.weight / totalWeight) * 100}%`, background: seg.color }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {hovered === i && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-[#222222] text-white text-[11px] px-2 py-1 rounded-[6px] whitespace-nowrap z-10 pointer-events-none">
                    {seg.label} {seg.weight}%
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex mt-1.5">
            {PROJECT.rubric.map(seg => (
              <div
                key={seg.label}
                className="text-[10px] text-[#B4B4B8] text-center"
                style={{ width: `${(seg.weight / totalWeight) * 100}%` }}
              >
                {seg.label.split(' ')[0]} {seg.weight}
              </div>
            ))}
          </div>
        </div>

        {/* 4. MVP health */}
        <div>
          <div className="text-[11px] text-[#8A8A8E] font-[500] uppercase tracking-[0.06em] mb-1.5">MVP health</div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {PROJECT.mvpChecks.map((chk, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full flex items-center justify-center cursor-default relative group/mvp"
                  style={{
                    background: chk.pass ? '#141414' : 'transparent',
                    border: chk.pass ? 'none' : '2px solid #F59E0B',
                  }}
                  title={chk.label}
                >
                  {chk.pass
                    ? <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    : <span className="text-[11px] font-[700] text-[#F59E0B]">!</span>
                  }
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-[#222222] text-white text-[10px] px-2 py-1 rounded-[6px] whitespace-nowrap z-10 opacity-0 group-hover/mvp:opacity-100 transition-opacity duration-150 pointer-events-none">
                    {chk.label}
                  </div>
                </div>
              ))}
            </div>
            <span className="text-[12px] text-[#8A8A8E]">
              {PROJECT.mvpChecks.filter(c => c.pass).length} of {PROJECT.mvpChecks.length} checks
            </span>
          </div>
        </div>
      </div>

      <CardFooter>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PROJECT.rules.map(rule => (
            <div
              key={rule.label}
              className="h-[24px] rounded-[8px] px-2 flex items-center gap-1 bg-[#F0F0F0] text-[#7A7A7E] text-[11px] font-[600]"
            >
              <span>{rule.label}</span>
            </div>
          ))}
        </div>
      </CardFooter>
    </SectionCard>
  );
}

// ─── COMPONENT 8: TEAM PANEL ──────────────────────────────────────────────────
function TeamPanel() {
  const { isDemo, roomId, tasks: flowTasks } = React.useContext(RoomOverviewContext);
  const [teamView, setTeamView] = useState<'members' | 'workload' | 'skills'>('members');
  const [inviteText, setInviteText] = useState('');
  const [copied, setCopied] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<string[]>([]);

  const activeRoster = (!isDemo && roomId)
    ? getRoomMembers(roomId).map((m) => {
        const assigned = flowTasks.filter(t => t.assigneeId === m.id);
        const done = assigned.filter(t => t.status === 'done');
        return {
          id: m.id,
          firstName: m.displayName.split(' ')[0],
          lastName: m.displayName.split(' ').slice(1).join(' ') || '',
          initials: m.initials,
          avatarColor: m.avatarColor,
          role: m.roleTags?.[0] || 'Engineer',
          status: 'working' as const,
          tasksDone: done.length,
          tasksExpected: Math.max(assigned.length, 1),
        };
      })
    : ROSTER;

  const handleInvite = () => {
    if (!inviteText.trim()) return;
    setPendingInvites(prev => [...prev, inviteText.trim()]);
    setInviteText('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${INVITE_LINK}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const hueMap: ChartHue[] = ['blue', 'cyan', 'purple', 'teal', 'blue', 'cyan'];

  return (
    <SectionCard>
      {/* SegmentedControl as top section */}
      <div className="px-5 py-3">
        <SegmentedControl
          id="team-view"
          options={[
            { value: 'members', label: 'Members', icon: <Users /> },
            { value: 'workload', label: 'Workload', icon: <BarChart2 /> },
            { value: 'skills', label: 'Skills', icon: <Layers /> },
          ]}
          value={teamView}
          onChange={(v) => setTeamView(v as typeof teamView)}
          height={36}
        />
      </div>
      <CardHairline />

      {/* MEMBERS VIEW */}
      {teamView === 'members' && (
        <div>
          {/* Invite row */}
          <div className="px-5 py-3 flex items-center gap-2">
            <div className="flex-1 h-[40px] rounded-[14px] bg-[#F3F3F3] flex items-center px-3 gap-2">
              <input
                type="text"
                placeholder="Email or name..."
                value={inviteText}
                onChange={e => setInviteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
                className="flex-1 bg-transparent text-[14px] text-[#141414] placeholder:text-[#B4B4B8] outline-none"
              />
              <div className="flex items-center gap-1 bg-white rounded-[10px] px-2 py-1 text-[12px] font-[500] text-[#7A7A7E] cursor-pointer shrink-0">
                Member <ChevronDown className="w-3 h-3 inline-block ml-0.5" />
              </div>
            </div>
            <button
              disabled={!inviteText.trim()}
              onClick={handleInvite}
              className="h-[40px] px-4 rounded-[12px] bg-[#141414] text-white text-[14px] font-[600] shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-[#2F9BEA] active:scale-[0.98]"
            >
              Invite
            </button>
          </div>

          {/* Section label */}
          <div className="px-5 pb-1">
            <span className="text-[12px] text-[#8A8A8E] font-[500]">
              People in this room — {ROSTER.length + pendingInvites.length}
            </span>
          </div>

          {/* Member rows */}
          <div className="px-5 pb-2">
            {activeRoster.map(member => (
              <MemberRow key={member.id} member={member} />
            ))}
            {pendingInvites.map((email, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#F5F5F5] last:border-0">
                <div className="w-8 h-8 rounded-full bg-[#F0F0F0] flex items-center justify-center text-[11px] font-[600] text-[#B4B4B8] shrink-0">?</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-[500] text-[#141414] truncate">{email}</div>
                  <div className="text-[11px] text-[#B4B4B8]">Invitation sent</div>
                </div>
                <div className="h-[20px] rounded-[6px] px-2 bg-[#F0F0F0] text-[10px] font-[600] text-[#7A7A7E] uppercase flex items-center">
                  PENDING
                </div>
              </div>
            ))}
          </div>

          {/* Footer: invite link */}
          <CardHairline />
          <div className="px-5 py-3.5 flex items-center justify-between gap-3">
            <span className="text-[12px] text-[#B4B4B8] truncate flex-1">{INVITE_LINK}</span>
            <button
              onClick={handleCopy}
              className="h-[36px] px-3.5 rounded-[12px] bg-[#141414] text-white text-[13px] font-[600] flex items-center gap-1.5 shrink-0 hover:opacity-90 transition-all focus-visible:outline-2 focus-visible:outline-[#2F9BEA] active:scale-[0.98]"
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5" />Copied</>
              ) : (
                <><Link2 className="w-3.5 h-3.5" />Copy link</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* WORKLOAD VIEW */}
      {teamView === 'workload' && (
        <div className="px-5 py-4 relative" style={{ minHeight: 280 }}>
          {/* Gridlines */}
          <div className="absolute top-4 bottom-4 left-[140px] right-5 flex justify-between pointer-events-none">
            {[0, 4, 8, 12, 16].map(tick => (
              <div key={tick} className="relative h-full flex flex-col items-center">
                <div className="flex-1 w-px border-l border-dashed border-[#D0D0D0]" />
                <div className="absolute -bottom-5 text-[11px] text-[#B4B4B8] -translate-x-1/2">{tick}</div>
              </div>
            ))}
          </div>
          <div className="relative z-10">
            {activeRoster.map((member, i) => (
              <PairedBarRow
                key={member.id}
                label={member.firstName}
                hue={hueMap[i % hueMap.length]}
                doneValue={member.tasksDone}
                expectedValue={member.tasksExpected}
                maxValue={Math.max(16, ...activeRoster.map(m => m.tasksExpected))}
                status={member.status}
              />
            ))}
          </div>
        </div>
      )}

      {/* SKILLS VIEW */}
      {teamView === 'skills' && (
        <div className="px-5 py-2">
          {SKILLS_COVERAGE.map(skill => {
            const isGap = skill.memberIds.length === 0;
            return (
              <div key={skill.area} className="flex items-center gap-3 py-2.5 border-b border-[#F5F5F5] last:border-0">
                <IconTile
                  icon={
                    skill.area === 'Build' ? <Zap /> :
                    skill.area === 'Design' ? <Layers /> :
                    skill.area === 'AI' ? <Circle /> :
                    skill.area === 'Domain' ? <BarChart2 /> :
                    <Users />
                  }
                  tint={isGap ? 'red' : 'neutral'}
                />
                <span className="text-[14px] font-[500] text-[#141414] flex-1">{skill.area}</span>
                {skill.memberIds.length > 0 && (
                  <AvatarStack memberIds={skill.memberIds} max={3} />
                )}
                {isGap ? (
                  <div className="h-[22px] rounded-[8px] px-2 bg-[#FDE6E6] text-[#E5484D] text-[11px] font-[700] uppercase flex items-center">
                    GAP
                  </div>
                ) : (
                  <div className="h-[22px] rounded-[8px] px-2 bg-[#F0F0F0] text-[#7A7A7E] text-[11px] font-[600] flex items-center tabular-nums">
                    {skill.memberIds.length} covered
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function MemberRow({ member }: { member: RoomMember }) {
  const taskText = member.status === 'blocked'
    ? `Blocked: ${member.blockedOn}`
    : member.currentTask ?? 'Idle';
  const taskColor = member.status === 'blocked'
    ? '#E5484D'
    : member.status === 'idle'
    ? '#B4B4B8'
    : '#8A8A8E';

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#F5F5F5] last:border-0 hover:bg-[#FAFAFA] rounded-[8px] -mx-1 px-1 transition-colors duration-150">
      <Avatar member={member} size={32} />
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-[500] text-[#141414] truncate leading-snug">
          {member.firstName} {member.lastName}
        </div>
        <div className="text-[12px] truncate leading-snug" style={{ color: taskColor }}>
          {taskText}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1 text-[13px] text-[#7A7A7E] font-[500]">
        {member.role === 'Leader' ? (
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-[500] text-[#141414]">Leader</span>
            <div className="w-4 h-4 rounded-[4px] bg-[#E4F7E9] flex items-center justify-center">
              <svg viewBox="0 0 12 12" className="w-3 h-3 fill-[#2E9E55]">
                <path d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9.5L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 cursor-pointer hover:text-[#141414] transition-colors">
            {member.role} <ChevronDown className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPONENT 9: PROGRESS VS PLAN ────────────────────────────────────────────
function ProgressVsPlan() {
  const [mounted, setMounted] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  const W = 480, H = 160;
  const PAD = { top: 16, right: 16, bottom: 28, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const xScale = (h: number) => PAD.left + (h / 48) * chartW;
  const yScale = (pct: number) => H - PAD.bottom - (pct / 100) * chartH;

  const toPath = (pts: { h: number; pct: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.h)} ${yScale(p.pct)}`).join(' ');

  const plannedPath = toPath(PLANNED_WAYPOINTS);
  const actualPath = toPath(ACTUAL_WAYPOINTS);

  // Area fill under actual line
  const areaPath = actualPath + ` L ${xScale(NOW_HOUR)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;

  // Gap fill (amber) between planned and actual where actual < planned
  const nowX = xScale(NOW_HOUR);
  const nowActualY = yScale(NOW_ACTUAL_PCT);
  const nowPlannedY = yScale(NOW_PLANNED_PCT);

  // Now line x
  const nowLineX = xScale(NOW_HOUR);

  // Phase boundary x positions for x-axis ticks
  const xTicks = [
    { h: 0, label: 'Wed 7 AM' },
    { h: 24, label: 'Thu 7 AM' },
    { h: 48, label: 'Fri 7 AM' },
  ];

  return (
    <SectionCard>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-[600] text-[#141414]">Progress vs plan</span>
          <div className="h-[20px] rounded-[6px] px-2 flex items-center bg-[#FFF1D6] text-[#B7791F] text-[10px] font-[700] uppercase tracking-[0.06em]">
            -5% vs plan
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#8A8A8E]">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[2.5px] rounded bg-[#3B5BFF]" />
            Actual
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-[2px] rounded" style={{ background: 'repeating-linear-gradient(to right, #B4B4B8 0, #B4B4B8 4px, transparent 4px, transparent 7px)' }} />
            Planned
          </div>
        </div>
      </CardHeader>
      <CardHairline />

      <div className="px-3 py-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          className="overflow-visible"
          onMouseMove={(e) => {
            if (!svgRef.current) return;
            const rect = svgRef.current.getBoundingClientRect();
            setTooltip({
              x: ((e.clientX - rect.left) / rect.width) * W,
              y: ((e.clientY - rect.top) / rect.height) * H,
              visible: true,
            });
          }}
          onMouseLeave={() => setTooltip(p => ({ ...p, visible: false }))}
        >
          {/* Y-axis gridlines */}
          {[0, 50, 100].map(pct => (
            <g key={pct}>
              <line
                x1={PAD.left} y1={yScale(pct)}
                x2={W - PAD.right} y2={yScale(pct)}
                stroke="#D0D0D0" strokeWidth="1" strokeDasharray="4 4"
              />
              <text x={PAD.left - 4} y={yScale(pct) + 4} textAnchor="end" fill="#B4B4B8" fontSize={10} fontFamily="Inter, sans-serif">
                {pct}%
              </text>
            </g>
          ))}

          {/* X-axis ticks */}
          {xTicks.map(tick => (
            <g key={tick.h}>
              <line
                x1={xScale(tick.h)} y1={H - PAD.bottom}
                x2={xScale(tick.h)} y2={H - PAD.bottom + 3}
                stroke="#D0D0D0" strokeWidth="1"
              />
              <text
                x={xScale(tick.h)} y={H - PAD.bottom + 12}
                textAnchor="middle" fill="#B4B4B8" fontSize={9} fontFamily="Inter, sans-serif"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Amber gap fill: only between now and where actual < planned */}
          <polygon
            points={`${xScale(0)},${yScale(0)} ${xScale(0)},${yScale(0)} ${xScale(NOW_HOUR)},${nowActualY} ${xScale(NOW_HOUR)},${nowPlannedY}`}
            fill="#F59E0B" fillOpacity={0.10}
          />

          {/* Area fill under actual */}
          <path
            d={areaPath}
            fill="#3B5BFF" fillOpacity={mounted ? 0.06 : 0}
            className="transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          />

          {/* Planned line (dashed) */}
          <path
            d={plannedPath}
            fill="none" stroke="#B4B4B8" strokeWidth="1.5"
            strokeDasharray="5 4"
          />

          {/* Actual line */}
          <path
            d={actualPath}
            fill="none" stroke="#3B5BFF" strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              strokeDasharray: mounted ? 'none' : 1000,
              strokeDashoffset: mounted ? 0 : 1000,
              transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)',
            }}
          />

          {/* Now vertical line */}
          <line
            x1={nowLineX} y1={PAD.top}
            x2={nowLineX} y2={H - PAD.bottom}
            stroke="#D0D0D0" strokeWidth="1"
          />

          {/* Now label */}
          <text x={nowLineX + 4} y={PAD.top + 10} fill="#8A8A8E" fontSize={9} fontFamily="Inter, sans-serif">
            Now — {NOW_ACTUAL_PCT}%
          </text>

          {/* Pulsing dot on actual line at now */}
          <circle cx={nowLineX} cy={nowActualY} r={4} fill="#3B5BFF" />
          <circle
            cx={nowLineX} cy={nowActualY} r={8}
            fill="none" stroke="#3B5BFF" strokeWidth="1" strokeOpacity={0.3}
            style={{ animation: 'pulse-dot 2s infinite' }}
          />

          {/* Tooltip */}
          {tooltip.visible && (
            <g transform={`translate(${Math.min(tooltip.x + 8, W - 100)}, ${Math.max(tooltip.y - 50, PAD.top)})`}>
              <rect x={0} y={0} width={96} height={48} rx={6} fill="#222222" />
              <text x={8} y={16} fill="white" fontSize={11} fontFamily="Inter, sans-serif" fontWeight={600}>{NOW_ACTUAL_PCT}% actual</text>
              <text x={8} y={30} fill="#9A9A9A" fontSize={10} fontFamily="Inter, sans-serif">{NOW_PLANNED_PCT}% planned</text>
              <text x={8} y={43} fill="#9A9A9A" fontSize={10} fontFamily="Inter, sans-serif">Hour {NOW_HOUR} of 48</text>
            </g>
          )}
        </svg>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { r: 8; stroke-opacity: 0.3; }
          50% { r: 12; stroke-opacity: 0; }
        }
      `}</style>
    </SectionCard>
  );
}

// ─── ROOT PAGE ────────────────────────────────────────────────────────────────
export function RoomOverviewPage() {
  const { roomId, id } = useParams<{ roomId?: string; id?: string }>();
  const activeRoomId = roomId || id || 'r-1';
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);

  const outletContext = useOutletContext<{ setRightRail: (node: React.ReactNode) => void } | null>();

  React.useLayoutEffect(() => {
    if (outletContext?.setRightRail) {
      outletContext.setRightRail(null);
    }
  }, [outletContext]);

  const { data: room } = useQuery({
    queryKey: ['room', activeRoomId],
    queryFn: () => roomService.getRoom(activeRoomId),
  });

  // If stage is before build, render the Planning variant
  if (room && room.stage !== 'build') {
    return <PlanningOverview roomId={activeRoomId} />;
  }

  const isDemo = activeRoomId === 'r-1';
  const flowTasks = isDemo ? [] : getTasks(activeRoomId);
  const flowPhases = isDemo ? [] : getPhases(activeRoomId);

  return (
    <RoomOverviewContext.Provider value={{ roomId: activeRoomId, isDemo, tasks: flowTasks, phases: flowPhases, room }}>
      <div
        className="px-6 pb-8 max-w-[1280px] mx-auto"
        style={{ paddingTop: 16 }}
      >
        {/* Build Phase Live Success Row */}
        {room?.stageDone?.plan && showSuccessBanner && (
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2">
              <Check className="size-4 text-emerald-600 shrink-0" />
              <span>Build phase is live. Your plan created 9 docs and 38 tasks.</span>
              <Link to={`/app/room/${activeRoomId}/board`} className="font-semibold underline ml-1 hover:opacity-80">
                View board &rarr;
              </Link>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <FadeUp delay={0}>
          <div className="mb-4">
            <PageHeader />
          </div>
        </FadeUp>

        {/* Status Band */}
        <FadeUp delay={50}>
          <div className="mb-4">
            <StatusBand />
          </div>
        </FadeUp>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* LEFT STACK — 7 cols */}
          <div className="xl:col-span-7 flex flex-col gap-4">
            <FadeUp delay={100}><NeedsAttention /></FadeUp>
            <FadeUp delay={150}><CheckpointsCard /></FadeUp>
            <FadeUp delay={200}><MyTasksCard /></FadeUp>
            <FadeUp delay={250}><RecentActivity /></FadeUp>
          </div>

          {/* RIGHT STACK — 5 cols */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            <FadeUp delay={100}><ProjectSnapshot /></FadeUp>
            <FadeUp delay={150}><TeamPanel /></FadeUp>
            <FadeUp delay={200}><ProgressVsPlan /></FadeUp>
          </div>
        </div>
      </div>
    </RoomOverviewContext.Provider>
  );
}
