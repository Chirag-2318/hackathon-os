import { useState, useMemo } from 'react';
import { usePlaybooks } from './hooks/use-playbooks';
import { LandingHeader } from '@/features/landing/components/landing-header';
import { LandingFooter } from '@/features/landing/components/landing-footer';
import { PlaybookCard } from '@/features/landing/components/playbook-card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/primitives/empty-state';
import { Chip } from '@/components/primitives/chip';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function PlaybookBrowsePage() {
  const { data: playbooks, isLoading, isError, refetch } = usePlaybooks();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSize, setFilterSize] = useState<string>('all');

  const filteredPlaybooks = useMemo(() => {
    if (!playbooks) return [];
    return playbooks.filter((pb) => {
      if (filterType !== 'all' && pb.eventType !== filterType) return false;
      if (filterSize !== 'all') {
        if (filterSize === 'solo' && pb.teamSize !== 1) return false;
        if (filterSize === 'team' && (pb.teamSize === null || pb.teamSize < 2)) return false;
      }
      return true;
    });
  }, [playbooks, filterType, filterSize]);

  // Derive unique event types for the dropdown
  const eventTypes = useMemo(() => {
    if (!playbooks) return [];
    const types = new Set(playbooks.map(pb => pb.eventType));
    return Array.from(types);
  }, [playbooks]);

  const hasActiveFilters = filterType !== 'all' || filterSize !== 'all';

  const clearFilters = () => {
    setFilterType('all');
    setFilterSize('all');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <LandingHeader />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-12 md:py-16">
        <div className="mb-12">
          <h1 className="text-h1 text-ink-strong mb-2">Playbook Templates</h1>
          <p className="text-body text-ink-muted">
            Battle-tested blueprints for your next hackathon.
          </p>
        </div>

        {/* Filter Bar (C37) */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {eventTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSize} onValueChange={setFilterSize}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Team Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Size</SelectItem>
              <SelectItem value="solo">Solo (1 member)</SelectItem>
              <SelectItem value="team">Team (2+ members)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-8 items-center">
            <span className="text-sm text-ink-muted mr-2">Active filters:</span>
            {filterType !== 'all' && (
              <Chip variant="soft" className="flex items-center gap-1">
                {filterType}
                <button
                  onClick={() => setFilterType('all')}
                  className="p-0.5 hover:bg-surface-hover rounded-full transition-colors"
                  aria-label={`Remove filter ${filterType}`}
                >
                  <X className="size-3" />
                </button>
              </Chip>
            )}
            {filterSize !== 'all' && (
              <Chip variant="soft" className="flex items-center gap-1">
                {filterSize === 'solo' ? 'Solo' : 'Team'}
                <button
                  onClick={() => setFilterSize('all')}
                  className="p-0.5 hover:bg-surface-hover rounded-full transition-colors"
                  aria-label={`Remove filter ${filterSize}`}
                >
                  <X className="size-3" />
                </button>
              </Chip>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-2 h-7 text-xs">
              Clear all
            </Button>
          </div>
        )}

        {/* Grid */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col rounded-card border border-border/50 bg-surface p-5 gap-3">
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
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-body text-danger-text mb-4">Failed to load playbooks.</p>
            <Button variant="outline" onClick={() => refetch()}>Try again</Button>
          </div>
        )}

        {!isLoading && !isError && filteredPlaybooks.length === 0 && (
          <div className="py-12">
            <EmptyState
              icon={<Search strokeWidth={1.5} />}
              title="No exact matches"
              description="Try clearing your filters to see more playbooks."
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          </div>
        )}

        {!isLoading && !isError && filteredPlaybooks.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredPlaybooks.map((pb) => (
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
      </main>

      <LandingFooter />
    </div>
  );
}
