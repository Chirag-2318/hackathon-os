/**
 * S25 PrepPage — Bento dashboard for pre-event preparation
 * PRD 6a §3, S25
 * Route: /app/room/:roomId/prep
 *
 * Six bento zones (named): checklist, calendar, event-day card,
 * connect-github, more-integrations.
 * Guardrail banner when preExistingCodeAllowed = false.
 */
import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPrep, toggleChecklistItem } from './api/prep-api';
import { useIsOnline } from '@/shared/hooks/use-is-online';
import { DashedContainer } from '@/components/primitives/dashed-container';
import { DarkCallout } from '@/components/primitives/dark-callout';
import { ChecklistRow } from '@/components/primitives/checklist-row';
import { Banner } from '@/components/primitives/banner';
import { EmptyState } from '@/components/primitives/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, Monitor, FlaskConical, MapPin, Users, FileText,
  Cloud, Sun, Clock, Map, GitBranch as Github, Calendar as CalendarIcon,
  MessageSquare, PenTool as FigmaIcon, RefreshCw, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrepEvent } from './api/types';

// ── Checklist item config ─────────────────────────────────────────

const CHECKLIST_ICONS: Record<string, React.ReactNode> = {
  env:       <Monitor className="size-4 text-ink" />,
  sandbox:   <FlaskConical className="size-4 text-ink" />,
  logistics: <MapPin className="size-4 text-ink" />,
  team:      <Users className="size-4 text-ink" />,
  brief:     <FileText className="size-4 text-ink" />,
};

// ── Event-day card ─────────────────────────────────────────────────

function EventDayCard({ event }: { event: PrepEvent | null }) {
  if (!event) {
    return (
      <EmptyState
        title="No event details yet"
        description="Add the event in Brief."
        dashed
      >
        <Link to="brief" className="text-body text-lav-600 underline underline-offset-2 mt-2 inline-block">
          Go to Brief →
        </Link>
      </EmptyState>
    );
  }

  const start = new Date(event.startDate);
  const end   = new Date(event.endDate);

  const dateRange = `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const WeatherIcon = event.weather.condition.toLowerCase().includes('cloud') ? Cloud : Sun;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-h2 text-ink leading-tight">{event.name}</h2>
        <p className="text-caption text-ink-muted mt-0.5">{dateRange}</p>
      </div>

      <div className="flex flex-col gap-2 text-body text-ink">
        <div className="flex gap-2">
          <MapPin className="size-4 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
          <span>{event.venue}</span>
        </div>
        <div className="flex gap-2">
          <MapPin className="size-4 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
          <span className="text-ink-muted text-caption">{event.address}</span>
        </div>
        <div className="flex gap-2">
          <WeatherIcon className="size-4 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
          <span>{event.weather.temp} °{event.weather.unit}, {event.weather.condition}</span>
        </div>
        <div className="flex gap-2">
          <Clock className="size-4 text-ink-muted shrink-0 mt-0.5" aria-hidden="true" />
          <span>{event.travelTime}</span>
        </div>
      </div>

      {/* Map thumbnail — static placeholder, no external tile requests [OQ-7] */}
      <div className="relative rounded-control bg-surface-sunken h-[120px] flex items-center justify-center overflow-hidden">
        <Map className="size-10 text-ink-muted" aria-hidden="true" />
        {/* Orange/Peach directions button [D S25] */}
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 h-8 px-3 rounded-pill inline-flex items-center gap-1.5 text-label text-ink font-semibold"
          style={{ backgroundColor: '#F9B672' }}
          aria-label="Get directions (opens in new tab)"
        >
          Directions
        </a>
      </div>
    </div>
  );
}

// ── Connect GitHub card ────────────────────────────────────────────

function ConnectGithubCard({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <div className="rounded-card bg-callout p-6 flex flex-col gap-3 h-full">
        <div className="flex items-center gap-2">
          <Github className="size-5 text-white" aria-hidden="true" />
          <h3 className="text-h3 text-white">Connect GitHub</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-chip text-label font-semibold text-ink"
            style={{ backgroundColor: '#A5EFBE' }}
          >
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Connected
          </span>
        </div>
        <Link
          to="/app/settings/integrations"
          className="text-caption text-border-strong underline underline-offset-2 hover:text-white transition-colors mt-auto"
        >
          Manage in Integrations →
        </Link>
      </div>
    );
  }

  return (
    <DarkCallout
      title="Connect GitHub"
      description="Link your account to see repo health, commits, and branch structure in one place."
      buttonLabel="Connect GitHub"
      icon={<Github />}
      className="h-full"
    />
  );
}

// ── More integrations tile ─────────────────────────────────────────

function MoreIntegrationsTile() {
  return (
    <div
      className="rounded-card border border-border-strong p-5 flex flex-col gap-3 bg-pastel-blush"
    >
      <h3 className="text-h3 text-ink">More integrations</h3>
      <ul className="flex flex-col gap-2">
        <li className="flex items-center gap-2 text-caption text-ink">
          <CalendarIcon className="size-4 shrink-0" aria-hidden="true" />
          Google Calendar <span className="text-ink-muted ml-1">(coming soon)</span>
        </li>
        <li className="flex items-center gap-2 text-caption text-ink">
          <MessageSquare className="size-4 shrink-0" aria-hidden="true" />
          Slack notifications <span className="text-ink-muted ml-1">(coming soon)</span>
        </li>
        <li className="flex items-center gap-2 text-caption text-ink">
          <FigmaIcon className="size-4 shrink-0" aria-hidden="true" />
          Figma file link <span className="text-ink-muted ml-1">(coming soon)</span>
        </li>
      </ul>
      <p className="text-caption text-ink-muted mt-1">More coming soon.</p>
    </div>
  );
}

// ── PrepPage ───────────────────────────────────────────────────────

export function PrepPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = roomId ?? 'unknown';
  const queryClient = useQueryClient();
  const isOnline = useIsOnline();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['prep', id],
    queryFn: () => fetchPrep(id),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, done }: { itemId: string; done: boolean }) =>
      toggleChecklistItem(id, itemId, done),
    onMutate: async ({ itemId, done }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['prep', id] });
      const prev = queryClient.getQueryData(['prep', id]);
      queryClient.setQueryData(['prep', id], (old: typeof data) => {
        if (!old) return old;
        return {
          ...old,
          checklist: old.checklist.map(item =>
            item.id === itemId ? { ...item, done } : item,
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['prep', id], ctx.prev);
    },
  });

  // Compute event days for calendar ringed dates [OQ-9]
  const eventDates = useMemo(() => {
    if (!data?.event) return [];
    const dates: Date[] = [];
    const start = new Date(data.event.startDate);
    const end   = new Date(data.event.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  }, [data?.event]);

  if (isLoading) return <PrepLoadingSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 p-6 text-center">
        <p className="text-body text-ink-muted">Could not load prep data.</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="size-4 mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  const showGuardrail = data.preExistingCodeAllowed === false;

  return (
    <div className="flex flex-col gap-5 p-6 pb-12">
      {/* Guardrail banner [PRD S25 §3] */}
      {showGuardrail && (
        <Banner variant="warning">
          <strong>Prep is limited to setup and learning. Do not write project code before kickoff.</strong>
        </Banner>
      )}

      {/* Offline banner */}
      {!isOnline && (
        <Banner variant="warning">
          You're offline. Showing last saved prep data.
        </Banner>
      )}

      <h1 className="text-h1 text-ink">Prep mode</h1>

      {/*
       * Bento grid — 12 columns on ≥1280, responsive collapse below
       * Named zones: checklist (5), calendar (2), event-day (5), github (3), more-integrations (2)
       */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-12">

        {/* Cell 1: Today's checklist */}
        <div className="md:col-span-7 lg:col-span-5">
          <DashedContainer>
            <div className="p-4 flex flex-col gap-2">
              <h2 className="text-h3 text-ink px-1 pt-1">Today's checklist</h2>
              {data.checklist.map(item => (
                <ChecklistRow
                  key={item.id}
                  title={item.label}
                  checked={item.done}
                  icon={CHECKLIST_ICONS[item.id]}
                  onCheckedChange={checked => {
                    if (!isOnline) return;
                    toggleMutation.mutate({ itemId: item.id, done: Boolean(checked) });
                  }}
                  className={cn(!isOnline && 'opacity-60 pointer-events-none')}
                  // Override icon tile fill to Ice (#D7EDFB)
                  style={{ '--icon-bg': '#D7EDFB' } as React.CSSProperties}
                />
              ))}
            </div>
          </DashedContainer>
        </div>

        {/* Cell 2: Calendar */}
        <div className="md:col-span-5 lg:col-span-3">
          <div className="rounded-card bg-surface border border-border p-4 h-full flex flex-col">
            <h2 className="text-h3 text-ink mb-2">Calendar</h2>
            <div className="flex-1 flex items-center justify-center">
              <Calendar
                mode="single"
                selected={undefined}
                modifiers={{ eventDay: eventDates }}
                modifiersClassNames={{
                  eventDay: 'ring-2 ring-lav-600 ring-offset-1',
                }}
                className="p-0 bg-transparent"
                style={{ background: 'transparent' }}
                disabled
              />
            </div>
          </div>
        </div>

        {/* Cell 3: Event-day card */}
        <div className="md:col-span-12 lg:col-span-4 lg:row-span-2">
          <div className="rounded-card bg-surface border border-border p-5 h-full">
            <EventDayCard event={data.event} />
          </div>
        </div>

        {/* Cell 4: Connect GitHub */}
        <div className="md:col-span-7 lg:col-span-5">
          <ConnectGithubCard connected={data.githubConnected} />
        </div>

        {/* Cell 5: More integrations */}
        <div className="md:col-span-5 lg:col-span-3">
          <MoreIntegrationsTile />
        </div>
      </div>
    </div>
  );
}

function PrepLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-6">
      <Skeleton className="h-9 w-40" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-7 lg:col-span-5 border-2 border-dashed border-border-strong rounded-card p-4 flex flex-col gap-2">
          <Skeleton className="h-5 w-36 mb-2" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-card" />
          ))}
        </div>
        <div className="md:col-span-5 lg:col-span-3 rounded-card border border-border p-4">
          <Skeleton className="h-5 w-24 mb-3" />
          <Skeleton className="h-64 w-full rounded-control" />
        </div>
        <div className="md:col-span-12 lg:col-span-4 lg:row-span-2 rounded-card border border-border p-5">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
          <Skeleton className="h-[120px] w-full rounded-control mt-4" />
        </div>
        <div className="md:col-span-7 lg:col-span-5 rounded-card h-36">
          <Skeleton className="h-full w-full rounded-card" />
        </div>
        <div className="md:col-span-5 lg:col-span-3 rounded-card h-36">
          <Skeleton className="h-full w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}
