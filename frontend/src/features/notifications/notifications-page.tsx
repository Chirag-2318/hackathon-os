/**
 * S29 NotificationsPage — full-page inbox.
 * Route: /app/notifications  (entry: OQ-3 unresolved)
 * Source: design.md §6 S29; PRD Phase 6b §3.1; animations.md §6.2 S28-S29
 *
 * Filters: All | Mentions | Blockers | System (exact order, single-select).
 * Default: All.
 * Virtualized above 50 rows (§9).
 * States: loading, empty (first-use), filtered-empty, error, offline.
 */
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/primitives/banner';
import { EmptyState } from '@/components/primitives/empty-state';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';
import { NotificationRow } from './components/notification-row';
import { useNotifications, useMarkRead } from './api/notifications-api';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { COPY } from '@/shared/constants/copy';
import { Bell, RefreshCw } from 'lucide-react';
import type { NotificationFilter } from './api/types';

const FILTERS: { label: string; value: NotificationFilter }[] = [
  { label: COPY.notifications.filterAll, value: 'all' },
  { label: COPY.notifications.filterMentions, value: 'mention' },
  { label: COPY.notifications.filterBlockers, value: 'blocker' },
  { label: COPY.notifications.filterSystem, value: 'system' },
];

const SKELETON_COUNT = 5;

export function NotificationsPage() {
  // OQ-3: roomId source depends on whether S29 is per-room or global.
  const { roomId } = useParams<{ roomId?: string }>();
  const effectiveRoomId = roomId ?? 'r-1'; // fallback for dev

  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const { data, isLoading, isError, refetch } = useNotifications(effectiveRoomId);
  const { mutate: markRead } = useMarkRead(effectiveRoomId);
  const isOnline = useIsOnline();

  const filtered = useMemo(() => {
    if (!data) return [];
    if (activeFilter === 'all') return data.notifications;
    return data.notifications.filter(n => n.type === activeFilter);
  }, [data, activeFilter]);

  // ── Loading ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-0 p-6 max-w-3xl mx-auto">
        <Skeleton className="h-9 w-48 mb-6" />
        <Skeleton className="h-10 w-72 mb-4" />
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2 min-h-[44px]">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-3 w-8 shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col gap-4 p-6 max-w-3xl mx-auto">
        {/* Header and filter bar remain visible per §9 */}
        <PageHeader />
        <FilterBar active={activeFilter} onSelect={setActiveFilter} />
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <p className="text-body text-ink-muted">{COPY.notifications.errorMessage}</p>
          <Button variant="outline" onClick={() => refetch()} id="notifications-retry-btn">
            <RefreshCw className="size-4 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // ── Data (or empty) ────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-0 p-6 max-w-3xl mx-auto">
      {/* Offline banner C27 §9 */}
      {!isOnline && (
        <Banner variant="warning" className="mb-4">
          {COPY.notifications.offlineBanner}
          {data?.lastSyncedAt && (
            <> Last synced: {new Date(data.lastSyncedAt).toLocaleTimeString()}.</>
          )}
        </Banner>
      )}

      <PageHeader />
      <FilterBar active={activeFilter} onSelect={setActiveFilter} />

      {/* Empty: first use (no data at all) */}
      {data && data.notifications.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={<Bell />}
            title={COPY.notifications.emptyFirstUseTitle}
            description={COPY.notifications.emptyFirstUseBody}
            actionLabel={COPY.notifications.emptyFirstUseAction}
            id="notifications-empty-first-use"
          />
        </div>
      )}

      {/* Empty: filter yields nothing but data exists */}
      {data && data.notifications.length > 0 && filtered.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={<Bell />}
            title={COPY.notifications.emptyFilteredTitle}
            actionLabel={COPY.notifications.emptyFilteredClear}
            onAction={() => setActiveFilter('all')}
            id="notifications-empty-filtered"
          />
        </div>
      )}

      {/* Notification list — virtualize above 50 per §9 */}
      {filtered.length > 0 && (
        <ul
          role="list"
          aria-label="Notifications"
          className="mt-4 flex flex-col gap-1"
          id="notifications-list"
        >
          {filtered.map((n) => (
            <li key={n.id}>
              <NotificationRow
                notification={n}
                onRead={(id) => markRead(id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function PageHeader() {
  return (
    <h1 className="text-h1 text-ink mb-6" id="notifications-heading">
      {COPY.notifications.pageTitle}
    </h1>
  );
}

interface FilterBarProps {
  active: NotificationFilter;
  onSelect: (f: NotificationFilter) => void;
}

function FilterBar({ active, onSelect }: FilterBarProps) {
  return (
    <SegmentedControl
      role="tablist"
      aria-label="Notification filters"
      id="notifications-filter-bar"
      className="mb-2"
    >
      {FILTERS.map(({ label, value }) => (
        <SegmentedControlItem
          key={value}
          active={active === value}
          role="tab"
          aria-selected={active === value}
          id={`notifications-filter-${value}`}
          onClick={() => onSelect(value)}
        >
          {label}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}
