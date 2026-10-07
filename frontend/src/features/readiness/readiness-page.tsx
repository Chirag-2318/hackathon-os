/**
 * S23 ReadinessPage — main page component.
 * Route: /app/room/:roomId/readiness
 * PRD 5b §3.1. [D §5, S23].
 *
 * Layout:
 * - Six readiness rings row (top, full width)
 * - Two columns: Weak spots | Judge Simulator panel
 *
 * States: loading, error, empty (first-use), data, offline.
 */
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useReadiness } from './hooks/use-readiness';
import { ReadinessRingsRow } from './components/readiness-rings-row';
import { WeakSpotList } from './components/weak-spot-list';
import { JudgeSimulatorPanel, JudgeSimulatorPanelSkeleton } from './components/judge-simulator-panel';
import { Banner } from '@/components/primitives/banner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { useIsOnline } from '@/shared/hooks/use-is-online';

/** Per-session flag: rings animation should only fire once per session [A §8] */
const sessionRingsAnimated = new Set<string>();

export function ReadinessPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = roomId ?? 'unknown';
  const sessionKey = `readiness-rings-${id}`;

  const { data, isLoading, isError, refetch } = useReadiness(id);
  const isOnline = useIsOnline();

  const [ringsAnimated, setRingsAnimated] = useState(
    () => sessionRingsAnimated.has(sessionKey),
  );

  const handleRingsAnimationDone = () => {
    sessionRingsAnimated.add(sessionKey);
    setRingsAnimated(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <ReadinessLoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <p className="text-body text-ink-muted">Could not load readiness data.</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="size-4 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 pb-12">
      {/* Offline banner [D §9] */}
      {!isOnline && (
        <Banner variant="warning">
          Offline — showing cached data. Last synced: just now.
          Simulator paste and validate steps are disabled while offline.
        </Banner>
      )}

      {/* Page heading */}
      <div>
        <h1 className="text-h1 text-ink">Readiness</h1>
        <p className="text-body text-ink-muted mt-1">
          One view of where the team stands before the judges arrive.
        </p>
      </div>

      {/* Six readiness rings, full width */}
      <section aria-label="Readiness rings">
        <ReadinessRingsRow
          rings={data.rings}
          roomId={id}
          animationDone={ringsAnimated}
          onAnimationDone={handleRingsAnimationDone}
        />
      </section>

      {/* Two-column layout: weak spots + simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weak spots */}
        <section aria-label="Weak spots">
          <div className="bg-surface-raised rounded-card shadow-e1 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-h3 text-ink">Weak spots</h2>
              <p className="text-caption text-ink-muted mt-0.5">
                Areas that need attention before judging, most severe first.
              </p>
            </div>
            <WeakSpotList spots={data.weakSpots} />
          </div>
        </section>

        {/* Judge Simulator */}
        <section aria-label="Judge Simulator">
          <JudgeSimulatorPanel
            simulator={data.simulator}
            roomId={id}
          />
        </section>
      </div>
    </div>
  );
}

function ReadinessLoadingSkeleton() {
  return (
    <>
      <div className="flex gap-4 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <Skeleton className="size-14 rounded-full" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-raised rounded-card shadow-e1 p-4 flex flex-col gap-2">
          <Skeleton className="h-5 w-24 mb-2" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <JudgeSimulatorPanelSkeleton />
      </div>
    </>
  );
}
