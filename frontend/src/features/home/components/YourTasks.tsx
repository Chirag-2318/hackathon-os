import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TagChip, TimeChip, InlineHighlight, TrayCard, Checkbox } from './HomeDesignSystem';
import { mockYourTasks, type Task } from '../homeMock';
import { getRooms, getTasks, CURRENT_USER_ID } from '@/services/mockStore';
import { boardService } from '@/services/boardService';

function HeroTask({ task, onComplete }: { task: Task; onComplete: () => void }) {
  const [started, setStarted] = useState(false);
  const [checked, setChecked] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (started && !checked) {
      const interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [started, checked]);

  const handleComplete = () => {
    if (checked) return;
    setChecked(true);
    setTimeout(() => {
      onComplete();
    }, 600); // Wait for animations to finish before collapsing
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "px-6 py-5 transition-all duration-[var(--dur-standard)] ease-[var(--ease-home)] relative overflow-hidden",
      checked ? "opacity-0 h-0 p-0 scale-95" : "opacity-100 h-[160px] scale-100"
    )}>
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
            <TimeChip timeRemaining={task.timeEstimate} />
            {task.resourceLink && (
              <InlineHighlight asLink href={task.resourceHref}>
                {task.resourceLink}
              </InlineHighlight>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!started ? (
              <button 
                onClick={() => setStarted(true)}
                className="h-[44px] px-6 rounded-[var(--radius-home-btn)] bg-[var(--color-home-text-primary)] text-white text-[15px] font-[600] focus-visible:outline-2 focus-visible:outline-[var(--color-home-accent)] hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                Start
              </button>
            ) : (
              <button 
                onClick={handleComplete}
                className="h-[44px] px-6 rounded-[var(--radius-home-btn)] bg-[var(--color-home-text-primary)] text-white text-[15px] font-[600] flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-[var(--color-home-accent)] hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                Mark done
                <span className="text-white/70 tabular-nums font-[500]">{formatTimer(timer)}</span>
              </button>
            )}
            <button className="h-[44px] px-4 rounded-[var(--radius-home-btn)] text-[var(--color-home-text-secondary)] text-[15px] font-[500] hover:bg-[var(--color-home-chip-red-bg)] hover:text-[var(--color-home-chip-red-fg)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-home-accent)]">
              I'm blocked
            </button>
            <button className="h-[44px] px-4 rounded-[var(--radius-home-btn)] text-[var(--color-home-text-secondary)] text-[15px] font-[500] hover:bg-[var(--color-home-tray)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-home-accent)]">
              Skip
            </button>
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

function CompactTaskRow({ task, onComplete }: { task: Task; onComplete: () => void }) {
  const [checked, setChecked] = useState(false);

  const handleComplete = () => {
    if (checked) return;
    setChecked(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  return (
    <div className={cn(
      "flex items-start gap-4 px-6 py-3 border-b border-[var(--color-home-hairline)] last:border-0 transition-all duration-[var(--dur-standard)] ease-[var(--ease-home)] relative overflow-hidden",
      checked ? "opacity-0 h-0 py-0 border-transparent scale-95" : "opacity-100 h-[64px] scale-100"
    )}>
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
          <TimeChip timeRemaining={task.timeEstimate || undefined} />
        </div>
      </div>
    </div>
  );
}

export function YourTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const rooms = getRooms();
    const activeRoom = Object.values(rooms).find(r => r.stage === 'build');
    if (activeRoom) {
      const allTasks = getTasks(activeRoom.id);
      const userTasks = allTasks.filter(t => t.assigneeId === CURRENT_USER_ID && t.status !== 'done');
      if (userTasks.length > 0) {
        return userTasks.slice(0, 4).map((t, idx) => ({
          id: t.id,
          title: t.summary,
          tagLabel: t.role || 'Sprint',
          tagColor: (idx === 0 ? 'amber' : 'neutral') as any,
          timeEstimate: t.estimateMin ? `${t.estimateMin}m` : '45m',
          isHero: idx === 0,
        }));
      }
    }
    return mockYourTasks;
  });
  const [tasksLeft, setTasksLeft] = useState(() => tasks.length);
  const [progress, setProgress] = useState(25);

  const handleComplete = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setTasksLeft(prev => Math.max(0, prev - 1));
    setProgress(prev => Math.min(100, prev + 2)); // Mock progress bump
    const rooms = getRooms();
    const activeRoom = Object.values(rooms).find(r => r.stage === 'build');
    if (activeRoom) {
      boardService.updateTaskStatus(activeRoom.id, taskId, 'done');
    }
  };

  const heroTask = tasks[0];
  const remainingTasks = tasks.slice(1);

  return (
    <TrayCard
      footerLeftLabel="Quick actions"
      footerRightLabel="Polish phase:"
      footerRightValue={`${progress}%`}
      progressPercent={progress}
    >
      <div className="p-6 pb-2 border-b border-[var(--color-home-hairline)] flex items-center justify-between">
        <h2 className="text-[20px] font-[600] text-[var(--color-home-text-primary)]">
          Your tasks
        </h2>
        <TagChip label={`${tasksLeft} LEFT`} color="neutral" />
      </div>

      <div className="flex flex-col min-h-[300px]">
        {heroTask ? (
          <>
            <HeroTask key={heroTask.id} task={heroTask} onComplete={() => handleComplete(heroTask.id)} />
            {remainingTasks.length > 0 && (
              <>
                <div className="h-[1px] bg-[var(--color-home-hairline)] w-full relative">
                  <div className="absolute -top-3 left-6 bg-white px-2 text-[12px] font-[600] text-[var(--color-home-text-tertiary)] uppercase tracking-wide">
                    Then
                  </div>
                </div>
                {remainingTasks.map(t => (
                  <CompactTaskRow key={t.id} task={t} onComplete={() => handleComplete(t.id)} />
                ))}
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-slide-up">
            <div className="w-[64px] h-[64px] rounded-full bg-[var(--color-home-tray)] flex items-center justify-center mb-4 text-[var(--color-home-chip-green-fg)] relative">
               <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" strokeWidth={3} stroke="currentColor">
                 <path d="M20 6L9 17l-5-5" strokeDasharray="24" strokeDashoffset="0" className="animate-draw-check" />
               </svg>
            </div>
            <p className="text-[16px] font-[500] text-[var(--color-home-text-primary)] mb-1">All caught up.</p>
            <p className="text-[14px] text-[var(--color-home-text-secondary)]">Ask the leader or pick from the queue.</p>
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
