import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, KeyRound, Search, ArrowUpDown, X } from 'lucide-react';
import { roomService } from '@/services/roomService';
import { useOverlay } from '@/app/providers/overlay-store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { RoomCard } from './components/room-card';
import { InviteCodeDialog } from './components/InviteCodeDialog';
import { cn } from '@/lib/utils';
import type { RoomListItem } from '@/services/types';

type FilterType = 'all' | 'leading' | 'member' | 'active' | 'finished';
type SortType = 'recent' | 'time_left' | 'name';

const FILTER_STORAGE_KEY = 'hackathon_os_rooms_filter';
const SORT_STORAGE_KEY = 'hackathon_os_rooms_sort';

function isRoomFinished(room: RoomListItem): boolean {
  if (room.phase === 'Submitted' || room.submittedAt) return true;
  const now = Date.now();
  const endMs = room.endsAt ? new Date(room.endsAt).getTime() : room.eventEnd ? new Date(room.eventEnd).getTime() : null;
  return Boolean(endMs && endMs < now);
}

function EmptyIllustration() {
  return (
    <div className="relative size-32 mb-6 flex items-center justify-center select-none" aria-hidden="true">
      {/* Background soft glow circle */}
      <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-400/10 blur-xl" />
      {/* Layered CSS & SVG geometric shapes */}
      <svg viewBox="0 0 120 120" className="size-full">
        {/* Soft floating polygon */}
        <polygon
          points="20,70 60,95 100,70 60,45"
          className="fill-blue-500/15 stroke-blue-500/30 dark:stroke-blue-400/40"
          strokeWidth="1.5"
        />
        {/* Upper cube / room box */}
        <path
          d="M60,25 L92,42 L92,68 L60,85 L28,68 L28,42 Z"
          className="fill-card stroke-border"
          strokeWidth="2"
        />
        <path
          d="M60,25 L60,85 M60,55 L92,42 M60,55 L28,42"
          className="stroke-border"
          strokeWidth="1.5"
        />
        {/* Accent spark / flag */}
        <circle cx="60" cy="55" r="4.5" className="fill-blue-600 animate-pulse" />
        <circle cx="36" cy="30" r="3" className="fill-amber-500" />
        <circle cx="84" cy="78" r="2.5" className="fill-purple-500" />
        <path
          d="M86,28 L90,32 M88,26 L88,34 M84,30 L92,30"
          className="stroke-amber-500/70"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function MyRoomsPage() {
  const createRoomModal = useOverlay('create-room-dialog');
  const joinCodeModal = useOverlay('join-code-dialog');
  const [inviteRoomId, setInviteRoomId] = React.useState<string | null>(null);

  // Filter & Sort State persisted in localStorage
  const [filter, setFilter] = React.useState<FilterType>(() => {
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY);
      if (saved && ['all', 'leading', 'member', 'active', 'finished'].includes(saved)) {
        return saved as FilterType;
      }
    } catch (_) {}
    return 'all';
  });

  const [sort, setSort] = React.useState<SortType>(() => {
    try {
      const saved = localStorage.getItem(SORT_STORAGE_KEY);
      if (saved && ['recent', 'time_left', 'name'].includes(saved)) {
        return saved as SortType;
      }
    } catch (_) {}
    return 'recent';
  });

  const [search, setSearch] = React.useState('');

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, f);
    } catch (_) {}
  };

  const handleSortChange = (s: SortType) => {
    setSort(s);
    try {
      localStorage.setItem(SORT_STORAGE_KEY, s);
    } catch (_) {}
  };

  const { data: rawRooms = [], isLoading } = useQuery<RoomListItem[]>({
    queryKey: ['rooms'],
    queryFn: () => roomService.listRooms(),
  });

  // Calculate real filter counts
  const counts = React.useMemo(() => {
    let leading = 0;
    let member = 0;
    let active = 0;
    let finished = 0;

    for (const r of rawRooms) {
      const isLead = Boolean(r.isLeader || (r.myRole || '').toUpperCase() === 'LEADER');
      const isFin = isRoomFinished(r);

      if (isLead) leading++;
      else member++;

      if (isFin) finished++;
      else active++;
    }

    return { all: rawRooms.length, leading, member, active, finished };
  }, [rawRooms]);

  // Filter & Search & Sort
  const filteredRooms = React.useMemo(() => {
    let list = rawRooms.slice();

    // 1. Filter
    if (filter === 'leading') {
      list = list.filter((r) => Boolean(r.isLeader || (r.myRole || '').toUpperCase() === 'LEADER'));
    } else if (filter === 'member') {
      list = list.filter((r) => !Boolean(r.isLeader || (r.myRole || '').toUpperCase() === 'LEADER'));
    } else if (filter === 'active') {
      list = list.filter((r) => !isRoomFinished(r));
    } else if (filter === 'finished') {
      list = list.filter((r) => isRoomFinished(r));
    }

    // 2. Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((r) => (r.name || '').toLowerCase().includes(q));
    }

    // 3. Sort
    list.sort((a, b) => {
      if (sort === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sort === 'time_left') {
        const now = Date.now();
        const aFin = isRoomFinished(a);
        const bFin = isRoomFinished(b);
        if (aFin !== bFin) return aFin ? 1 : -1;

        const aEnd = a.endsAt ? new Date(a.endsAt).getTime() : a.eventEnd ? new Date(a.eventEnd).getTime() : Infinity;
        const bEnd = b.endsAt ? new Date(b.endsAt).getTime() : b.eventEnd ? new Date(b.eventEnd).getTime() : Infinity;
        return aEnd - bEnd;
      }
      // 'recent': newest created first
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bCreated - aCreated;
    });

    return list;
  }, [rawRooms, filter, search, sort]);

  return (
    <div className="w-full min-h-screen bg-[var(--shell)] p-4 sm:p-6 lg:p-8 font-[var(--font-inter)]">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-[var(--font-display)] text-ink tracking-tight">
              My rooms
            </h1>
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-surface border border-border text-ink-2 font-mono text-xs font-semibold tabular-nums">
              {rawRooms.length}
            </span>
          </div>

          {/* Action buttons (reusing existing flows) */}
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => joinCodeModal.open()}
              className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-[var(--r-control,10px)] gap-2 bg-card border-border hover:bg-hover text-ink text-xs sm:text-sm font-medium cursor-pointer"
            >
              <KeyRound className="size-4 text-ink-2" />
              <span>Join with code</span>
            </Button>
            <Button
              onClick={() => createRoomModal.open()}
              className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-[var(--r-control,10px)] gap-2 bg-ink text-white hover:bg-ink/90 text-xs sm:text-sm font-medium shadow-xs cursor-pointer"
            >
              <Plus className="size-4" />
              <span>New room</span>
            </Button>
          </div>
        </div>

        {/* ── SLIM TOOLBAR ──────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-1.5 rounded-[var(--r-control,12px)] bg-card border border-border/80">
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-0.5">
            {[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'leading', label: 'Leading', count: counts.leading },
              { id: 'member', label: 'Member', count: counts.member },
              { id: 'active', label: 'Active', count: counts.active },
              { id: 'finished', label: 'Finished', count: counts.finished },
            ].map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFilterChange(tab.id as FilterType)}
                  className={cn(
                    'px-3 py-1.5 rounded-[var(--r-control,8px)] text-xs font-medium cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5',
                    active
                      ? 'bg-ink text-white font-semibold shadow-2xs'
                      : 'text-ink-2 hover:text-ink hover:bg-hover'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'text-[11px] font-mono tabular-nums leading-none',
                      active ? 'text-white/80' : 'text-ink-3'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + Sort */}
          <div className="flex items-center gap-2 px-1">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-7 rounded-[var(--r-control,8px)] bg-surface border border-border/60 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:border-border-strong"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <Select value={sort} onValueChange={(val) => handleSortChange(val as SortType)}>
              <SelectTrigger className="h-8 w-[145px] text-xs bg-surface border border-border/60 rounded-[var(--r-control,8px)] cursor-pointer">
                <ArrowUpDown className="size-3 mr-1 text-ink-3 shrink-0" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent align="end" className="z-50 bg-popover">
                <SelectItem value="recent" className="text-xs">Recently active</SelectItem>
                <SelectItem value="time_left" className="text-xs">Time left</SelectItem>
                <SelectItem value="name" className="text-xs">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── ROOMS CONTENT ─────────────────────────────────────────────── */}
        {isLoading ? (
          /* Skeleton Loading Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[310px] rounded-[var(--r-card,16px)] bg-card border border-border overflow-hidden animate-pulse flex flex-col"
              >
                <div className="h-[88px] bg-secondary/70 w-full" />
                <div className="p-4 sm:p-[18px] flex flex-col gap-3 flex-1">
                  <div className="h-6 w-3/4 bg-secondary/80 rounded" />
                  <div className="h-4 w-1/2 bg-secondary/60 rounded" />
                  <div className="h-2 w-full bg-secondary/50 rounded-full mt-2" />
                  <div className="h-4 w-1/3 bg-secondary/60 rounded mt-1" />
                  <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between">
                    <div className="h-6 w-20 bg-secondary/70 rounded-full" />
                    <div className="h-4 w-16 bg-secondary/60 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : rawRooms.length === 0 ? (
          /* Empty State when user has 0 rooms */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-card rounded-[var(--r-card,16px)] border border-border">
            <EmptyIllustration />
            <h2 className="text-2xl font-[var(--font-display)] font-bold text-ink mb-2">
              No rooms yet
            </h2>
            <p className="text-xs sm:text-sm text-ink-2 max-w-md mb-6 leading-relaxed">
              Create an event room for your hackathon sprint or join an existing team space using an invite code.
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => createRoomModal.open()}
                className="h-10 px-4 rounded-[var(--r-control,10px)] bg-ink text-white gap-2 text-sm font-medium hover:bg-ink/90 cursor-pointer"
              >
                <Plus className="size-4" /> Create a room
              </Button>
              <Button
                variant="outline"
                onClick={() => joinCodeModal.open()}
                className="h-10 px-4 rounded-[var(--r-control,10px)] gap-2 text-sm font-medium border-border hover:bg-hover cursor-pointer"
              >
                <KeyRound className="size-4 text-ink-2" /> Join with code
              </Button>
            </div>
          </div>
        ) : filteredRooms.length === 0 ? (
          /* Filtered empty state */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-card rounded-[var(--r-card,16px)] border border-border">
            <p className="text-sm font-medium text-ink mb-1">No rooms matching your search</p>
            <p className="text-xs text-ink-2 mb-4">Try clearing your filters or search keywords.</p>
            <Button
              variant="outline"
              onClick={() => {
                setFilter('all');
                setSearch('');
              }}
              className="text-xs h-8 cursor-pointer"
            >
              Reset filters
            </Button>
          </div>
        ) : (
          /* Responsive Grid (1 col mobile, 2 tablet, 3 desktop, consistent 20px gap) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onInvite={(r) => setInviteRoomId(r.id)}
              />
            ))}

            {/* Last grid cell: Dashed "Start a new room" tile */}
            <button
              type="button"
              onClick={() => createRoomModal.open()}
              className={cn(
                'group flex flex-col items-center justify-center min-h-[300px] p-6 rounded-[var(--r-card,16px)]',
                'border-2 border-dashed border-border/80 hover:border-ink/50 bg-card/30 hover:bg-card',
                'transition-all duration-200 cursor-pointer text-center text-ink-2 hover:text-ink',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <div className="size-11 rounded-full bg-secondary group-hover:bg-ink group-hover:text-white flex items-center justify-center transition-all mb-3 text-ink-2 group-hover:scale-105">
                <Plus className="size-5" />
              </div>
              <span className="font-[var(--font-display)] text-xl text-ink font-bold">
                Start a new room
              </span>
              <span className="text-xs text-ink-3 mt-1.5 max-w-[220px] leading-relaxed">
                Create a sprint workspace, add your team, and track milestones.
              </span>
            </button>
          </div>
        )}

        {/* Invite Code Dialog handler */}
        {inviteRoomId && (
          <InviteCodeDialog
            roomId={inviteRoomId}
            open={Boolean(inviteRoomId)}
            onOpenChange={(open) => !open && setInviteRoomId(null)}
          />
        )}
      </div>
    </div>
  );
}
