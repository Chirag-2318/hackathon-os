/**
 * PlaybookSection — S01 item 6.
 * Source: PRD §3.1 item 6, §3.1 States.
 *
 * Fetches playbook list via TanStack Query.
 * Loading: C29 skeletons matching card layout.
 * Empty: C28 EmptyState with action.
 * Error: inline error with retry (rest of page unaffected).
 */
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/primitives/empty-state';
import { Button } from '@/components/ui/button';
import { AlertCircle, BookOpen } from 'lucide-react';
import { usePlaybooks } from '../hooks/use-playbooks';
import { PlaybookCard } from './playbook-card';
import { COPY } from '@/shared/constants/copy';

function PlaybookSkeleton() {
  return (
    <div className="flex flex-col rounded-card border border-border/50 bg-surface p-5 gap-3">
      <div className="flex justify-end">
        <Skeleton className="h-6 w-20 rounded-chip" />
      </div>
      <Skeleton className="h-6 w-3/4 rounded-control" />
      <Skeleton className="h-5 w-1/2 rounded-control" />
      <div className="mt-auto flex gap-4">
        <Skeleton className="h-4 w-12 rounded-control" />
        <Skeleton className="h-4 w-16 rounded-control" />
      </div>
    </div>
  );
}

export function PlaybookSection() {
  const { data, isLoading, isError, refetch } = usePlaybooks();

  return (
    <section className="py-16 md:py-24" aria-label="Playbooks">
      <h2 className="text-h1 text-ink-strong mb-8 md:mb-12">
        {COPY.landing.playbookTitle}
      </h2>

      {/* Loading state */}
      {isLoading && (
        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          data-testid="playbook-skeletons"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <PlaybookSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state — inline, does not replace page */}
      {isError && !isLoading && (
        <div
          className="flex flex-col items-center gap-4 rounded-card border border-danger-stroke/30 bg-surface p-8 text-center"
          role="alert"
          data-testid="playbook-error"
        >
          <AlertCircle className="size-8 text-danger-text" strokeWidth={1.5} />
          <p className="text-body text-danger-text">
            {COPY.landing.playbookErrorMessage}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && data && data.length === 0 && (
        <div data-testid="playbook-empty">
          <EmptyState
            icon={<BookOpen strokeWidth={1.5} />}
            title="No playbooks yet"
            description={COPY.landing.playbookEmptyDescription}
            actionLabel={COPY.landing.playbookEmptyAction}
          />
        </div>
      )}

      {/* Loaded cards */}
      {!isLoading && !isError && data && data.length > 0 && (
        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          data-testid="playbook-cards"
        >
          {data.map((pb) => (
            <PlaybookCard
              key={pb.id}
              id={pb.id}
              slug={pb.slug}
              title={pb.title}
              eventType={pb.eventType}
              teamSize={pb.teamSize}
              phases={pb.phases}
            />
          ))}
        </div>
      )}
    </section>
  );
}
