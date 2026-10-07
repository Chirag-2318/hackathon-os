/**
 * Task Drawer
 * Source: PRD §4.4
 *
 * Trigger: programmatic — useOverlay('task-drawer').open()
 * No UI trigger in this phase. Drawer surface. Content stubbed.
 */
import { useOverlay } from '@/app/providers/overlay-store';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ClipboardList } from 'lucide-react';

export function TaskDrawerOverlay() {
  const { isOpen, close } = useOverlay('task-drawer');

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <SheetContent side="right" className="sm:max-w-[560px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="size-5" />
            Task detail
          </SheetTitle>
          <SheetDescription>
            Full task detail view.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-ink-muted">
            <p className="text-body">Task detail is not yet available.</p>
            <p className="text-caption text-ink-disabled mt-1">
              Content arrives in the Board screen phase (S14).
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
