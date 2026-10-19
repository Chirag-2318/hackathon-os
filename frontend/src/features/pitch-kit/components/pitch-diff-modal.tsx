import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

export interface PitchDiffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  originalText?: string;
  proposedText: string;
  diffText?: string;
  onAccept: () => void;
  onDismiss: () => void;
  acceptLabel?: string;
  isPending?: boolean;
}

export function PitchDiffModal({
  open,
  onOpenChange,
  title,
  originalText,
  proposedText,
  diffText,
  onAccept,
  onDismiss,
  acceptLabel = 'Accept replacement',
  isPending = false,
}: PitchDiffModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border p-6 space-y-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-normal text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {diffText ? (
            <div className="border border-border/80 rounded-md p-3 bg-muted/20 font-mono text-xs whitespace-pre-wrap leading-relaxed">
              {diffText}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border/70 rounded-md p-3 bg-muted/10 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block font-medium">
                  Current
                </span>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {originalText || '(empty)'}
                </p>
              </div>

              <div className="border border-primary/30 rounded-md p-3 bg-primary/5 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-primary block font-medium">
                  Proposed
                </span>
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {proposedText}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            <X className="w-3.5 h-3.5 mr-1.5" /> Dismiss
          </Button>
          <Button
            size="sm"
            onClick={onAccept}
            disabled={isPending}
            className="text-xs"
          >
            <Check className="w-3.5 h-3.5 mr-1.5" /> {acceptLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
