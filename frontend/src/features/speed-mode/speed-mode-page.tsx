/**
 * S31 SpeedModePage — column content inside the existing SpeedModeShell.
 * Route: /speed-mode  (shell already built in Phase 0b)
 * Source: design.md §6 S31; PRD Phase 6b §3.3; animations.md §3.1, §6.2 S31, §5 M10
 *
 * Reduced motion tier by default (§3.1): keeps press feedback and toasts only.
 * Clock: instant digit swap (no rolls — §3.1 "drop number rolls").
 * Now-card: cross-fade on task swap (§6.2 S31).
 * M10 (I'm blocked FAB): FAB already wired in SpeedModeShell; this page
 *   just ensures the SpeedMode motion mode is active.
 *
 * Dark theme by default; column max-width 720px; compact density.
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Banner } from '@/components/primitives/banner';
import { ProgressPill } from '@/components/primitives/progress-pill';
import { DarkCallout } from '@/components/primitives/dark-callout';
import { EmptyState } from '@/components/primitives/empty-state';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { useMotionModeStore } from '@/shared/motion/use-motion-mode';
import { COPY } from '@/shared/constants/copy';
import { RefreshCw, AlertTriangle, Zap } from 'lucide-react';
import { cn } from 'cn';
import type { SpeedModeState } from './api/types';
import { apiFetch } from '@/api/client';

// ── API ──────────────────────────────────────────────────────────

async function fetchSpeedMode(roomId: string): Promise<SpeedModeState> {
  return apiFetch<SpeedModeState>(`/api/v1/rooms/${roomId}/speed-mode`);
}

async function markTaskDone(roomId: string, taskId: string): Promise<void> {
  await apiFetch(`/api/v1/rooms/${roomId}/speed-mode/tasks/${taskId}/done`, { method: 'POST' });
}

async function quickCapture(roomId: string, text: string): Promise<void> {
  await apiFetch(`/api/v1/rooms/${roomId}/speed-mode/capture`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

// ── Clock display ────────────────────────────────────────────────

/** Live countdown — no digit rolling per §3.1 Speed Mode reduced tier */
function SpeedClock({ timeToCheckpoint, timeToSubmission }: {
  timeToCheckpoint: string;
  timeToSubmission: string;
}) {
  return (
    <div className="flex flex-col gap-1" id="speed-mode-clock">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-[3rem] font-bold tabular-nums leading-none text-white">
          {timeToCheckpoint}
        </span>
        <span className="text-body text-white/60">{COPY.speedMode.clockLabel1}</span>
      </div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-2xl font-semibold tabular-nums leading-none text-white/70">
          {timeToSubmission}
        </span>
        <span className="text-caption text-white/50">{COPY.speedMode.clockLabel2}</span>
      </div>
    </div>
  );
}

// ── Yellow Event Card ────────────────────────────────────────────

function YellowEventCard({ label, onDetails, onDismiss }: {
  label: string;
  onDetails: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="rounded-card p-4 flex items-center justify-between gap-3"
      style={{ backgroundColor: '#F8B315', color: '#1C1C1C' }}
      id="speed-mode-event-card"
    >
      <div>
        <p className="text-caption font-semibold uppercase tracking-wider opacity-70">Next checkpoint</p>
        <p className="text-body-strong">{label}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          onClick={onDetails}
          className="text-[#1C1C1C] hover:bg-black/10"
          id="speed-mode-event-details-btn"
        >
          Details
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          className="text-[#1C1C1C] hover:bg-black/10"
          id="speed-mode-event-dismiss-btn"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

// ── Now Card ────────────────────────────────────────────────────

function NowCard({ task, onMarkDone, isPending }: {
  task: SpeedModeState['currentTask'];
  onMarkDone: (id: string) => void;
  isPending: boolean;
}) {
  const total = task?.checklist.length ?? 0;
  const done = task?.checklistDone ?? 0;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  if (!task) {
    return (
      <div className="rounded-card bg-lav-900/30 border border-lav-700/30 p-4" id="speed-mode-now-card">
        <p className="text-caption text-white/60 mb-2 uppercase tracking-wider font-semibold">Now</p>
        <EmptyState
          icon={<Zap />}
          title={COPY.speedMode.nowEmptyTitle}
          description={COPY.speedMode.nowEmptyBody}
          className="bg-transparent shadow-none border-none py-4"
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-card bg-lav-900/40 border border-lav-600/30 p-4 transition-opacity duration-150"
      id="speed-mode-now-card"
    >
      <p className="text-caption text-lav-300 mb-3 uppercase tracking-wider font-semibold">Now</p>
      <div className="flex items-start gap-3">
        <ProgressPill value={progress} barWidth="w-20" fillClass="bg-white/70" showLabel />
        <div className="flex-1 min-w-0">
          <p className="text-body-strong text-white truncate">{task.title}</p>
          <ul className="mt-2 space-y-1">
            {task.checklist.map(item => (
              <li key={item.id} className={cn(
                'text-caption',
                item.isDone ? 'text-white/40 line-through' : 'text-white/70'
              )}>
                {item.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* M07 Mark done trigger */}
      <Button
        id="speed-mode-mark-done-btn"
        size="sm"
        variant="outline"
        className="mt-4 border-white/20 text-white hover:bg-white/10"
        onClick={() => onMarkDone(task.id)}
        disabled={isPending}
      >
        {isPending ? 'Marking…' : 'Mark done'}
      </Button>
    </div>
  );
}

// ── Next Up ──────────────────────────────────────────────────────

function NextUpList({ tasks }: { tasks: SpeedModeState['nextUpTasks'] }) {
  // Exactly 2 slots; OQ-11: missing slot renders mini empty state per §9 (no layout shift)
  const slots = [tasks[0] ?? null, tasks[1] ?? null];

  return (
    <div id="speed-mode-nextup" className="flex flex-col gap-2">
      <p className="text-caption text-white/60 uppercase tracking-wider font-semibold">Next up</p>
      {slots.map((task, i) => (
        task ? (
          <div
            key={task.id}
            className="flex items-center gap-3 px-3 py-2 rounded-control bg-white/5 min-h-[40px]"
            id={`speed-mode-nextup-row-${i}`}
          >
            <ProgressPill value={task.checklist.length > 0 ? Math.round((task.checklistDone / task.checklist.length) * 100) : 0} barWidth="w-12" fillClass="bg-white/60" showLabel={false} />
            <span className="text-body text-white/80 truncate flex-1">{task.title}</span>
          </div>
        ) : (
          <div
            key={`empty-${i}`}
            className="flex items-center px-3 py-2 rounded-control bg-white/5 min-h-[40px] border border-dashed border-white/10"
          >
            <span className="text-caption text-white/30">{COPY.speedMode.nextUpEmptySlot}</span>
          </div>
        )
      ))}
    </div>
  );
}

// ── Blockers Panel ───────────────────────────────────────────────

function BlockersPanel({ blockers, onReportBlocker }: {
  blockers: SpeedModeState['blockers'];
  onReportBlocker: () => void;
}) {
  if (blockers.length === 0) {
    return (
      <div className="text-caption text-white/50" id="speed-mode-blockers">
        0 blockers
      </div>
    );
  }

  // C10d dark callout when any blocker exists (§13: at most one per screen)
  return (
    <DarkCallout
      id="speed-mode-blockers"
      title={`${blockers.length} task${blockers.length > 1 ? 's' : ''} blocked`}
      description={blockers.map(b => `${b.taskTitle} — ${b.reportedBy}`).join('; ')}
      buttonLabel="Assign owners"
      onAction={onReportBlocker}
      icon={<AlertTriangle />}
    />
  );
}

// ── Category List ────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  urgent: 'bg-danger-fill text-white',
  build:  'bg-lav-500 text-white',
  docs:   'bg-sky-500 text-white',
  pitch:  'bg-[#EB6404] text-white',
};

function CategoryList({ categories, activeCategory, onSelect }: {
  categories: SpeedModeState['categories'];
  activeCategory: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap" id="speed-mode-category-list">
      {categories.map(cat => (
        <button
          key={cat.id}
          id={`speed-mode-category-${cat.id}`}
          onClick={() => onSelect(activeCategory === cat.id ? null : cat.id)}
          aria-pressed={activeCategory === cat.id}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-pill text-label transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
            activeCategory === cat.id
              ? (CATEGORY_COLORS[cat.id] ?? 'bg-lav-500 text-white')
              : 'bg-white/10 text-white/70 hover:bg-white/15',
          )}
        >
          {cat.label}
          <span className={cn(
            'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full text-xs font-bold',
            'bg-white/20',
          )}>
            {cat.count}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Quick Capture ────────────────────────────────────────────────

function QuickCapture({ roomId, disabled }: { roomId: string; disabled: boolean }) {
  const [value, setValue] = useState('');
  const { mutate, isPending } = useMutation({
    mutationFn: (text: string) => quickCapture(roomId, text),
    onSuccess: () => setValue(''),
  });

  return (
    <form
      id="speed-mode-quick-capture"
      onSubmit={e => { e.preventDefault(); if (value.trim()) mutate(value.trim()); }}
      className="flex gap-2"
    >
      <input
        id="speed-mode-capture-input"
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={COPY.speedMode.quickCapturePlaceholder}
        disabled={disabled || isPending}
        className="flex-1 rounded-control bg-white/10 border border-white/20 px-3 py-2 text-body text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-50"
      />
      <Button
        type="submit"
        size="sm"
        disabled={!value.trim() || isPending || disabled}
        className="shrink-0 bg-lav-500 text-white hover:bg-lav-600"
      >
        {isPending ? '…' : 'Add'}
      </Button>
    </form>
  );
}

// ── Main page ────────────────────────────────────────────────────

export function SpeedModePage() {
  const { roomId } = useParams<{ roomId?: string }>();
  const effectiveRoomId = roomId ?? '';

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [eventCardVisible, setEventCardVisible] = useState(true);
  const isOnline = useIsOnline();
  const qc = useQueryClient();

  // Activate Speed Mode reduced tier (animations §3.1)
  const setSpeedMode = useMotionModeStore(s => s.setSpeedMode);
  useEffect(() => {
    setSpeedMode(true);
    return () => setSpeedMode(false);
  }, [setSpeedMode]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['speedMode', effectiveRoomId],
    queryFn: () => fetchSpeedMode(effectiveRoomId),
    enabled: Boolean(effectiveRoomId),
    refetchInterval: 15_000, // live countdown context per spec
  });

  const { mutate: doMarkDone, isPending: isMarkingDone } = useMutation({
    mutationFn: (taskId: string) => markTaskDone(effectiveRoomId, taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['speedMode', effectiveRoomId] }),
  });

  // ── Loading ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 max-w-[720px] mx-auto w-full">
        <Skeleton className="h-16 w-full opacity-30" />
        <Skeleton className="h-32 w-full opacity-20" />
        <Skeleton className="h-24 w-full opacity-20" />
        <Skeleton className="h-20 w-full opacity-20" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 max-w-[720px] mx-auto">
        <p className="text-body text-white/60">{COPY.speedMode.errorMessage}</p>
        <Button variant="outline" onClick={() => refetch()} className="text-white border-white/20" id="speed-mode-retry-btn">
          <RefreshCw className="size-4 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-[720px] mx-auto w-full" id="speed-mode-column">
      {/* Offline banner */}
      {!isOnline && (
        <Banner variant="warning">
          {COPY.speedMode.offlineBanner}
        </Banner>
      )}

      {/* 1. Clock */}
      <SpeedClock
        timeToCheckpoint={data.timeToCheckpoint}
        timeToSubmission={data.timeToSubmission}
      />

      {/* Yellow event card — OQ-8: placed near top (time-driven) */}
      {eventCardVisible && (
        <YellowEventCard
          label={data.nextCheckpoint.label}
          onDetails={() => { /* OQ-13: destination unresolved */ }}
          onDismiss={() => setEventCardVisible(false)}
        />
      )}

      {/* 2. Now card */}
      <NowCard
        task={data.currentTask}
        onMarkDone={doMarkDone}
        isPending={isMarkingDone}
      />

      {/* 3. Next up */}
      <NextUpList tasks={data.nextUpTasks} />

      {/* 4. Blockers — C10d only when any; §13 at most one C10d per screen */}
      <BlockersPanel
        blockers={data.blockers}
        onReportBlocker={() => { /* I'm blocked FAB handles this via M10 */ }}
      />

      {/* Category list — OQ-8: placed after Blockers, acts as filter */}
      <CategoryList
        categories={data.categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />

      {/* 5. Quick capture */}
      <QuickCapture roomId={effectiveRoomId} disabled={!isOnline} />
    </div>
  );
}
