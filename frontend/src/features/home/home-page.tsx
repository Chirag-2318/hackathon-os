import * as React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Calendar, Search, Plus, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useHome } from './hooks/use-home';
import { FeatureCard } from '@/components/primitives/feature-card';
import { ListRow } from '@/components/primitives/list-row';
import { WeekStrip } from '@/components/primitives/week-strip';
import { ProgressRow } from '@/components/primitives/progress-row';
import { Chip } from '@/components/primitives/chip';
import { IconButton } from '@/components/primitives/icon-button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { EmptyState } from '@/components/primitives/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { roomOverviewPath } from '@/shared/constants/routes';

export function HomePage() {
  const { data, isLoading, error } = useHome();
  const navigate = useNavigate();
  const { setRightRail } = useOutletContext<{ setRightRail: (node: React.ReactNode) => void }>();
  const [filter, setFilter] = React.useState('active');

  const todayStr = format(new Date(), 'EEEE, MMMM d');

  React.useLayoutEffect(() => {
    if (data) {
      const rightRailContent = (
        <>
          {/* Countdown card — tight, intentional size */}
          <div
            className="rounded-panel p-6 flex flex-col shadow-e1"
            style={{ backgroundColor: 'var(--pastel-peach)' }}
          >
            <span className="text-body-strong text-ink/60 uppercase tracking-wider mb-3">
              Until submission
            </span>
            <span className="text-[3rem] font-bold tabular-nums text-ink leading-none tracking-tight">9h 05m</span>
            
            {/* Inline progress bar */}
            <div className="mt-8">
              <ProgressRow 
                label="Overall progress"
                percent={68}
                colorClass="bg-ink"
                className="font-medium"
              />
            </div>
          </div>

          {/* This week */}
          <div className="flex flex-col gap-4 bg-surface rounded-card p-5 shadow-e0 border border-transparent">
            <h3 className="text-h3 text-ink">This week</h3>
            <WeekStrip
              days={data.weekDays.map(d => new Date(d.date))}
              eventsMap={data.weekDays.reduce((acc, d) => ({ ...acc, [d.date]: d.hasEvent }), {})}
            />
          </div>

          {/* Upcoming */}
          <div className="flex flex-col gap-4 bg-surface rounded-card p-5 shadow-e0 border border-transparent">
            <h3 className="text-h3 text-ink">Upcoming</h3>
            <div className="flex flex-col gap-2">
              {data.upcoming.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 px-3 rounded-card bg-surface-sunken border border-border/40 hover:border-border transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-border/50">
                      <Clock className="size-4 text-ink-muted" />
                    </div>
                    <span className="text-body-strong truncate text-ink">{item.label}</span>
                  </div>
                  <button className="text-caption font-bold bg-white border border-border text-ink hover:bg-black/5 px-3 py-1 rounded-pill transition-colors shadow-sm ml-2 shrink-0 group-hover:border-ink/20">
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      );
      setRightRail(rightRailContent);
    }
    return () => setRightRail(null);
  }, [data, setRightRail]);

  if (error) {
    return (
      <div className="p-5">
        <p className="text-danger">Failed to load home data. Please try again.</p>
      </div>
    );
  }

  const handleRoomClick = (roomId: string) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => { navigate(roomOverviewPath(roomId)); });
    } else {
      navigate(roomOverviewPath(roomId));
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[820px]">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-body text-ink-muted mb-0.5">Good morning</p>
          <h1 className="text-h1 leading-tight">
            {isLoading ? <Skeleton className="w-40 h-8 inline-block" /> : data?.greeting}
          </h1>
        </div>
        <Chip fill="white" className="h-7 shadow-e0 border border-border self-start sm:self-auto shrink-0">
          <Calendar className="size-3.5 mr-1" />
          <span className="text-caption">{todayStr}</span>
        </Chip>
      </header>

      {/* ── Loading ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-[180px] rounded-card" />
            <Skeleton className="h-[180px] rounded-card" />
          </div>
          <div>
            <Skeleton className="w-32 h-5 mb-3" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-[52px] rounded-card" />
              <Skeleton className="h-[52px] rounded-card" />
              <Skeleton className="h-[52px] rounded-card" />
            </div>
          </div>
        </div>
      ) : data?.rooms.length === 0 ? (
        <EmptyState
          title="No rooms yet"
          description="Create a new room or join an existing one using an invite link."
          actionLabel="Create a room"
          onAction={() => navigate('/app/create-room')}
        />
      ) : (
        <>
          {/* ── Active Room Cards ─────────────────────────────── */}
          {data && data.rooms.length > 0 && (
            <section>
              <h2 className="text-label text-ink-muted uppercase tracking-wider mb-3">Active rooms</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.rooms.map((room, i) => (
                  <FeatureCard
                    key={room.id}
                    title={room.name}
                    tagLabel={room.eventTag}
                    fillColor={i % 2 === 0 ? 'var(--pastel-lavender)' : 'var(--pastel-peach)'}
                    participants={room.participantAvatarIds.map(id => ({ id, name: id, initials: id }))}
                    progress={room.progressPercent}
                    authorName={room.leaderName}
                    authorInitials={room.leaderName.slice(0, 2).toUpperCase()}
                    metaText={`${room.tasksLeft} tasks left`}
                    onClick={() => handleRoomClick(room.id)}
                    style={{ viewTransitionName: `room-card-${room.id}` }}
                    illustration={i === 0 ? (
                      <div className="size-full bg-[url('/img/hero-illustration.svg')] bg-contain bg-no-repeat bg-bottom opacity-50" />
                    ) : undefined}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Rooms List ───────────────────────────────────── */}
          <section className="flex flex-col gap-3">
            <header className="flex items-center justify-between">
              <h2 className="text-h2">Rooms you're in</h2>
              <div className="flex items-center gap-1.5">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[110px] h-7 bg-surface border-transparent text-caption">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <IconButton tooltip="Search rooms" variant="circle" size="sm" className="bg-surface border border-transparent shadow-e0"><Search className="size-4" /></IconButton>
                <IconButton tooltip="New room" variant="circle" size="sm" className="bg-surface border border-transparent shadow-e0" onClick={() => navigate('/app/create-room')}><Plus className="size-4" /></IconButton>
              </div>
            </header>

            <div className="flex flex-col gap-1.5">
              {data?.roomList.filter(r => filter === 'all' || r.status.toLowerCase() === filter).length === 0 ? (
                <EmptyState
                  title="No rooms match these filters."
                  description="Try changing your filter settings."
                  actionLabel="Clear filters"
                  onAction={() => setFilter('active')}
                />
              ) : (
                data?.roomList
                  .filter(r => filter === 'all' || r.status.toLowerCase() === filter)
                  .map((room) => (
                    <ListRow
                      key={room.id}
                      title={room.title}
                      tileCode={room.meta.avatarId}
                      authorName={room.meta.name}
                      authorInitials={room.meta.avatarId}
                      timeAgo={room.meta.time}
                      progress={room.progressPercent}
                      tasksCount={room.metaIconCounts.tasks}
                      attachmentsCount={room.metaIconCounts.attachments}
                      commentsCount={room.metaIconCounts.comments}
                      onClick={() => handleRoomClick(room.id)}
                    />
                  ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
