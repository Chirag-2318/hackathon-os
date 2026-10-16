import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './button';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
}

/**
 * ConfirmDialog component ensuring accessibility, keyboard focus trap,
 * and clear confirmation vs cancellation actions.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 rounded-[12px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <DialogHeader className="space-y-1.5 text-left">
          <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-5 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            isLoading={isLoading}
            data-sound={variant === 'danger' ? 'destructive' : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
