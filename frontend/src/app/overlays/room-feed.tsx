/**
 * Room Feed slide-over
 * Source: PRD §4.3
 *
 * Trigger: Bell icon in top bar, keyboard F.
 * Slide-over surface. Content stubbed.
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
import { Bell } from 'lucide-react';

export function RoomFeedOverlay() {
  const { isOpen, close, toggle } = useOverlay('room-feed');

  useKeyboardShortcut({ key: 'f', handler: toggle });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <SheetContent side="right" className="sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Room feed
          </SheetTitle>
          <SheetDescription>
            Announcements, blockers, mentions, and system events.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-ink-muted">
            <p className="text-body">Feed content is not yet available.</p>
            <p className="text-caption text-ink-disabled mt-1">
              Content arrives in a later phase.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
