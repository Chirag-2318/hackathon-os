import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Task } from '@/services/types';
import type { PhaseSummary } from '@/services/phaseService';
import { playSound } from '@/shared/sound/sound-effects';

export interface CarryOverDialogProps {
  isOpen: boolean;
  phase: PhaseSummary;
  nextPhase?: PhaseSummary | null;
  unfinishedTasks: Task[];
  onClose: () => void;
  onConfirm: (choice: 'DEFER_ALL' | 'DROP_ALL') => Promise<void>;
}

export function CarryOverDialog({
  isOpen,
  phase,
  nextPhase,
  unfinishedTasks,
  onClose,
  onConfirm,
}: CarryOverDialogProps) {
  const [choice, setChoice] = useState<'DEFER_ALL' | 'DROP_ALL'>('DEFER_ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetKey = nextPhase?.key || 'the next phase';

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(choice);
      if (choice === 'DROP_ALL') {
        playSound('destructive');
      } else {
        playSound('success');
      }
      onClose();
    } catch {
      // toast handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md p-6 rounded-2xl bg-card border border-border shadow-lg">
        <DialogHeader className="flex flex-col gap-1 items-start text-left">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <AlertTriangle className="size-4" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">
              Start Next Phase Early
            </span>
          </div>

          <DialogTitle className="text-xl font-display font-medium text-foreground">
            Advance from {phase.key} to {targetKey}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground mt-1">
          There are {unfinishedTasks.length} unfinished tasks remaining in {phase.key}. Choose how to handle them:
        </p>

        {/* Task List */}
        <div className="max-h-36 overflow-y-auto rounded-xl border border-border/60 bg-muted/30 p-2.5 flex flex-col gap-1.5 my-2">
          {unfinishedTasks.map((t) => (
            <div key={t.id || t.key} className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span className="font-semibold text-foreground truncate max-w-[240px]">
                {t.key}: {t.summary || t.title}
              </span>
              <span className="text-[11px] uppercase opacity-75">{t.status}</span>
            </div>
          ))}
        </div>

        {/* Radio Choices */}
        <RadioGroup
          value={choice}
          onValueChange={(val) => setChoice(val as 'DEFER_ALL' | 'DROP_ALL')}
          className="flex flex-col gap-3 my-2"
        >
          <div className="flex items-start gap-2.5 rounded-xl border border-border/60 p-3 hover:bg-muted/30 transition-colors">
            <RadioGroupItem value="DEFER_ALL" id="defer-all" className="mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="defer-all" className="text-xs font-semibold text-foreground cursor-pointer">
                Move them to {targetKey}
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Tasks will be reassigned into {targetKey} and counted toward its workload.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-border/60 p-3 hover:bg-muted/30 transition-colors">
            <RadioGroupItem value="DROP_ALL" id="drop-all" className="mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="drop-all" className="text-xs font-semibold text-foreground cursor-pointer">
                Drop them
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Tasks will be marked as DROPPED and excluded from progress and blocking checks.
              </span>
            </div>
          </div>
        </RadioGroup>

        <DialogFooter className="flex sm:flex-row items-center justify-between gap-2 mt-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="h-9 px-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
            <span>Confirm & Advance</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
