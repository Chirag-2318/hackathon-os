import { useState, useMemo, createElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchX, Wrench } from 'lucide-react';
import { fetchTools } from '@/features/prep/api/tools-api';
import { ToolCard } from './components/tool-card';
import {
  PageContainer,
  PageHeading,
  FilterSearch,
  FilterSelect,
  ClearFiltersButton,
  EmptyState,
  ErrorRow,
} from '@/shared/ui';
import { TOOL_CATEGORIES, getToolCategoryMeta } from './tool-categories';
import type { ToolCategory, ToolCost, ToolLicense, Tool } from '@/features/prep/api/types';

export function ToolDirectoryView() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCost, setSelectedCost] = useState<string>('all');
  const [selectedLicense, setSelectedLicense] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  // Fetch all tools from API (filtering is done on client to support live dynamic counts)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['tools-all'],
    queryFn: () => fetchTools(),
  });

  const allTools = useMemo(() => data?.tools ?? [], [data]);

  // Tools that match non-category filters (used to compute category counts dynamically)
  const nonCategoryFilteredTools = useMemo(() => {
    return allTools.filter((t: Tool) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesDesc = t.oneLineUse.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      if (selectedCost !== 'all' && t.cost !== selectedCost) return false;
      if (selectedLicense !== 'all' && t.license !== selectedLicense) return false;
      if (verifiedOnly && !t.verified) return false;
      return true;
    });
  }, [allTools, search, selectedCost, selectedLicense, verifiedOnly]);

  // Fully filtered tools (including category)
  const filteredTools = useMemo(() => {
    if (selectedCategory === 'all') return nonCategoryFilteredTools;
    return nonCategoryFilteredTools.filter((t: Tool) => t.category === selectedCategory);
  }, [nonCategoryFilteredTools, selectedCategory]);

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedCost !== 'all' ||
    selectedLicense !== 'all' ||
    verifiedOnly;

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedCost('all');
    setSelectedLicense('all');
    setVerifiedOnly(false);
  };

  const costOptions = [
    { value: 'all', label: 'All costs' },
    { value: 'Free', label: 'Free' },
    { value: 'Freemium', label: 'Freemium' },
    { value: 'Paid', label: 'Paid' },
  ];

  const licenseOptions = [
    { value: 'all', label: 'All licenses' },
    { value: 'Open source', label: 'Open source' },
    { value: 'Proprietary', label: 'Proprietary' },
  ];

  const categoryMeta =
    selectedCategory !== 'all'
      ? getToolCategoryMeta(selectedCategory as ToolCategory)
      : null;

  return (
    <div data-testid="tools-page" className="w-full">
      <PageContainer>
        {/* Page Heading */}
        <PageHeading
          title="Tool directory"
          subtitle="Vetted tools for hackathon teams. Zero affiliate links, zero sponsored slots. Updated weekly."
          titleTestId="tools-title"
          subtitleTestId="tools-subtitle"
        />

        {/* Category Chips Strip */}
        <div
          data-testid="tools-categories"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-3"
        >
          {/* "All" chip */}
          <button
            type="button"
            role="button"
            aria-pressed={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            className={`h-7 px-3 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 shrink-0 inline-flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-active text-ink border-transparent font-semibold'
                : 'bg-card text-ink-2 hover:text-ink hover:bg-hover border border-border'
            }`}
          >
            <span>All</span>
            <span className="text-[11px] opacity-70 tabular-nums">
              {nonCategoryFilteredTools.length}
            </span>
          </button>

          {/* Individual Category Chips */}
          {TOOL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = nonCategoryFilteredTools.filter((t: Tool) => t.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                role="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                className={`h-7 px-3 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 shrink-0 inline-flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-active text-ink border-transparent font-semibold'
                    : 'bg-card text-ink-2 hover:text-ink hover:bg-hover border border-border'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[11px] opacity-70 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar */}
        <div
          data-testid="tools-toolbar"
          className="flex flex-wrap items-center gap-2 mb-4"
        >
          <FilterSearch
            value={search}
            onChange={setSearch}
            placeholder="Search tools by name, use case or tech…"
            aria-label="Search tools"
            data-testid="tools-search"
            className="w-full sm:w-[280px]"
          />

          <FilterSelect
            value={selectedCost}
            onValueChange={setSelectedCost}
            options={costOptions}
            data-testid="tools-filter-cost"
          />

          <FilterSelect
            value={selectedLicense}
            onValueChange={setSelectedLicense}
            options={licenseOptions}
            data-testid="tools-filter-license"
          />

          <button
            type="button"
            data-testid="tools-filter-verified"
            aria-pressed={verifiedOnly}
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`h-8 px-3 rounded-[var(--r-control)] text-[13px] transition-colors cursor-pointer inline-flex items-center ${
              verifiedOnly
                ? 'bg-active text-ink font-semibold border border-transparent'
                : 'bg-card text-ink-2 hover:text-ink hover:bg-hover border border-border'
            }`}
          >
            Verified only
          </button>

          <ClearFiltersButton
            active={hasActiveFilters}
            onClick={clearAllFilters}
            data-testid="tools-clear"
          />

          {/* Result Count */}
          {!isLoading && !isError && (
            <div
              className="ml-auto text-[13px] text-ink-2 tabular-nums"
              data-testid="tools-count"
            >
              {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
            </div>
          )}
        </div>

        {/* Category Callout (when category != 'all') */}
        {categoryMeta && (
          <div
            data-testid="tools-cat-callout"
            className={`rounded-[var(--r-card)] border border-border px-4 py-2.5 mb-4 flex items-center gap-3 ${categoryMeta.bgClass}`}
          >
            {createElement(categoryMeta.icon, {
              className: `size-5 shrink-0 ${categoryMeta.fgClass}`,
              strokeWidth: 1.75,
            })}
            <div className="min-w-0 flex items-center gap-2 flex-wrap text-xs">
              <span className={`font-semibold ${categoryMeta.fgClass}`}>
                {selectedCategory}
              </span>
              <span className="text-ink-2">·</span>
              <span className="text-ink-2">{categoryMeta.phaseHint}</span>
            </div>
          </div>
        )}

        {/* Content States */}
        {isLoading && (
          <div
            data-testid="tools-grid"
            className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4"
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="min-h-36 rounded-[var(--r-card)] bg-active border border-border animate-pulse p-4"
              />
            ))}
          </div>
        )}

        {isError && (
          <ErrorRow
            message="Could not load tools. Please try again."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && allTools.length === 0 && (
          <EmptyState
            icon={Wrench}
            title="No tools in directory"
            description="Tools will appear here once the directory is populated."
          />
        )}

        {!isLoading &&
          !isError &&
          allTools.length > 0 &&
          filteredTools.length === 0 && (
            <EmptyState
              icon={SearchX}
              title="No tools match your filters"
              description="Try relaxing your search terms or clearing one of the filters."
              action={{
                label: 'Clear filters',
                onClick: clearAllFilters,
                'data-testid': 'tools-empty-clear',
              }}
            />
          )}

        {!isLoading && !isError && filteredTools.length > 0 && (
          <div
            data-testid="tools-grid"
            className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4"
          >
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {/* Footnote */}
        <div className="mt-8 pt-4 border-t border-border text-xs leading-4 text-ink-2 flex items-center justify-between flex-wrap gap-2">
          <p>
            Missing a tool your team relies on? Suggest it on GitHub.
          </p>
          <p className="tabular-nums">
            Zero affiliate links · Zero sponsored slots
          </p>
        </div>
      </PageContainer>
    </div>
  );
}
