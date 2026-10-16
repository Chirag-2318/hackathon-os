import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface OverviewStatStripProps {
  passedCheckpoints: number;
  totalCheckpoints: number;
  openTasksCount: number;
  todoCount: number;
  inProgressCount: number;
  blockedCount: number;
  deltaPct: number;
  actualPct: number;
  plannedPct: number;
  activeMembersCount: number;
  totalMembersCount: number;
}

export function OverviewStatStrip({
  passedCheckpoints,
  totalCheckpoints,
  openTasksCount,
  todoCount,
  inProgressCount,
  blockedCount,
  deltaPct,
  actualPct,
  plannedPct,
  activeMembersCount,
  totalMembersCount,
}: OverviewStatStripProps) {
  const sumTasks = Math.max(1, todoCount + inProgressCount + blockedCount);
  const todoPct = (todoCount / sumTasks) * 100;
  const ipPct = (inProgressCount / sumTasks) * 100;
  const blockedPct = (blockedCount / sumTasks) * 100;

  let planState = 'On plan';
  let planColor = 'text-semantic-success-fg dark:text-emerald-400';
  if (deltaPct < -5) {
    planState = 'Behind';
    planColor = 'text-danger';
  } else if (deltaPct > 5) {
    planState = 'Ahead';
    planColor = 'text-accent';
  }

  return (
    <div className="border-y border-border py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* 1. Checkpoints */}
        <div className="px-3 sm:px-5 py-2 flex flex-col justify-between">
          <span className="text-xs text-muted-foreground font-normal">Checkpoints</span>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-[30px] font-mono tabular-nums font-normal text-foreground leading-none my-1.5"
          >
            {passedCheckpoints} / {totalCheckpoints}
          </motion.div>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {passedCheckpoints === totalCheckpoints
              ? 'All completed'
              : `${Math.max(0, totalCheckpoints - passedCheckpoints)} remaining`}
          </span>
        </div>

        {/* 2. Tasks open */}
        <div className="px-3 sm:px-5 py-2 flex flex-col justify-between">
          <span className="text-xs text-muted-foreground font-normal">Tasks open</span>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-[30px] font-mono tabular-nums font-normal text-foreground leading-none my-1.5"
          >
            {openTasksCount}
          </motion.div>
          <div className="space-y-1">
            <div className="h-1 w-full rounded-full overflow-hidden flex gap-0.5 bg-muted">
              <div
                style={{ width: `${todoPct}%` }}
                className="bg-neutral-400 dark:bg-neutral-600 transition-all duration-300"
                title={`${todoCount} todo`}
              />
              <div
                style={{ width: `${ipPct}%` }}
                className="bg-blue-500 transition-all duration-300"
                title={`${inProgressCount} in progress`}
              />
              <div
                style={{ width: `${blockedPct}%` }}
                className="bg-danger transition-all duration-300"
                title={`${blockedCount} blocked`}
              />
            </div>
            <div className="text-[11px] font-mono text-muted-foreground tabular-nums truncate">
              {todoCount} todo · {inProgressCount} in progress · {blockedCount} blocked
            </div>
          </div>
        </div>

        {/* 3. Vs plan */}
        <div className="px-3 sm:px-5 py-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-normal">Vs plan</span>
            <span className={cn('text-xs font-medium', planColor)}>{planState}</span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-[30px] font-mono tabular-nums font-normal text-foreground leading-none my-1.5"
          >
            {deltaPct >= 0 ? `+${deltaPct}%` : `${deltaPct}%`}
          </motion.div>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {actualPct}% done, {plannedPct}% planned
          </span>
        </div>

        {/* 4. Team active */}
        <div className="px-3 sm:px-5 py-2 flex flex-col justify-between">
          <span className="text-xs text-muted-foreground font-normal">Team active</span>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-[30px] font-mono tabular-nums font-normal text-foreground leading-none my-1.5"
          >
            {activeMembersCount} / {totalMembersCount}
          </motion.div>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
            {activeMembersCount === totalMembersCount
              ? 'All working'
              : `${Math.max(0, totalMembersCount - activeMembersCount)} idle`}
          </span>
        </div>
      </div>
    </div>
  );
}
