/**
 * Blocker Dialog
 * Source: PRD §4.5
 *
 * Trigger: Pink FAB (sidebar, mobile, Speed Mode), keyboard B.
 * Centered dialog. Content stubbed.
 */
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';
import { useOverlay } from '@/app/providers/overlay-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

export function BlockerDialogOverlay() {
  const { isOpen, close, toggle } = useOverlay('blocker-dialog');

  useKeyboardShortcut({ key: 'b', handler: toggle });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-color-danger-text" />
            I&apos;m blocked
          </DialogTitle>
          <DialogDescription>
            Report what&apos;s blocking you. Your captain will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="text-center text-ink-muted">
            <p className="text-body">Blocker form is not yet available.</p>
            <p className="text-caption text-ink-disabled mt-1">
              Content arrives in a later phase.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
