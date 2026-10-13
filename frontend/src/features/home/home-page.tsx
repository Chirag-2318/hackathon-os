import * as React from 'react';
import { useHome } from './hooks/use-home';
import { HomeHeader } from './components/home-header';
import { HomeActionRow } from './components/home-action-row';
import { FirstTimeWelcome } from './components/first-time-welcome';
import { PassportSection } from './components/passport-section';
import { ToolsSection } from './components/tools-section';
import { PlaybookTipSection } from './components/playbook-tip-section';
import { setServerNow } from '@/utils/time';
import { RefreshCw } from 'lucide-react';

const LazyLiveHackathonsSection = React.lazy(() =>
  import('./components/live-hackathons-section').then((m) => ({
    default: m.LiveHackathonsSection,
  }))
);

function HomeSkeleton() {
  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-[1120px] mx-auto px-4 md:px-6 py-6 flex flex-col gap-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pb-2">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-black/[0.05] dark:bg-white/[0.08] rounded" />
            <div className="h-9 w-64 bg-black/[0.05] dark:bg-white/[0.08] rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-36 bg-black/[0.05] dark:bg-white/[0.08] rounded" />
            <div className="h-8 w-28 bg-black/[0.05] dark:bg-white/[0.08] rounded" />
          </div>
        </div>

        {/* Action row skeleton */}
        <div className="h-[52px] border-y border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
          <div className="h-7 w-48 bg-black/[0.04] dark:bg-white/[0.06] rounded" />
          <div className="h-8 w-40 bg-black/[0.04] dark:bg-white/[0.06] rounded" />
        </div>

        {/* Main row skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 h-[280px] rounded-[14px] bg-[#0F0F11]/15 border border-black/[0.08]" />
          <div className="md:col-span-4 h-[280px] bg-black/[0.03] dark:bg-white/[0.05] rounded" />
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const { data: homeData, isLoading, error, refetch } = useHome();

  React.useEffect(() => {
    if (homeData?.serverNow) {
      setServerNow(homeData.serverNow);
    }
  }, [homeData?.serverNow]);

  if (isLoading) {
    return <HomeSkeleton />;
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center flex flex-col items-center gap-3">
          <p className="text-[14px] text-muted-foreground">
            Failed to load home data.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            <RefreshCw className="size-3.5 stroke-[1.5]" />
            <span>Try again</span>
          </button>
        </div>
      </div>
    );
  }

  const hasRooms = Boolean(homeData?.rooms && homeData.rooms.length > 0);
  const firstName = homeData?.user?.firstName || 'Builder';
  const roomCount = homeData?.counts?.rooms ?? (homeData?.rooms?.length || 0);
  const liveRoomCount = homeData?.counts?.liveRooms ?? 0;

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-[1120px] mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
        {/* 1. Header or First-Time Welcome */}
        {hasRooms ? (
          <>
            <HomeHeader
              firstName={firstName}
              roomCount={roomCount}
              liveRoomCount={liveRoomCount}
              hasRooms={true}
            />
            {/* 2. Action row */}
            <HomeActionRow resume={homeData?.resume} />
          </>
        ) : (
          <div className="border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
            <FirstTimeWelcome />
          </div>
        )}

        {/* 3. Main Row (cols 1-8 Live hackathons, cols 9-12 Passport) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 min-w-0">
            <React.Suspense
              fallback={
                <div className="h-[260px] rounded-[14px] bg-[#0F0F11]/10 animate-pulse" />
              }
            >
              <LazyLiveHackathonsSection />
            </React.Suspense>
          </div>

          {hasRooms && (
            <div className="md:col-span-4 min-w-0">
              <PassportSection
                passport={homeData?.passport}
                userSummary={homeData?.userSummary}
              />
            </div>
          )}
        </div>

        {/* 4. Lower Row (cols 1-8 Tools, cols 9-12 Playbook tip) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          <div className={hasRooms ? "md:col-span-8 min-w-0" : "md:col-span-7 min-w-0"}>
            <ToolsSection />
          </div>
          <div className={hasRooms ? "md:col-span-4 min-w-0" : "md:col-span-5 min-w-0"}>
            <PlaybookTipSection />
          </div>
        </div>
      </div>
    </div>
  );
}
export default HomePage;
