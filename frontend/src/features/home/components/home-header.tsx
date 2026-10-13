import * as React from 'react';
import { Calendar, Compass } from 'lucide-react';
import { format } from 'date-fns';
import { useSpotlightStore } from '@/tour/spotlight/spotlight-store';
import { getHomeTourSteps } from '@/tour/spotlight/home-steps';

interface HomeHeaderProps {
  firstName: string;
  roomCount: number;
  liveRoomCount: number;
  hasRooms: boolean;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeHeader({
  firstName,
  roomCount,
  liveRoomCount,
  hasRooms,
}: HomeHeaderProps) {
  const today = React.useMemo(() => format(new Date(), 'EEEE, MMMM d'), []);
  const greeting = getGreeting();

  const headlineSentence = React.useMemo(() => {
    if (!hasRooms || roomCount === 0) {
      return 'Ready when you are.';
    }
    const roomPlural = roomCount === 1 ? 'room' : 'rooms';
    const liveText = liveRoomCount === 1 ? '1 live' : `${liveRoomCount} live`;
    return `${roomCount} ${roomPlural}, ${liveText}.`;
  }, [hasRooms, roomCount, liveRoomCount]);

  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
      <div className="flex flex-col">
        <p
          data-testid="home-greeting"
          className="text-[14px] text-muted-foreground font-normal leading-tight"
        >
          {greeting}, {firstName}
        </p>
        <h1
          data-testid="home-headline"
          className="text-[36px] font-normal leading-[1.1] text-foreground tracking-tight mt-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {headlineSentence}
        </h1>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => {
            useSpotlightStore.getState().startTour(getHomeTourSteps(hasRooms));
          }}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer"
        >
          <Compass className="size-4 stroke-[1.5] text-amber-500" />
          <span>Take a tour of Home</span>
        </button>

        <div
          data-testid="home-date-chip"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] border border-black/[0.08] dark:border-white/[0.08] text-[13px] font-medium text-muted-foreground tabular-nums select-none"
        >
          <Calendar className="size-4 stroke-[1.5]" />
          <span>{today}</span>
        </div>
      </div>
    </header>
  );
}
