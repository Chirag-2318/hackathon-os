import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX, LayoutTemplate } from 'lucide-react';
import { usePlaybooks } from './hooks/use-playbooks';
import { PlaybookCard } from './components/playbook-card';
import {
  PageContainer,
  PageHeading,
  FilterSearch,
  FilterSelect,
  ClearFiltersButton,
  EmptyState,
  ErrorRow,
} from '@/shared/ui';

export function PlaybooksView() {
  const { data: playbooks, isLoading, isError, refetch } = usePlaybooks();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSize, setFilterSize] = useState('all');

  // Derive unique event types for the filter select
  const typeOptions = useMemo(() => {
    const list = [{ value: 'all', label: 'All types' }];
    if (!playbooks) return list;
    const types = Array.from(new Set(playbooks.map((pb) => pb.eventType))).filter(Boolean);
    for (const t of types) {
      list.push({ value: t, label: t });
    }
    return list;
  }, [playbooks]);

  const sizeOptions = [
    { value: 'all', label: 'Any size' },
    { value: 'solo', label: 'Solo (1 member)' },
    { value: 'team', label: 'Team (2+ members)' },
  ];

  const hasActiveFilters =
    search.trim() !== '' || filterType !== 'all' || filterSize !== 'all';

  const clearFilters = () => {
    setSearch('');
    setFilterType('all');
    setFilterSize('all');
  };

  const filteredPlaybooks = useMemo(() => {
    if (!playbooks) return [];
    return playbooks.filter((pb) => {
      // Search by name
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!pb.title.toLowerCase().includes(q)) return false;
      }
      // Filter by type
      if (filterType !== 'all' && pb.eventType !== filterType) {
        return false;
      }
      // Filter by size
      if (filterSize !== 'all') {
        if (filterSize === 'solo' && pb.teamSize !== 1) return false;
        if (filterSize === 'team' && (pb.teamSize === null || pb.teamSize < 2)) {
          return false;
        }
      }
      return true;
    });
  }, [playbooks, search, filterType, filterSize]);

  const handleOpenPlaybook = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('playbook', id);
    setSearchParams(next);
  };

  return (
    <div data-testid="pb-page" className="w-full">
      <PageContainer>
        {/* Page Heading */}
        <PageHeading
          title="Playbooks"
          subtitle="Ready-made hackathon flows. Pick one and your room starts with its phases, checkpoints and deliverables."
          titleTestId="pb-title"
          subtitleTestId="pb-subtitle"
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Search playbooks"
            aria-label="Search playbooks"
            data-testid="pb-search"
            className="w-full sm:w-[280px]"
          />

          <FilterSelect
            value={filterType}
            onValueChange={setFilterType}
            options={typeOptions}
            data-testid="pb-filter-type"
          />

          <FilterSelect
            value={filterSize}
            onValueChange={setFilterSize}
            options={sizeOptions}
            data-testid="pb-filter-size"
          />

          <ClearFiltersButton
            active={hasActiveFilters}
            onClick={clearFilters}
            data-testid="pb-clear"
          />

          {/* Result count */}
          {!isLoading && !isError && playbooks && (
            <div
              className="ml-auto text-[13px] text-ink-2 tabular-nums"
              data-testid="pb-count"
            >
              {filteredPlaybooks.length}{' '}
              {filteredPlaybooks.length === 1 ? 'playbook' : 'playbooks'}
            </div>
          )}
        </div>

        {/* Content States */}
        {isLoading && (
          <div
            data-testid="pb-grid"
            className="grid grid-cols-[repeat(auto-fill,minmax(264px,1fr))] gap-4"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="min-h-32 rounded-[var(--r-card)] bg-active border border-border animate-pulse p-4"
              />
            ))}
          </div>
        )}

        {isError && (
          <ErrorRow
            message="Could not load playbooks. Please try again."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && playbooks && playbooks.length === 0 && (
          <EmptyState
            icon={LayoutTemplate}
            title="No playbooks yet"
            description="Playbooks will show up here once they are published."
          />
        )}

        {!isLoading &&
          !isError &&
          playbooks &&
          playbooks.length > 0 &&
          filteredPlaybooks.length === 0 && (
            <EmptyState
              icon={SearchX}
              title="No playbooks match"
              description="Try a different search or clear the filters."
              data-testid="pb-empty"
              action={{
                label: 'Clear filters',
                onClick: clearFilters,
                'data-testid': 'pb-empty-clear',
              }}
            />
          )}

        {!isLoading &&
          !isError &&
          filteredPlaybooks.length > 0 && (
            <div
              data-testid="pb-grid"
              className="grid grid-cols-[repeat(auto-fill,minmax(264px,1fr))] gap-4"
            >
              {filteredPlaybooks.map((pb) => (
                <PlaybookCard
                  key={pb.id}
                  playbook={pb}
                  onClick={() => handleOpenPlaybook(pb.id)}
                />
              ))}
            </div>
          )}
      </PageContainer>
    </div>
  );
}
