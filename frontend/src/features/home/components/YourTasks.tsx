
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { FileText, Plus, CheckCircle2, ArrowRight } from 'lucide-react';
import { TagChip, TimeChip, TrayCard, Checkbox } from './HomeDesignSystem';
import { HomeContext } from '../home-page';
import { boardService } from '@/services/boardService';

interface HomeTaskItem {
  id: string;
  title: string;
  tagLabel: string;
  tagColor: 'amber' | 'neutral' | 'blue' | 'green';
  timeEstimate?: string;
  isHero?: boolean;
}

function HeroTask({
  task,
  onComplete,
}: {
  task: HomeTaskItem;
  onComplete: () => void;
}) {
  const [started, setStarted] = useState(false);
  const [checked, setChecked] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (started && !checked) {
      const interval = setInterval(() => setTimer((t) => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [started, checked]);

  const handleComplete = () => {
    if (checked) return;
    setChecked(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'px-6 py-5 transition-all duration-[var(--dur-standard)] ease-[var(--ease-home)] relative overflow-hidden',
        checked ? 'opacity-0 h-0 p-0 scale-95' : 'opacity-100 min-h-[140px] scale-100'
      )}
    >
      <div className="flex gap-4">
        <div className="mt-1">
          <Checkbox checked={checked} onChange={handleComplete} className="w-[24px] h-[24px]" />
        </div>
        <div className="flex-1">
          <h3 className="text-[18px] font-[600] text-[var(--color-home-text-primary)] relative inline-block">
            {task.title}
            {checked && (
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[var(--color-home-text-primary)] origin-left animate-strike-through" />
            )}
          </h3>
          <div className="flex items-center gap-2 mt-2 mb-4">
            <TagChip label={task.tagLabel} color={task.tagColor} />
            {task.timeEstimate && <TimeChip timeRemaining={task.timeEstimate} />}
          </div>
          <div className="flex items-center gap-2">
            {!started ? (
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="h-[40px] px-6 rounded-[var(--radius-home-btn)] bg-[var(--color-home-text-primary)] text-white text-[15px] font-[600] focus-visible:outline-2 focus-visible:outline-[var(--color-home-accent)] hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                Start
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                className="h-[40px] px-6 rounded-[var(--radius-home-btn)] bg-[var(--color-home-text-primary)] text-white text-[15px] font-[600] flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-[var(--color-home-accent)] hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                Mark done
                <span className="text-white/70 tabular-nums font-[500]">{formatTimer(timer)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes strike-through {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        .animate-strike-through {
          animation: strike-through 240ms var(--ease-home) forwards;
        }
      `}</style>
    </div>
  );
}

function CompactTaskRow({
  task,
  onComplete,
}: {
  task: HomeTaskItem;
  onComplete: () => void;
}) {
  const [checked, setChecked] = useState(false);

  const handleComplete = () => {
    if (checked) return;
    setChecked(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-4 px-6 py-3 border-b border-[var(--color-home-hairline)] last:border-0 transition-all duration-[var(--dur-standard)] ease-[var(--ease-home)] relative overflow-hidden',
        checked ? 'opacity-0 h-0 py-0 border-transparent scale-95' : 'opacity-100 h-[64px] scale-100'
      )}
    >
      <div className="mt-0.5 shrink-0">
        <Checkbox checked={checked} onChange={handleComplete} className="w-[20px] h-[20px]" />
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[15px] font-[500] text-[var(--color-home-text-primary)] relative inline-block">
            {task.title}
            {checked && (
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[var(--color-home-text-primary)] origin-left animate-strike-through" />
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TagChip label={task.tagLabel} color={task.tagColor} />
          {task.timeEstimate && <TimeChip timeRemaining={task.timeEstimate} />}
        </div>
      </div>
    </div>
  );
}

export function YourTasks() {
  const navigate = useNavigate();
  const { homeData } = useContext(HomeContext);
  const selected = homeData?.selected;
  const stage = (selected?.stage || '').toLowerCase();
  const isPlanning = selected?.variant === 'planning' || ['brief', 'ideate', 'plan'].includes(stage);
  const roomId = selected?.roomId || selected?.id;

  // In Planning mode, render Brief card
  if (isPlanning) {
    const brief = selected?.brief;
    const isConfirmed = Boolean(selected?.briefDone || brief?.confirmed);
    const problemStatement = brief?.fields?.problemStatement || brief?.problemStatement || '';

    return (
      <TrayCard
        footerLeftLabel="Source of truth"
        footerRightLabel=""
        footerRightValue={isConfirmed ? 'Confirmed' : 'Pending brief'}
        progressPercent={isConfirmed ? 100 : 25}
      >
        <div className="p-6 pb-2 border-b border-[var(--color-home-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--color-home-text-secondary)]" />
            <h2 className="text-[20px] font-[600] text-[var(--color-home-text-primary)]">
              Brief
            </h2>
          </div>
          {isConfirmed ? (
            <TagChip label="CONFIRMED" color="green" />
          ) : (
            <TagChip label="REQUIRED" color="amber" />
          )}
        </div>

        <div className="flex flex-col min-h-[180px] p-6 justify-center">
          {isConfirmed && problemStatement ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold">
                <CheckCircle2 className="size-4" /> Confirmed brief active
              </div>
              <p className="text-[14px] text-[var(--color-home-text-primary)] line-clamp-3 leading-relaxed">
                {problemStatement}
              </p>
              <button
                type="button"
                onClick={() => roomId && navigate(`/app/room/${roomId}/brief`)}
                className="mt-2 text-xs font-semibold text-[var(--color-home-accent)] hover:underline inline-flex items-center gap-1 cursor-pointer self-start"
              >
                View full brief <ArrowRight className="size-3" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center gap-3 py-2">
              <div className="size-10 rounded-full bg-[var(--color-home-tray)] flex items-center justify-center text-[var(--color-home-accent)]">
                <FileText className="size-5" />
              </div>
              <div>
                <p className="text-[16px] font-[600] text-[var(--color-home-text-primary)] mb-1">
                  Add the hackathon brief
                </p>
                <p className="text-[13px] text-[var(--color-home-text-secondary)] max-w-xs">
                  Import the hackathon rules, rubric weights, and submission requirements.
                </p>
              </div>
              <button
                type="button"
                onClick={() => roomId && navigate(`/app/room/${roomId}/brief`)}
                className="mt-1 h-9 px-5 rounded-[var(--radius-home-btn)] bg-[var(--color-home-text-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="size-3.5" /> Add brief
              </button>
            </div>
          )}
        </div>
      </TrayCard>
    );
  }

  const rawItems = selected?.myTasks?.items || [];
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const tasks: HomeTaskItem[] = rawItems
    .filter((t: any) => !completedIds.has(String(t.id)))
    .map((t: any, idx: number) => ({
      id: String(t.id),
      title: t.title || t.summary || 'Untitled task',
      tagLabel: t.role || (t.priority ? t.priority.toUpperCase() : 'TASK'),
      tagColor: idx === 0 ? ('amber' as const) : ('neutral' as const),
      timeEstimate: t.estimateMin ? `${t.estimateMin}m` : undefined,
      isHero: idx === 0,
    }));

  const handleComplete = (taskId: string) => {
    setCompletedIds((prev) => new Set(prev).add(taskId));
    if (roomId) {
      boardService.moveTask(String(roomId), taskId, 'done').catch((err) => {
        console.error('Failed to mark task done:', err);
      });
    }
  };

  const heroTask = tasks[0];
  const remainingTasks = tasks.slice(1);
  const tasksLeft = tasks.length;

  return (
    <TrayCard
      footerLeftLabel="Quick actions"
      footerRightLabel="My open tasks:"
      footerRightValue={`${tasksLeft}`}
      progressPercent={Math.max(10, 100 - tasksLeft * 15)}
    >
      <div className="p-6 pb-2 border-b border-[var(--color-home-hairline)] flex items-center justify-between">
        <h2 className="text-[20px] font-[600] text-[var(--color-home-text-primary)]">
          Your tasks
        </h2>
        <TagChip label={`${tasksLeft} LEFT`} color="neutral" />
      </div>

      <div className="flex flex-col min-h-[260px]">
        {heroTask ? (
          <>
            <HeroTask
              key={heroTask.id}
              task={heroTask}
              onComplete={() => handleComplete(heroTask.id)}
            />
            {remainingTasks.length > 0 && (
              <>
                <div className="h-[1px] bg-[var(--color-home-hairline)] w-full relative">
                  <div className="absolute -top-3 left-6 bg-white px-2 text-[12px] font-[600] text-[var(--color-home-text-tertiary)] uppercase tracking-wide">
                    Then
                  </div>
                </div>
                {remainingTasks.map((t) => (
                  <CompactTaskRow
                    key={t.id}
                    task={t}
                    onComplete={() => handleComplete(t.id)}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-slide-up">
            <div className="w-[64px] h-[64px] rounded-full bg-[var(--color-home-tray)] flex items-center justify-center mb-4 text-[var(--color-home-chip-green-fg)] relative">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-8 h-8"
                strokeWidth={3}
                stroke="currentColor"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  strokeDasharray="24"
                  strokeDashoffset="0"
                  className="animate-draw-check"
                />
              </svg>
            </div>
            <p className="text-[16px] font-[500] text-[var(--color-home-text-primary)] mb-1">
              All caught up.
            </p>
            <p className="text-[14px] text-[var(--color-home-text-secondary)]">
              Ask the leader or pick from the queue.
            </p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes draw-check {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        .animate-draw-check {
          animation: draw-check 400ms var(--ease-home) forwards;
        }
      `}</style>
    </TrayCard>
  );
}
