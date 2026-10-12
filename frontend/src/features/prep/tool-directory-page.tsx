/**
 * S27 ToolDirectoryPage — In-app variant of Tool Directory and Playbooks
 * PRD 6a §3, S27
 * Route: /app/tools
 *
 * Tab 1: Tool directory — sidebar filters (Category / Cost / License) + card grid
 * Tab 2: Playbooks (in-app variant — "Use in room" label)
 *
 * AC-27: Exactly 3 filter groups. Unverified chip = "Not verified". Links
 *        open in new tab with rel="noopener noreferrer". No date computation.
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTools, CURATED_TOOLS } from './api/tools-api';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/primitives/banner';
import { EmptyState } from '@/components/primitives/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, RefreshCw, X, SlidersHorizontal } from 'lucide-react';
import { cn } from 'cn';
import type { ToolCategory, ToolCost, ToolLicense, Tool } from './api/types';
import { usePlaybooks } from '@/features/playbooks/hooks/use-playbooks';
import { PlaybookCard } from '@/features/landing/components/playbook-card';

// ── Filter data ───────────────────────────────────────────────────

const CATEGORIES: ToolCategory[] = ['Recording', 'Video', 'Diagrams', 'Design', 'API', 'Deployment'];
const COSTS: ToolCost[]           = ['Free', 'Freemium', 'Paid'];
const LICENSES: ToolLicense[]     = ['Open source', 'Proprietary'];

// ── Tag styling ───────────────────────────────────────────────────

function costStyle(cost: ToolCost): { bg: string; label: string } {
  if (cost === 'Free')     return { bg: 'bg-[#A5EFBE] text-[#1e4031]', label: 'Free' };
  if (cost === 'Freemium') return { bg: 'bg-[#FBECBE] text-[#5a4400]', label: 'Freemium' };
  return                          { bg: 'bg-[#FBD9D7] text-[#6b1f1a]', label: 'Paid' };
}

// ── Filter pill button ────────────────────────────────────────────

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-between w-full px-3 py-1.5 rounded-control text-body transition-colors text-left group',
        active
          ? 'bg-lav-600 text-white font-semibold'
          : 'text-ink hover:bg-surface-sunken font-normal'
      )}
      aria-pressed={active}
    >
      <span>{label}</span>
      {active && <X className="size-3 opacity-70 group-hover:opacity-100" />}
    </button>
  );
}

// ── Filter sidebar ────────────────────────────────────────────────

interface FilterSidebarProps {
  filterCategory: ToolCategory | '';
  filterCost: ToolCost | '';
  filterLicense: ToolLicense | '';
  setFilterCategory: (v: ToolCategory | '') => void;
  setFilterCost: (v: ToolCost | '') => void;
  setFilterLicense: (v: ToolLicense | '') => void;
  hasFilters: boolean;
  clearFilters: () => void;
  toolCount: number | undefined;
}

function FilterSidebar({
  filterCategory, filterCost, filterLicense,
  setFilterCategory, setFilterCost, setFilterLicense,
  hasFilters, clearFilters, toolCount,
}: FilterSidebarProps) {
  return (
    <aside className="w-[188px] shrink-0 flex flex-col gap-5 self-start sticky top-4">
      {/* Results count + clear */}
      <div className="flex items-center justify-between">
        <span className="text-caption text-ink-muted">
          {toolCount !== undefined ? `${toolCount} tool${toolCount === 1 ? '' : 's'}` : ''}
        </span>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-caption text-lav-600 hover:text-lav-700 font-semibold transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <span className="text-label uppercase tracking-wider text-ink-muted font-semibold px-3 mb-0.5">
          Category
        </span>
        {CATEGORIES.map(cat => (
          <FilterPill
            key={cat}
            label={cat}
            active={filterCategory === cat}
            onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
          />
        ))}
      </div>

      {/* Cost */}
      <div className="flex flex-col gap-1">
        <span className="text-label uppercase tracking-wider text-ink-muted font-semibold px-3 mb-0.5">
          Cost
        </span>
        {COSTS.map(c => (
          <FilterPill
            key={c}
            label={c}
            active={filterCost === c}
            onClick={() => setFilterCost(filterCost === c ? '' : c)}
          />
        ))}
      </div>

      {/* License */}
      <div className="flex flex-col gap-1">
        <span className="text-label uppercase tracking-wider text-ink-muted font-semibold px-3 mb-0.5">
          License
        </span>
        {LICENSES.map(l => (
          <FilterPill
            key={l}
            label={l}
            active={filterLicense === l}
            onClick={() => setFilterLicense(filterLicense === l ? '' : l)}
          />
        ))}
      </div>
    </aside>
  );
}

// ── Tool card ─────────────────────────────────────────────────────

interface ToolCardProps {
  tool: Tool;
  offline: boolean;
}

/** Category → background color for the letter-avatar */
const CATEGORY_COLOR: Record<ToolCategory, string> = {
  Recording:  'bg-[#D4E4FE] text-[#1a3d7c]',
  Video:      'bg-[#FFE4E4] text-[#7c1a1a]',
  Diagrams:   'bg-[#E4F5E4] text-[#1a4d1a]',
  Design:     'bg-[#F5E4FF] text-[#4d1a7c]',
  API:        'bg-[#FFF4E4] text-[#7c4a1a]',
  Deployment: 'bg-[#E4FFFD] text-[#1a6b66]',
};

function ToolCard({ tool, offline }: ToolCardProps) {
  const formattedDate = useMemo(() => {
    try {
      return new Date(tool.lastChecked).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch {
      return tool.lastChecked;
    }
  }, [tool.lastChecked]);

  const cost = costStyle(tool.cost);
  const avatarColor = CATEGORY_COLOR[tool.category] ?? 'bg-surface-sunken text-ink-muted';
  const initial = tool.name.charAt(0).toUpperCase();

  const openButton = offline ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <button
            disabled
            aria-label={`Open ${tool.name} (disabled offline)`}
            className="inline-flex items-center justify-center size-7 rounded-control opacity-40 cursor-not-allowed text-ink-muted"
          >
            <ExternalLink className="size-4" strokeWidth={1.5} />
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Go online to open this link</TooltipContent>
    </Tooltip>
  ) : (
    <a
      href={tool.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${tool.name} (opens in new tab)`}
      className="inline-flex items-center justify-center size-7 rounded-control text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors"
    >
      <ExternalLink className="size-4" strokeWidth={1.5} />
    </a>
  );

  return (
    <div className="rounded-card bg-surface border border-border p-4 flex flex-col gap-0 shadow-e0 hover:border-border-strong hover:shadow-e1 transition-all group">
      {/* Top row: avatar + name + open button */}
      <div className="flex items-start gap-3 mb-2.5">
        {/* Letter avatar — category color coded */}
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-xl text-h3 font-bold select-none',
            avatarColor
          )}
          aria-hidden="true"
        >
          {initial}
        </div>

        {/* Name + category */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-body-strong text-ink leading-tight">{tool.name}</h3>
          <span className="text-caption text-ink-muted">{tool.category}</span>
        </div>

        {/* Open link — top right */}
        <div className="shrink-0">{openButton}</div>
      </div>

      {/* Description */}
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="text-body text-ink-muted line-clamp-2 leading-snug mb-3">
            {tool.oneLineUse}
          </p>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">{tool.oneLineUse}</TooltipContent>
      </Tooltip>

      {/* Tag row */}
      <div className="flex items-center gap-1.5 flex-wrap mt-auto">
        {/* Cost */}
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-chip text-label font-semibold', cost.bg)}>
          {cost.label}
        </span>
        {/* License */}
        <span className="inline-flex items-center px-2 py-0.5 rounded-chip text-label font-semibold bg-surface-sunken border border-border text-ink-muted">
          {tool.license}
        </span>
        {/* Not verified */}
        {!tool.verified && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-chip text-label font-semibold bg-[#FDE781] text-[#5a4400]">
            Not verified
          </span>
        )}
      </div>

      {/* Last checked — footer */}
      <p className="text-caption text-ink-muted mt-2.5 pt-2.5 border-t border-border/60">
        Checked {formattedDate}
      </p>
    </div>
  );
}

// ── Tool Directory tab ────────────────────────────────────────────

function ToolDirectoryTab({ offline }: { offline: boolean }) {
  const [filterCategory, setFilterCategory] = useState<ToolCategory | ''>('');
  const [filterCost, setFilterCost]         = useState<ToolCost | ''>('');
  const [filterLicense, setFilterLicense]   = useState<ToolLicense | ''>('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const hasFilters = filterCategory !== '' || filterCost !== '' || filterLicense !== '';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['tools', filterCategory, filterCost, filterLicense],
    queryFn: () => fetchTools({
      category: filterCategory || undefined,
      cost: filterCost || undefined,
      license: filterLicense || undefined,
    }),
  });

  const clearFilters = () => {
    setFilterCategory('');
    setFilterCost('');
    setFilterLicense('');
  };

  const tools = useMemo(() => {
    if (data?.tools && data.tools.length > 0) return data.tools;
    return CURATED_TOOLS.filter(t => {
      if (filterCategory && t.category.toLowerCase() !== filterCategory.toLowerCase()) return false;
      if (filterCost && t.cost.toLowerCase() !== filterCost.toLowerCase()) return false;
      if (filterLicense && t.license.toLowerCase() !== filterLicense.toLowerCase()) return false;
      return true;
    });
  }, [data, filterCategory, filterCost, filterLicense]);

  return (
    <div className="flex gap-6 items-start">
      {/* ── Desktop filter sidebar ──────────────────────────────── */}
      <div className="hidden sm:block">
        <FilterSidebar
          filterCategory={filterCategory}
          filterCost={filterCost}
          filterLicense={filterLicense}
          setFilterCategory={setFilterCategory}
          setFilterCost={setFilterCost}
          setFilterLicense={setFilterLicense}
          hasFilters={hasFilters}
          clearFilters={clearFilters}
          toolCount={tools.length}
        />
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Mobile filter toggle */}
        <div className="sm:hidden flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFiltersOpen(v => !v)}
            aria-expanded={mobileFiltersOpen}
          >
            <SlidersHorizontal className="size-4 mr-1.5" />
            Filters
            {hasFilters && (
              <span
                className="ml-1.5 size-4 rounded-full bg-lav-600 text-white text-[10px] flex items-center justify-center"
                aria-label="Active filters"
              >
                !
              </span>
            )}
          </Button>
          {hasFilters && (
            <button onClick={clearFilters} className="text-caption text-lav-600 underline">
              Clear
            </button>
          )}
        </div>

        {mobileFiltersOpen && (
          <div className="sm:hidden border border-border rounded-card p-4 bg-surface">
            <FilterSidebar
              filterCategory={filterCategory}
              filterCost={filterCost}
              filterLicense={filterLicense}
              setFilterCategory={setFilterCategory}
              setFilterCost={setFilterCost}
              setFilterLicense={setFilterLicense}
              hasFilters={hasFilters}
              clearFilters={clearFilters}
              toolCount={data?.tools.length}
            />
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[160px] w-full rounded-card" />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && tools.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-body text-ink-muted">Could not load tools.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="size-4 mr-1.5" /> Retry
            </Button>
          </div>
        )}

        {/* Empty (no data) */}
        {!isLoading && tools.length === 0 && !hasFilters && (
          <EmptyState title="No tools in the directory yet." description="" dashed />
        )}

        {/* Empty (filtered) */}
        {!isLoading && tools.length === 0 && hasFilters && (
          <EmptyState
            title="No tools match these filters."
            description=""
            actionLabel="Clear filters"
            onAction={clearFilters}
            dashed
          />
        )}

        {/* Tool grid */}
        {!isLoading && tools.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {tools.map(tool => (
              <ToolCard key={tool.id} tool={tool} offline={offline} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Playbooks tab (in-app variant) ────────────────────────────────

function PlaybooksInAppTab() {
  const { data: playbooks, isLoading, isError } = usePlaybooks();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-card" />
        ))}
      </div>
    );
  }

  if (isError || !playbooks) {
    return <p className="text-body text-ink-muted">Could not load playbooks.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-body text-ink-muted">
        Select a playbook to apply it to your current room.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {playbooks.map(pb => (
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
    </div>
  );
}

// ── ToolDirectoryPage ─────────────────────────────────────────────

export function ToolDirectoryPage() {
  const isOnline = useIsOnline();

  return (
    <div className="flex flex-col gap-5 pb-12">
      {!isOnline && (
        <Banner variant="warning">
          Offline — outbound links are disabled while offline.
        </Banner>
      )}

      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-ink">Tools & Playbooks</h1>
        <p className="text-body text-ink-muted">
          A curated directory of tools and playbooks for hackathon teams.
        </p>
      </div>

      {/* Tab switcher — line variant, visually distinct from content */}
      <Tabs defaultValue="tools" className="flex flex-col gap-5">
        {/* Tab list — bordered bottom separator */}
        <div className="border-b border-border">
          <TabsList
            variant="line"
            className="gap-0 bg-transparent rounded-none h-auto pb-0"
          >
            <TabsTrigger
              value="tools"
              id="tab-tools"
              className="rounded-none px-4 py-2 data-active:border-b-2 data-active:border-lav-600 data-active:text-ink data-active:shadow-none data-active:bg-transparent text-ink-muted font-medium hover:text-ink"
            >
              Tool directory
            </TabsTrigger>
            <TabsTrigger
              value="playbooks"
              id="tab-playbooks"
              className="rounded-none px-4 py-2 data-active:border-b-2 data-active:border-lav-600 data-active:text-ink data-active:shadow-none data-active:bg-transparent text-ink-muted font-medium hover:text-ink"
            >
              Playbooks
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tools">
          <ToolDirectoryTab offline={!isOnline} />
        </TabsContent>

        <TabsContent value="playbooks">
          <PlaybooksInAppTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
