import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight, FileText, CheckSquare, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PlanLockedViewProps {
  roomId: string;
  docsCount?: number;
  tasksCount?: number;
  phasesCount?: number;
  onEnterBuild?: () => Promise<void> | void;
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
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
      className="w-full max-w-lg mx-auto my-auto py-12"
    >
      <div className="rounded-2xl bg-card border border-border shadow-xs p-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Check className="size-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Plan locked & verified</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sprint specifications have been confirmed for execution.
            </p>
          </div>
        </div>

        {/* Real specs breakdown */}
        <div className="grid grid-cols-2 gap-3 py-2 border-y border-border/60">
          <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-muted/30">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <FileText className="size-3.5" />
              <span>Docs</span>
            </div>
            <span className="font-mono text-xl font-bold text-foreground">{docsCount}</span>
          </div>

          <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-muted/30">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Layers className="size-3.5" />
              <span>Phases</span>
            </div>
            <span className="font-mono text-xl font-bold text-foreground">{phasesCount}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={onEnterBuild}
            disabled={isEnteringBuild}
            className="w-full h-10 rounded-xl font-semibold text-xs gap-2"
          >
            <span>{isEnteringBuild ? 'Setting up build...' : 'Open build workspace'}</span>
            <ArrowRight className="size-3.5" />
          </Button>

          {!isLeader && (
            <p className="text-[11px] text-muted-foreground text-center">
              Sprint plan is locked. Enter the build workspace to collaborate with your team.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
