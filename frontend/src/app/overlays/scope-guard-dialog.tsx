/**
 * Scope Guard Dialog
 * Source: PRD §4.6
 *
 * Trigger: programmatic — useOverlay('scope-guard').open()
 * Centered dialog. Content stubbed.
 * Eventually: "Does a judge need to see this?" with Yes add / Park it / Cancel.
 */
import { useOverlay } from '@/app/providers/overlay-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Shield } from 'lucide-react';

export function ScopeGuardDialogOverlay() {
  const { isOpen, close } = useOverlay('scope-guard');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            Scope guard
          </DialogTitle>
          <DialogDescription>
            Adding a task after feature freeze requires confirmation.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="text-center text-ink-muted">
            <p className="text-body">Scope guard is not yet available.</p>
            <p className="text-caption text-ink-disabled mt-1">
              Content arrives in the Board/task-creation screen phase.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
