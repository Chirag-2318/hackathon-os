import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Calendar, RefreshCw, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '@/api/client';
import { useOverlay } from '@/app/providers/overlay-store';
import { toast } from 'sonner';

export interface HackathonItem {
  id: string;
  title: string;
  organizer: string;
  url: string;
  source?: string;
  mode: string;
  startsAt: string;
  endsAt: string;
  registrationDeadline?: string | null;
  prizeText?: string | null;
  themes?: string[];
  location?: string | null;
  teamMin?: number | null;
  teamMax?: number | null;
  verifiedAt?: string | null;
  active: boolean;
  serverNow?: string;
  msToEnd?: number;
  msToRegistrationClose?: number;
  elapsedPercent?: number;
}

interface LiveHackathonsResponse {
  items: HackathonItem[];
  serverNow: string;
}

function downloadIcs(title: string, endsAt: string, url: string) {
  const d = new Date(endsAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  const formatDate = (date: Date) =>
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

  const endFormatted = formatDate(d);
  const startFormatted = formatDate(new Date(d.getTime() - 3600_000));
  const nowFormatted = formatDate(new Date());

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HackathonOS//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@hackathonos.dev`,
    `DTSTAMP:${nowFormatted}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:${title.replace(/[,;]/g, ' ')} Deadline`,
    `DESCRIPTION:${url || ''}`,
    `URL:${url || ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-deadline.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

function formatTimeRemaining(msToEnd: number): { text: string; isTicking: boolean } {
  if (msToEnd <= 0) {
    return { text: 'Ended', isTicking: false };
  }
  const oneDayMs = 24 * 3600 * 1000;
  if (msToEnd > oneDayMs) {
    const days = Math.floor(msToEnd / oneDayMs);
    const hours = Math.floor((msToEnd % oneDayMs) / (3600 * 1000));
    return { text: `${days}d ${hours}h`, isTicking: false };
  }
  // Inside last 24 hours: HH:MM:SS
  const hh = String(Math.floor(msToEnd / 3600_000)).padStart(2, '0');
  const mm = String(Math.floor((msToEnd % 3600_000) / 60_000)).padStart(2, '0');
  const ss = String(Math.floor((msToEnd % 60_000) / 1000)).padStart(2, '0');
  return { text: `${hh}:${mm}:${ss}`, isTicking: true };
}

export function LiveHackathonsSection() {
  const createRoomModal = useOverlay('create-room-dialog');

  const { data, isLoading, isError, refetch } = useQuery<LiveHackathonsResponse>({
    queryKey: ['live-hackathons'],
    queryFn: () => apiFetch('/api/v1/hackathons/live?limit=6'),
    staleTime: 600_000,
  });

  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const [suggestOpen, setSuggestOpen] = React.useState(false);
  const [suggestUrl, setSuggestUrl] = React.useState('');
  const [suggestNote, setSuggestNote] = React.useState('');
  const [submittingSuggest, setSubmittingSuggest] = React.useState(false);

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestUrl.startsWith('https://')) {
      toast.error('URL must begin with https://');
      return;
    }
    setSubmittingSuggest(true);
    try {
      await apiFetch('/api/v1/hackathons/suggestions', {
        method: 'POST',
        body: JSON.stringify({ url: suggestUrl, note: suggestNote || undefined }),
      });
      toast.success("Thanks, we'll check it.");
      setSuggestUrl('');
      setSuggestNote('');
      setSuggestOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Unable to submit suggestion');
    } finally {
      setSubmittingSuggest(false);
    }
  };

  const items = data?.items || [];
  const featured = items[0] || null;
  const listRows = items.slice(1, 4);

  const checkedDateText = React.useMemo(() => {
    if (!items.length) return null;
    let newest = items[0].verifiedAt;
    for (const it of items) {
      if (it.verifiedAt && (!newest || it.verifiedAt > newest)) {
        newest = it.verifiedAt;
      }
    }
    if (!newest) return null;
    try {
      return `Checked ${format(new Date(newest), 'MMM d')}`;
    } catch {
      return null;
    }
  }, [items]);

  const openPrefilled = (event: HackathonItem) => {
    createRoomModal.open({
      prefill: {
        name: event.title.slice(0, 60),
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        teamSize: event.teamMax || undefined,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 bg-black/[0.06] dark:bg-white/[0.08] rounded" />
          <div className="h-4 w-24 bg-black/[0.04] dark:bg-white/[0.06] rounded" />
        </div>
        <div className="h-[220px] rounded-[14px] bg-[#0F0F11]/20 border border-black/[0.08]" />
        <div className="space-y-2">
          <div className="h-11 border-b border-black/[0.06]" />
          <div className="h-11 border-b border-black/[0.06]" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-3 py-6 px-4 rounded-[14px] border border-black/[0.08] dark:border-white/[0.08] text-center">
        <p className="text-[14px] text-muted-foreground">
          Could not load live hackathons right now.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 self-center h-8 px-3 rounded-[8px] text-[13px] font-medium border border-black/[0.08] hover:bg-black/[0.04] cursor-pointer"
        >
          <RefreshCw className="size-3.5 stroke-[1.5]" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (!featured) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <h2
              className="text-[20px] font-normal leading-tight text-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Live hackathons
            </h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-[14px] border border-black/[0.08] dark:border-white/[0.08] text-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-muted-foreground/60 mb-3"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[14px] text-muted-foreground">
            No live hackathons right now. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  // Featured calculations
  const nowMs = Date.now();
  const endMs = new Date(featured.endsAt).getTime();
  const startMs = new Date(featured.startsAt).getTime();
  const msRemaining = Math.max(0, endMs - nowMs);
  const totalDuration = Math.max(1, endMs - startMs);
  const elapsedPercent = Math.min(100, Math.max(0, ((nowMs - startMs) / totalDuration) * 100));
  const countdown = formatTimeRemaining(msRemaining);

  const metaParts: string[] = [];
  if (featured.mode) metaParts.push(featured.mode);
  if (featured.prizeText) metaParts.push(featured.prizeText);
  if (featured.teamMin && featured.teamMax) {
    metaParts.push(`Teams of ${featured.teamMin}-${featured.teamMax}`);
  } else if (featured.teamMax) {
    metaParts.push(`Teams of up to ${featured.teamMax}`);
  }
  if (featured.themes && featured.themes.length > 0) {
    metaParts.push(featured.themes.slice(0, 3).join(' · '));
  }
  const metaLine = metaParts.join(' · ');

  return (
    <section className="flex flex-col gap-3">
      {/* Title + Checked provenance */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <h2
            className="text-[20px] font-normal leading-tight text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Live hackathons
          </h2>
        </div>
        {checkedDateText && (
          <span className="text-[13px] text-muted-foreground font-normal">
            {checkedDateText}
          </span>
        )}
      </div>

      {/* Featured Card */}
      <div
        className="featured-hackathon-card w-full rounded-[14px] p-6 text-[#F4F1EA] dark:text-[#ECE9E2] flex flex-col justify-between gap-5 relative overflow-hidden bg-[#0F0F11] dark:bg-[var(--raised-surface)] border border-white/[0.06] dark:border-[rgba(236,233,226,0.10)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          {/* Main content */}
          <div className="flex flex-col gap-1 min-w-0 max-w-[580px]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-wider font-semibold text-[#E8A33D] uppercase">
                LIVE
              </span>
              <span className="text-[12px] text-[#F4F1EA]/65">
                {featured.organizer}
              </span>
            </div>

            <h3
              className="text-[30px] font-normal leading-[1.15] text-[#F4F1EA] line-clamp-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {featured.title}
            </h3>

            {metaLine && (
              <p className="text-[13px] text-[#F4F1EA]/65 truncate mt-1">
                {metaLine}
              </p>
            )}
          </div>

          {/* Countdown timer */}
          <div className="flex flex-col md:items-end shrink-0 self-start md:self-auto">
            <span
              className="text-[30px] font-normal leading-none tabular-nums text-[#E8A33D]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {countdown.text}
            </span>
            <span className="text-[12px] text-[#F4F1EA]/55 mt-1">
              left
            </span>
          </div>
        </div>

        {/* 2px hairline progress line */}
        <div className="w-full h-[2px] bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#E8A33D] rounded-full transition-all duration-300"
            style={{ width: `${elapsedPercent}%` }}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => openPrefilled(featured)}
            className="h-8 px-3.5 rounded-[8px] bg-[#F4F1EA] text-[#0F0F11] text-[13px] font-medium hover:bg-[#F4F1EA]/90 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            Plan it in a room
          </button>

          <a
            href={featured.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[13px] font-medium text-[#F4F1EA] border border-white/10 hover:bg-white/[0.06] transition-colors duration-150"
          >
            <span>Event page</span>
            <ExternalLink className="size-3.5 stroke-[1.5]" />
          </a>

          <button
            type="button"
            onClick={() => downloadIcs(featured.title, featured.endsAt, featured.url)}
            title="Add deadline to calendar (.ics)"
            className="inline-flex items-center justify-center size-8 rounded-[8px] text-[#F4F1EA]/80 hover:text-[#F4F1EA] border border-white/10 hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer"
          >
            <Calendar className="size-3.5 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Up to 3 list rows */}
      {listRows.length > 0 && (
        <div className="flex flex-col">
          {listRows.map((row) => {
            const rowEndMs = new Date(row.endsAt).getTime();
            const rowMsRemaining = Math.max(0, rowEndMs - nowMs);
            const rowCountdown = formatTimeRemaining(rowMsRemaining);

            return (
              <div
                key={row.id}
                className="group relative flex items-center justify-between h-11 px-1 border-b border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-150"
              >
                <a
                  href={row.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-baseline gap-2 min-w-0 pr-4 flex-1 text-left"
                >
                  <span className="text-[14px] font-medium text-foreground truncate group-hover:text-foreground">
                    {row.title}
                  </span>
                  <span className="text-[13px] text-muted-foreground truncate hidden sm:inline">
                    · {row.organizer}
                  </span>
                </a>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPrefilled(row);
                    }}
                    className="text-[13px] font-medium text-foreground underline-offset-4 hover:underline opacity-100 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity cursor-pointer"
                  >
                    Plan it
                  </button>

                  <span
                    className="text-[13px] text-muted-foreground tabular-nums"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {rowCountdown.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer line with suggestion popover */}
      <div className="relative pt-1 text-[12px] text-muted-foreground">
        <span>Know one we're missing? </span>
        <button
          type="button"
          onClick={() => setSuggestOpen(!suggestOpen)}
          className="text-foreground underline underline-offset-4 hover:opacity-80 transition-opacity cursor-pointer font-medium"
        >
          Suggest it
        </button>

        {suggestOpen && (
          <div className="absolute top-7 left-0 z-20 w-80 p-3.5 rounded-[10px] bg-background border border-black/[0.08] dark:border-white/[0.08] shadow-lg flex flex-col gap-2.5">
            <form onSubmit={handleSuggest} className="flex flex-col gap-2">
              <span className="text-[12px] font-medium text-foreground">Suggest a live hackathon</span>
              <input
                type="url"
                required
                value={suggestUrl}
                onChange={(e) => setSuggestUrl(e.target.value)}
                placeholder="https://event-url.com"
                className="h-8 px-2.5 rounded-[6px] border border-black/[0.08] dark:border-white/[0.08] bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-foreground"
              />
              <input
                type="text"
                value={suggestNote}
                onChange={(e) => setSuggestNote(e.target.value)}
                placeholder="Optional note (dates, prize...)"
                maxLength={200}
                className="h-8 px-2.5 rounded-[6px] border border-black/[0.08] dark:border-white/[0.08] bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-foreground"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSuggestOpen(false)}
                  className="h-7 px-2 text-[12px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSuggest}
                  className="inline-flex items-center gap-1 h-7 px-3 rounded-[6px] bg-foreground text-background text-[12px] font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {submittingSuggest ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                  <span>Submit</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
