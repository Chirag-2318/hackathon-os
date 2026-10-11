import * as React from 'react';
import { useHome } from './hooks/use-home';
import { SmartHeader } from './components/SmartHeader';
import { HackathonClock } from './components/HackathonClock';
import { Deadlines } from './components/Deadlines';
import { YourTasks } from './components/YourTasks';
import { TeamWorkload } from './components/TeamWorkload';
import { OtherRooms } from './components/OtherRooms';
import { FirstTimeState } from './components/FirstTimeState';
import { setServerNow } from '@/utils/time';

function HomeSkeleton() {
  return (
    <div className="w-full min-h-screen bg-[var(--shell)] animate-pulse">
      <div className="max-w-[1180px] mx-auto px-4 md:px-[32px] py-[32px] flex flex-col gap-[24px]">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="w-32 h-4 bg-gray-200 rounded mb-4" />
            <div className="w-96 h-10 bg-gray-200 rounded mb-4" />
            <div className="w-48 h-6 bg-gray-200 rounded" />
          </div>
          <div className="w-32 h-8 bg-gray-200 rounded-full" />
        </div>
        
        {/* Row 1 Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[24px]">
          <div className="lg:col-span-8 h-[380px] bg-white rounded-[28px] shadow-sm" />
          <div className="lg:col-span-4 h-[380px] bg-[var(--color-home-tray)] rounded-[32px] shadow-sm" />
        </div>

        {/* Row 2 Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[24px]">
          <div className="lg:col-span-6 h-[400px] bg-[var(--color-home-tray)] rounded-[32px] shadow-sm" />
          <div className="lg:col-span-6 h-[400px] bg-white rounded-[28px] shadow-sm" />
        </div>
      </div>
    </div>
  );
}

export interface HomeContextValue {
  homeData?: any;
}
export const HomeContext = React.createContext<HomeContextValue>({});

export function HomePage() {
  const { data: homeData, isLoading, error, refetch } = useHome();
  const [isFirstTime, setIsFirstTime] = React.useState(false); // Toggle this to test

  React.useEffect(() => {
    if (homeData?.serverNow) {
      setServerNow(homeData.serverNow);
    }
  }, [homeData?.serverNow]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-3">Failed to load home data.</p>
          <button
            onClick={() => refetch()}
            className="h-9 px-4 rounded-[12px] bg-[var(--color-home-text-primary)] text-white text-sm font-medium hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Use the actual loading state from the hook
  if (isLoading) {
    return <HomeSkeleton />;
  }

  const hasRooms = Boolean(homeData?.rooms && homeData.rooms.length > 0);

  if (isFirstTime || !hasRooms) {
    return (
      <div className="w-full min-h-screen bg-[var(--shell)] flex flex-col pt-16">
        <FirstTimeState />
      </div>
    );
  }

  return (
    <HomeContext.Provider value={{ homeData }}>
      <div className="w-full min-h-screen bg-[var(--shell)]">
        {/* Responsive container: px-4 on mobile, px-8 on tablet+ */}
        <div className="max-w-[1180px] mx-auto px-4 md:px-[32px] py-[32px] flex flex-col gap-[24px]">
        {/* Row 0 */}
        <SmartHeader />
        
        {/* Row 1: Left 8 cols, Right 4 cols (on lg screens) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[24px]">
          <div className="lg:col-span-8 flex flex-col min-w-0">
            <HackathonClock />
          </div>
          <div className="lg:col-span-4 flex flex-col min-w-0">
            <Deadlines />
          </div>
        </div>

        {/* Container for Row 2 and Row 3 to allow absolute positioning */}
        <div className="relative">
          {/* Row 2: Left 6 cols, Right 6 cols */}
          <div 
            className="grid grid-cols-1 lg:grid-cols-12 gap-[24px]"
            style={{ transform: 'scale(0.80)', transformOrigin: 'top left', marginTop: '-80px', marginBottom: '-110px' }}
          >
            <div className="lg:col-span-6 flex flex-col min-w-0">
              <YourTasks />
            </div>
            <div className="lg:col-span-6 flex flex-col min-w-0" style={{ width: '85%' }}>
              <TeamWorkload />
            </div>
          </div>

          {/* Row 3: Absolute positioned to the right of Row 2 */}
          <div 
            className="absolute right-0"
            style={{ top: '-80px', width: '28%', transform: 'scale(0.85)', transformOrigin: 'top right' }}
          >
            <OtherRooms />
          </div>
        </div>
      </div>
    </div>
    </HomeContext.Provider>
  );
}

