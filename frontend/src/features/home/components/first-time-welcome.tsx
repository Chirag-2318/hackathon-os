import * as React from 'react';
import { Link } from 'react-router-dom';
import { Plus, KeyRound, BookOpen, Compass } from 'lucide-react';
import { useOverlay } from '@/app/providers/overlay-store';
import { useSpotlightStore } from '@/tour/spotlight/spotlight-store';
import { getHomeTourSteps } from '@/tour/spotlight/home-steps';

export function FirstTimeWelcome() {
  const createRoomModal = useOverlay('create-room-dialog');
  const joinCodeModal = useOverlay('join-code-dialog');

  return (
    <div className="w-full max-w-[640px] py-4 flex flex-col gap-3 text-left">
      <div>
        <h1
          className="text-[30px] font-normal leading-tight text-foreground"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Start your journey
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          You aren't in any active rooms right now. Create a team room to begin, or join with a code.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => createRoomModal.open()}
          data-tour="create-room"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] bg-foreground text-background text-[13px] font-medium hover:opacity-90 active:scale-[0.98] transition-all duration-150 cursor-pointer"
        >
          <Plus className="size-4 stroke-[2]" />
          <span>Create room</span>
        </button>

        <button
          type="button"
          onClick={() => joinCodeModal.open()}
          data-tour="join-room-btn"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[8px] border border-black/[0.08] dark:border-white/[0.08] text-foreground text-[13px] font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer"
        >
          <KeyRound className="size-4 stroke-[1.5]" />
          <span>Join with code</span>
        </button>

        <Link
          to="/app/playbooks"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors ml-1"
        >
          <BookOpen className="size-3.5 stroke-[1.5]" />
          <span>Browse playbooks</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            useSpotlightStore.getState().startTour(getHomeTourSteps(false));
          }}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Compass className="size-3.5 stroke-[1.5] text-amber-500" />
          <span>Take a tour of Home</span>
        </button>
      </div>
    </div>
  );
}
