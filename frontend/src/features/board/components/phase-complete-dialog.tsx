import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowRight, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { phaseService, type PhaseSummary } from '@/services/phaseService';
import { toast } from 'sonner';

export interface PhaseCompleteDialogProps {
  isOpen: boolean;
  phase: PhaseSummary;
  nextPhase?: PhaseSummary | null;
  roomId: string;
  isLeader: boolean;
  onClose: () => void;
  onAdvanceSuccess: (nextPhaseKey: string | null, isBuildComplete: boolean) => void;
  onBuildCheckpoint?: () => void;
}

export function PhaseCompleteDialog({
  isOpen,
  phase,
  nextPhase,
  roomId,
  isLeader,
  onClose,
  onAdvanceSuccess,
  onBuildCheckpoint,
}: PhaseCompleteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLastPhase = !nextPhase;

  // Calculate stat line
  const confirmedCount = phase.taskCounts?.confirmed ?? 0;
  const hoursPlanned = Math.round(phase.hoursPlanned ?? 0);
  const hoursConfirmed = Math.round(phase.hoursConfirmed ?? 0);

  // Time difference against phase window
  let timeDiffText = '';
  if (phase.window?.endTime) {
    const endMs = new Date(phase.window.endTime).getTime();
    const nowMs = Date.now();
    const diffHours = Math.round(Math.abs(nowMs - endMs) / (1000 * 3600));
    if (nowMs < endMs) {
      timeDiffText = `finished ${diffHours}h ahead of schedule`;
    } else {
      timeDiffText = `finished ${diffHours}h behind phase window`;
    }
  }

  const handleStartNext = async () => {
    if (isLastPhase) {
      if (onBuildCheckpoint) {
        onBuildCheckpoint();
      } else {
        setIsSubmitting(true);
        try {
          const res = await phaseService.advancePhase(roomId, phase.key);
          onAdvanceSuccess(null, true);
        } catch (err: any) {
          toast.error(err?.message || 'Failed to complete build');
        } finally {
          setIsSubmitting(false);
        }
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await phaseService.advancePhase(roomId, phase.key);
      toast.success(`${nextPhase?.key || 'Next phase'} started`);
      onAdvanceSuccess(res.nextPhaseKey, false);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to advance phase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotYet = async () => {
    try {
      await phaseService.dismissReady(roomId, phase.key);
    } catch (err) {
      console.error('Failed to dismiss ready:', err);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md p-6 sm:p-7 rounded-2xl bg-card border border-border shadow-lg">
        <DialogHeader className="flex flex-col gap-1 items-start text-left">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle2 className="size-5" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">
              Phase Checkpoint Reached
            </span>
          </div>

          <DialogTitle
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-2xl sm:text-3xl font-normal tracking-tight text-foreground"
          >
            {isLastPhase ? 'Build complete.' : `${phase.key} complete.`}
          </DialogTitle>
        </DialogHeader>

        {/* Quiet stat line */}
        <div className="py-2 flex flex-col gap-1 text-xs font-mono text-muted-foreground border-y border-border/50 my-1">
          <div className="flex items-center justify-between">
            <span>Tasks confirmed:</span>
            <span className="font-semibold text-foreground">{confirmedCount} confirmed</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Confirmed hours:</span>
            <span className="font-semibold text-foreground">{hoursConfirmed}h (planned {hoursPlanned}h)</span>
          </div>
          {timeDiffText && (
            <div className="flex items-center justify-between text-muted-foreground/80">
              <span>Pacing:</span>
              <span>{timeDiffText}</span>
            </div>
          )}
        </div>

        {/* Next phase preview if not last */}
        {!isLastPhase && nextPhase && (
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-col gap-1 text-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Next Up: {nextPhase.key} ({nextPhase.name})
            </span>
            {nextPhase.goal && (
              <p className="text-foreground/90 text-xs mt-0.5 line-clamp-2">
                {nextPhase.goal}
              </p>
            )}
            <span className="font-mono text-[11px] text-muted-foreground mt-1">
              Window: {nextPhase.window?.startHour ?? (nextPhase.position * 4)}h – {nextPhase.window?.endHour ?? ((nextPhase.position + 1) * 4)}h
            </span>
          </div>
        )}

        <DialogFooter className="flex sm:flex-row items-center justify-between gap-2 mt-4 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleNotYet}
            disabled={isSubmitting}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Not yet
          </Button>

          <Button
            type="button"
            onClick={handleStartNext}
            disabled={isSubmitting}
            className="h-9 px-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : isLastPhase ? (
              <span>Proceed to Checkpoint</span>
            ) : (
              <>
                <span>Start {nextPhase?.key || 'Next'}</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
