/**
 * S24 RetroPage — main page component.
 * Route: /app/room/:roomId/retro
 * PRD 5b §3.2. [D S24; A M13].
 *
 * Sections (in order from PRD):
 * 1. Wrapped card (M13 signature moment, first open only)
 * 2. Milestone timeline + Time per phase chart
 * 3. Retro prompts (Worked / Didn't / Change)
 * 4. Continue or archive decision + 2-week plan card
 * 5. Portfolio entry preview
 *
 * States: loading (M13 never starts while resolving), error, data, offline.
 */
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRetro, useSaveRetro } from './hooks/use-retro';
import { useWrappedSeen } from './hooks/use-wrapped-seen';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { WrappedCard } from './components/wrapped-card';
import { MilestoneTimeline } from './components/milestone-timeline';
import { TimePerPhaseChart } from './components/time-per-phase-chart';
import { RetroPromptCards } from './components/retro-prompt-cards';
import { ContinueArchiveChoice } from './components/continue-archive-choice';
import { PortfolioEntryPreview } from './components/portfolio-entry-preview';
import { Banner } from '@/components/primitives/banner';
import { EmptyState } from '@/components/primitives/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, LayoutList } from 'lucide-react';
import { saveRetro } from './api/retro-api';
import type { RetroAnswers } from './api/types';

/** Per-session flag: timeline dots animate once after M13 ends [A §2.5] */
const sessionTimelineAnimated = new Set<string>();

export function RetroPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = roomId ?? 'unknown';

  const { data, isLoading, isError, refetch } = useRetro(id);
  const { seen, markSeen } = useWrappedSeen(id);
  const saveMutation = useSaveRetro(id);
  const isOnline = useIsOnline();

  const sessionKey = `retro-timeline-${id}`;
  const [timelineAnimated, setTimelineAnimated] = useState(
    () => sessionTimelineAnimated.has(sessionKey),
  );

  const handleSequenceEnd = () => {
    sessionTimelineAnimated.add(sessionKey);
    setTimelineAnimated(false); // Let timeline dots animate once after M13
  };

  const handleSaveRetro = async (answers: RetroAnswers) => {
    await saveMutation.mutateAsync({
      worked: answers.worked,
      didnt: answers.didnt,
      change: answers.change,
    });
  };

  const handleDecide = async (choice: 'continue' | 'archive') => {
    await saveRetro(id, { decision: choice });
  };

  // AC-13-5: While seen state is undefined → show skeleton, M13 does not start
  if (isLoading || seen === undefined) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <RetroLoadingSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4 p-6 items-center justify-center min-h-[50vh] text-center">
        <p className="text-body text-ink-muted">Could not load retro data.</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="size-4 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  const isPhaseDataAvailable = data.phaseTime && data.phaseTime.length > 0;

  return (
    <div className="flex flex-col gap-8 p-6 pb-12">
      {/* Offline banner [D §9] */}
      {!isOnline && (
        <Banner variant="warning">
          Offline — showing cached data. Retro inputs and decision cards are disabled while offline.
        </Banner>
      )}

      {/* Page heading */}
      <div>
        <h1 className="text-h1 text-ink">Retro and Portfolio</h1>
        <p className="text-body text-ink-muted mt-1">
          Turn the event into a record: what happened, what the team learned, what happens next.
        </p>
      </div>

      {/* 1. Wrapped card — M13 signature moment */}
      <section aria-label="Hackathon Wrapped">
        {data.wrapped.hours > 0 ? (
          <WrappedCard
            wrapped={data.wrapped}
            seen={seen}
            onMarkSeen={markSeen}
            onSequenceEnd={handleSequenceEnd}
          />
        ) : (
          <EmptyState
            icon={<span aria-hidden="true" className="text-2xl">🎯</span>}
            title="Wrapped not ready"
            description="Your Hackathon Wrapped will appear here once the event ends."
            dashed
          />
        )}
      </section>

      {/* 2. Timeline + Chart (two columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section aria-label="Milestone timeline">
          <div className="bg-surface-raised rounded-card shadow-e1 p-5">
            <h2 className="text-h3 text-ink mb-4">Timeline</h2>
            <MilestoneTimeline
              milestones={data.milestones}
              animationDone={timelineAnimated}
            />
          </div>
        </section>

        <section aria-label="Time per phase chart">
          <div className="bg-surface-raised rounded-card shadow-e1 p-5">
            {isPhaseDataAvailable ? (
              <TimePerPhaseChart
                data={data.phaseTime}
                onDrawComplete={() => {
                  sessionTimelineAnimated.add(sessionKey);
                  setTimelineAnimated(true);
                }}
              />
            ) : (
              <EmptyState
                icon={<LayoutList />}
                title="No phase data"
                description="Phase time will appear here after the event."
                dashed
              />
            )}
          </div>
        </section>
      </div>

      {/* 3. Retro prompts */}
      <section aria-label="Retro prompts">
        <h2 className="text-h3 text-ink mb-4">Retro prompts</h2>
        <RetroPromptCards
          defaultValues={data.retro}
          onSave={handleSaveRetro}
          disabled={!isOnline}
        />
      </section>

      {/* 4. Continue or archive */}
      <section aria-label="Continue or archive">
        <h2 className="text-h3 text-ink mb-4">Continue or archive</h2>
        <ContinueArchiveChoice
          currentDecision={data.decision}
          plan={data.twoWeekPlan}
          onDecide={handleDecide}
          disabled={!isOnline}
        />
      </section>

      {/* 5. Portfolio entry preview */}
      <section aria-label="Portfolio entry preview">
        <PortfolioEntryPreview portfolio={data.portfolio} />
      </section>
    </div>
  );
}

function RetroLoadingSkeleton() {
  return (
    <>
      {/* Wrapped card skeleton */}
      <div className="rounded-card p-6" style={{ backgroundColor: '#231F1B' }}>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-7 w-48" style={{ backgroundColor: 'rgba(251,236,190,0.15)' }} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <Skeleton className="h-10 w-16" style={{ backgroundColor: 'rgba(251,236,190,0.15)' }} />
                <Skeleton className="h-4 w-20" style={{ backgroundColor: 'rgba(251,236,190,0.10)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-raised rounded-card shadow-e1 p-5 flex flex-col gap-3">
          <Skeleton className="h-5 w-24 mb-2" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
        <div className="bg-surface-raised rounded-card shadow-e1 p-5">
          <Skeleton className="h-5 w-32 mb-3" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-card" />
          ))}
        </div>
      </div>
    </>
  );
}
