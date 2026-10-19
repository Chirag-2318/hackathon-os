import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/design';
import { MoreHorizontal, Plus, RefreshCw, FastForward } from 'lucide-react';
import type { PhaseSummary } from '@/services/phaseService';
import { PhaseGenerationPanel } from './phase-generation-panel';
import { CarryOverDialog } from './carryover-dialog';
import type { Task } from '@/services/types';

import { selectTaskCounts } from '../task-selectors';

export interface PhaseHeaderRowProps {
  roomId: string;
  phase: PhaseSummary;
  nextPhase?: PhaseSummary | null;
  isLeader: boolean;
  tasks: Task[];
  onRefresh: () => void;
  onAdvanceEarly: (choice: 'DEFER_ALL' | 'DROP_ALL') => Promise<void>;
}

export function PhaseHeaderRow({
  roomId,
  phase,
  nextPhase,
  isLeader,
  tasks,
  onRefresh,
  onAdvanceEarly,
}: PhaseHeaderRowProps) {
  const [isAppendModalOpen, setIsAppendModalOpen] = useState(false);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);
  const [isCarryOverOpen, setIsCarryOverOpen] = useState(false);

  const counts = React.useMemo(() => selectTaskCounts(tasks), [tasks]);
  const phaseCounts = counts.byPhase[phase.key.toUpperCase()] || {
    total: 0,
    confirmed: 0,
    inProgress: 0,
    todo: 0,
    awaitingLeader: 0,
    dropped: 0,
  };
  const confirmedCount = phaseCounts.confirmed;
  const totalCount = phaseCounts.total;

  // Unfinished tasks in this phase for early advance
  const unfinishedTasks = tasks.filter(
    (t) =>
      (t.phaseKey?.toUpperCase() === phase.key.toUpperCase() ||
        t.phaseId === phase.key ||
        t.phaseId === phase.id) &&
      t.status !== 'done' &&
      t.status !== 'dropped'
  );

  // Can regenerate if no tasks have started (no confirmed, none in progress)
  const canRegenerate =
    phaseCounts.confirmed === 0 &&
    phaseCounts.inProgress === 0 &&
    phase.status === 'ACTIVE';

  return (
    <>
      <div className="flex items-center justify-between gap-4 py-2 px-3 rounded-xl bg-card border border-border/80 shadow-2xs">
        {/* Left: Phase Title & Name */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs font-bold text-foreground shrink-0 uppercase tracking-wide">
            {phase.key}
          </span>
          <span className="text-xs font-semibold text-foreground truncate">
            {phase.name}
          </span>
          {phase.status === 'COMPLETED' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Completed · Read only
            </span>
          )}
        </div>

        {/* Right: Confirmed count, segmented bar, and leader "..." menu */}
        <div className="flex items-center gap-3 shrink-0">
          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                {confirmedCount} of {totalCount} confirmed
              </span>

              {/* Thin segmented bar */}
              <div
                className="flex items-center gap-0.5 h-1.5 w-24 sm:w-32 rounded-full overflow-hidden bg-muted/60 p-0.5"
                title={`${confirmedCount} of ${totalCount} confirmed`}
              >
                {Array.from({ length: Math.min(totalCount, 24) }).map((_, i) => {
                  const isFilled = i < Math.round((confirmedCount / Math.max(totalCount, 1)) * Math.min(totalCount, 24));
                  return (
                    <div
                      key={i}
                      className={`h-full flex-1 rounded-xs transition-colors duration-200 ${
                        isFilled ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {isLeader && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Phase options"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-xs">
                <DropdownMenuItem
                  onClick={() => setIsAppendModalOpen(true)}
                  className="cursor-pointer gap-2"
                >
                  <Plus className="size-3.5 text-muted-foreground" />
                  <span>Add missing tasks</span>
                </DropdownMenuItem>

                {canRegenerate && (
                  <DropdownMenuItem
                    onClick={() => setIsRegenerateConfirmOpen(true)}
                    className="cursor-pointer gap-2"
                  >
                    <RefreshCw className="size-3.5 text-muted-foreground" />
                    <span>Regenerate tasks</span>
                  </DropdownMenuItem>
                )}

                {phase.status === 'ACTIVE' && nextPhase && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsCarryOverOpen(true)}
                      className="cursor-pointer gap-2 text-amber-600 dark:text-amber-400"
                    >
                      <FastForward className="size-3.5" />
                      <span>Start next phase early</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Append Tasks Dialog */}
      {isAppendModalOpen && (
        <Dialog open={isAppendModalOpen} onOpenChange={setIsAppendModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-card border border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-display">
                Add Missing Tasks for {phase.key} ({phase.name})
              </DialogTitle>
            </DialogHeader>
            <PhaseGenerationPanel
              roomId={roomId}
              phase={phase}
              isLeader={isLeader}
              mode="APPEND"
              onImportSuccess={() => {
                setIsAppendModalOpen(false);
                onRefresh();
              }}
              onCancel={() => setIsAppendModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Regenerate Confirm Dialog */}
      <ConfirmDialog
        open={isRegenerateConfirmOpen}
        onOpenChange={setIsRegenerateConfirmOpen}
        title={`Regenerate tasks for ${phase.key}?`}
        description="This will replace all unstarted tasks generated for this phase. Any custom progress on started tasks would be lost."
        confirmLabel="Regenerate"
        variant="primary"
        onConfirm={() => {
          setIsRegenerateConfirmOpen(false);
          setIsAppendModalOpen(false);
          // Open generation panel in FRESH mode
          setIsAppendModalOpen(true);
        }}
      />

      {/* Carry Over Dialog for early advance */}
      {isCarryOverOpen && (
        <CarryOverDialog
          isOpen={isCarryOverOpen}
          phase={phase}
          nextPhase={nextPhase}
          unfinishedTasks={unfinishedTasks}
          onClose={() => setIsCarryOverOpen(false)}
          onConfirm={onAdvanceEarly}
        />
      )}
    </>
  );
}
