/**
 * Rubric Drawer
 * Source: PRD §4.2
 *
 * Trigger: Rubric button in Phase Track, keyboard R.
 * Slide-over/drawer surface. Content stubbed.
 */
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';
import { useOverlay } from '@/app/providers/overlay-store';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { BookOpen } from 'lucide-react';

export function RubricDrawerOverlay() {
  const { isOpen, close, toggle } = useOverlay('rubric-drawer');

  useKeyboardShortcut({ key: 'r', handler: toggle });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <SheetContent side="right" className="sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            Rubric
          </SheetTitle>
          <SheetDescription>
            Rubric criteria, coverage status, pinned rules, and AI-use policy.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-ink-muted">
            <p className="text-body">Rubric content is not yet available.</p>
            <p className="text-caption text-ink-disabled mt-1">
              Content arrives in a later phase.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
