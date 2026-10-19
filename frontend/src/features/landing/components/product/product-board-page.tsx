import type { CSSProperties } from 'react';
import { Flag, Lock, Check, CheckSquare, Search, SlidersHorizontal, Plus } from 'lucide-react';
import { BOARD_FIXTURE } from '../../data/product-fixtures';

// Copied and adapted from:
// - frontend/src/features/board/board-page.tsx
// - frontend/src/features/board/components/board-column.tsx
// - frontend/src/features/board/components/jira-card.tsx

export function ProductBoardPage() {
  const { lanes, phase } = BOARD_FIXTURE;

  return (
    <div className="w-full flex flex-col gap-4 p-7 max-w-[1240px] mx-auto font-sans">
      {/* 1. Header Row: Title, Phase Pill, Filter bar */}
      <div
        className="l-ps-rise flex items-center justify-between pb-2 border-b border-border/60"
        style={{ '--l-i': 0 } as CSSProperties}
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl font-display font-normal tracking-tight text-foreground leading-none">
            {BOARD_FIXTURE.title}
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border bg-surface border-border text-ink-2">
            {phase}
          </span>
          <span className="text-xs text-muted-foreground">
            4 tasks in flight · 2 completed
          </span>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-card text-xs text-ink-2">
            <Search className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Filter tasks…</span>
          </div>
          <div className="flex items-center gap-1 h-8 px-2.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground">
            <SlidersHorizontal className="size-3 text-muted-foreground" />
            <span>Group by phase</span>
          </div>
        </div>
      </div>

      {/* 2. Kanban 3-column Grid */}
      <div className="grid grid-cols-3 gap-4 items-start">
        {lanes.map((lane, colIdx) => (
          <div
            key={lane.id}
            className="l-ps-rise flex flex-col rounded-[16px] p-2.5 bg-surface border border-border/60 min-h-[460px]"
            style={{ '--l-i': 1 + colIdx } as CSSProperties}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-1 mb-2 bg-surface select-none">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {lane.title}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-muted text-foreground">
                  {lane.tasks.length}
                </span>
              </div>
              <div className="size-5 rounded flex items-center justify-center text-muted-foreground">
                <Plus className="size-3.5" />
              </div>
            </div>

            {/* Task Cards in this Column */}
            <div className="flex flex-col gap-2.5">
              {lane.tasks.map((task, taskIdx) => {
                const isBlocked = Boolean(task.blocked);
                const isDone = Boolean(task.done);
                const hasLock = Boolean(task.waitsFor);

                return (
                  <div
                    key={task.id}
                    {...(isBlocked ? { 'data-callout': 'Blocked' } : {})}
                    {...(hasLock ? { 'data-callout': 'Dependency lock' } : {})}
                    className={`l-ps-rise group relative bg-card rounded-[12px] p-3 text-left border select-none shadow-xs ${
                      isBlocked
                        ? 'border-l-[3px] border-l-rose-500 border-border'
                        : 'border-border'
                    }`}
                    style={{ '--l-i': 4 + colIdx * 2 + taskIdx } as CSSProperties}
                  >
                    {/* Blocked banner if flagged */}
                    {isBlocked && (
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Flag className="size-3 text-rose-600 fill-rose-600 shrink-0" />
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            BLOCKED
                          </span>
                        </div>
                        {task.blockedReason && (
                          <span className="text-[10px] text-rose-600 font-medium truncate max-w-[130px]" title={task.blockedReason}>
                            {task.blockedReason}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Task Title */}
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-[13px] font-medium leading-snug line-clamp-2 text-foreground ${
                          isDone ? 'text-muted-foreground line-through' : ''
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>

                    {/* Meta Chips: Tag & Dependency */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="h-5 px-2 rounded-full text-[10px] font-mono font-medium bg-muted text-muted-foreground border border-border/40 inline-flex items-center">
                        {task.tag}
                      </span>

                      {task.waitsFor && (
                        <span className="h-5 px-2 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                          <Lock className="size-2.5" />
                          <span>Waits for upload</span>
                        </span>
                      )}

                      {task.confirmed && (
                        <span className="h-5 px-2 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-flex items-center gap-1">
                          <Check className="size-2.5 stroke-[2.5]" />
                          <span>Confirmed</span>
                        </span>
                      )}
                    </div>

                    {/* Footer Row: Issue Key, Priority, Estimate & Assignee */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border/40">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <CheckSquare className="size-3 text-muted-foreground" />
                        <span className="font-mono text-[11px] font-medium text-muted-foreground">
                          {task.key}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {task.estimate}
                        </span>

                        <div
                          className="size-5 rounded-full flex items-center justify-center font-bold text-[9px] border border-border text-ink-strong"
                          style={{ backgroundColor: task.assignee.color }}
                          title={task.assignee.name}
                        >
                          {task.assignee.initials}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
