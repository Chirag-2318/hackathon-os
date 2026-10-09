/**
 * GlobalOverlays — renders all 7 overlay containers.
 * Mount once at app root. Each overlay manages its own open/close state.
 */
import { CommandPaletteOverlay } from './command-palette';
import { RubricDrawerOverlay } from './rubric-drawer';
import { RoomFeedOverlay } from './room-feed';
import { TaskDrawerOverlay } from './task-drawer';
import { BlockerDialogOverlay } from './blocker-dialog';
import { ScopeGuardDialogOverlay } from './scope-guard-dialog';
import { InviteDialogOverlay } from './invite-dialog';
import { CreateRoomDialogOverlay } from './create-room-dialog';
import { JoinCodeDialogOverlay } from './join-code-dialog';

export function GlobalOverlays() {
  return (
    <>
      <CommandPaletteOverlay />
      <RubricDrawerOverlay />
      <RoomFeedOverlay />
      <TaskDrawerOverlay />
      <BlockerDialogOverlay />
      <ScopeGuardDialogOverlay />
      <InviteDialogOverlay />
      <CreateRoomDialogOverlay />
      <JoinCodeDialogOverlay />
    </>
  );
}
