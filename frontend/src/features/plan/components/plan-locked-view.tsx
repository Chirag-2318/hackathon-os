import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
export interface PlanLockedViewProps {
  roomId: string;
  docsCount?: number;
  tasksCount?: number;
  phasesCount?: number;
  onEnterBuild?: () => Promise<void>;
  isEnteringBuild?: boolean;
  isLeader?: boolean;
}

export function PlanLockedView({
  roomId: _roomId,
  docsCount = 9,
  tasksCount = 38,
  phasesCount = 5,
  onEnterBuild,
  isEnteringBuild = false,
  isLeader = true,
}: PlanLockedViewProps) {

  // Sequence state: index of the current active/completed building row
  // 0: Row 0 spinning
  // 1: Row 0 done, Row 1 spinning
  // 2: Row 1 done, Row 2 spinning
  // 3: Row 2 done, Row 3 spinning
  // 4: All rows done, show success block
  const [sequenceStep, setSequenceStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setSequenceStep(1), 400),
      setTimeout(() => setSequenceStep(2), 800),
      setTimeout(() => setSequenceStep(3), 1250),
      setTimeout(() => setSequenceStep(4), 1750),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const buildRows = [
    { label: `Writing ${docsCount} documents` },
    { label: `Creating ${phasesCount} phases` },
    { label: `Creating ${tasksCount} tasks on the board` },
    { label: `Assigning tasks by role` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
      className="w-full max-w-xl mx-auto my-auto"
    >
      <div className="rounded-[24px] bg-card border border-border shadow-xs p-8 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Building your workspace</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Transforming validated plan specifications into active sprint assets.
          </p>
        </div>

        {/* 4 Staggered Construction Rows */}
        <div className="flex flex-col gap-3 py-2">
          {buildRows.map((row, idx) => {
            const isVisible = sequenceStep >= idx;
            const isDone = sequenceStep > idx;

            if (!isVisible) return null;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-3 text-sm py-1"
              >
                <div className="size-6 rounded-full flex items-center justify-center shrink-0">
                  {isDone ? (
                    <div className="size-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Check className="size-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <Loader2 className="size-4 animate-spin text-blue-600" />
                  )}
                </div>
                <span className={isDone ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                  {row.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Success Block (Appears after all 4 rows finish) */}
        <AnimatePresence>
          {sequenceStep >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="pt-6 border-t border-border/60 flex flex-col items-center text-center gap-4"
            >
              <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <Check className="size-6 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">Plan complete</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Your workspace is ready.</p>
              </div>

              <Button
                onClick={onEnterBuild}
                disabled={isEnteringBuild}
                className="h-10 px-6 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 font-semibold text-xs shadow-xs animate-pulse"
              >
                {isEnteringBuild ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin" /> Opening build phase...
                  </span>
                ) : (
                  'Open build workspace \u2192'
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
