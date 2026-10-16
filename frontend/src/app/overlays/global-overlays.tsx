/**
 * GlobalOverlays — renders overlay containers mounted at app shell root.
 */
import React, { lazy, Suspense } from 'react';
import { CommandPaletteOverlay } from './command-palette';
import { RubricDrawerOverlay } from './rubric-drawer';
import { RoomFeedOverlay } from './room-feed';
import { TaskDrawerOverlay } from './task-drawer';
import { BlockerDialogOverlay } from './blocker-dialog';
import { ScopeGuardDialogOverlay } from './scope-guard-dialog';
import { InviteDialogOverlay } from './invite-dialog';
import { CreateRoomDialogOverlay } from './create-room-dialog';
import { JoinCodeDialogOverlay } from './join-code-dialog';
import { KeyboardShortcutsModal } from '@/tour/shortcuts/KeyboardShortcutsModal';
import { AiKeyDialog, AiKeyFirstRunChecker } from '@/features/ai-gate';

const SpotlightTour = lazy(() =>
  import('@/tour/spotlight').then((m) => ({ default: m.SpotlightTour }))
);

const GuidedTour = lazy(() =>
  import('@/tour/guided').then((m) => ({ default: m.GuidedTour }))
);

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
      <Suspense fallback={null}>
        <GuidedTour />
      </Suspense>
      <Suspense fallback={null}>
        <SpotlightTour />
      </Suspense>
      <KeyboardShortcutsModal />
      <AiKeyDialog />
      <AiKeyFirstRunChecker />
    </>
  );
}
