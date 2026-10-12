import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BackArrowIcon } from '@/components/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { InvitePopover } from '@/features/room/invite-popover';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRoomCover } from '@/shared/utils/room-cover';

export interface RoomIdentityProps {
  roomId: string;
  roomTitle: string;
  stage?: string;
  isCollapsed: boolean;
  rooms: Array<{ id: string; title: string }>;
  clockData?: {
    hourOfEvent?: number;
    totalHours?: number;
    hoursLeft?: number;
    minutesLeft?: number;
    status?: string;
  };
  currentSubPath: string;
}

export function RoomIdentity({
  roomId,
  roomTitle,
  stage = 'brief',
  isCollapsed,
  rooms,
  clockData,
  currentSubPath,
}: RoomIdentityProps) {
  const navigate = useNavigate();
  const [switcherOpen, setSwitcherOpen] = React.useState(false);

  const cover = React.useMemo(() => getRoomCover(roomId), [roomId]);

  const initials = React.useMemo(() => {
    return (roomTitle || 'Room')
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0] || '')
      .join('')
      .toUpperCase();
  }, [roomTitle]);

  // Phase mapping for semantic dot & chip
  const phaseInfo = React.useMemo(() => {
    const s = stage.toLowerCase();
    if (['brief', 'ideate', 'plan', 'crowd', 'before'].includes(s)) {
      return { label: 'Planning', dotColor: 'bg-amber-500' };
    }
    if (['build', 'freeze'].includes(s)) {
      return { label: 'Building', dotColor: 'bg-blue-500' };
    }
    if (['polish', 'deck', 'pitch', 'rehearse'].includes(s)) {
      return { label: 'Polishing', dotColor: 'bg-purple-500' };
    }
    if (['submit', 'submitted', 'review', 'after'].includes(s)) {
      return { label: 'Submitted', dotColor: 'bg-emerald-500' };
    }
    return { label: 'Planning', dotColor: 'bg-amber-500' };
  }, [stage]);

  // Clock elapsed percentage calculation
  const hourOfEvent = clockData?.hourOfEvent ?? 0;
  const totalHours = clockData?.totalHours ?? 36;
  const elapsedPct = totalHours > 0
    ? Math.min(100, Math.max(0, Math.round((hourOfEvent / totalHours) * 100)))
    : 0;

  // SVG circular ring geometry (24px box, r=9, circumference ~56.55)
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (elapsedPct / 100) * circumference;

  const handleRoomSwitch = (targetRoomId: string) => {
    setSwitcherOpen(false);
    if (targetRoomId === roomId) return;
    navigate(`/app/room/${targetRoomId}/${currentSubPath}`);
  };

  const progressRing = (
    <div
      className="relative size-6 shrink-0 flex items-center justify-center cursor-help"
      title={`Hour ${hourOfEvent} of ${totalHours}`}
      aria-label={`Hackathon progress: Hour ${hourOfEvent} of ${totalHours}`}
    >
      <svg className="size-6 -rotate-90" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r={radius}
          stroke="var(--border)"
          strokeWidth="2.5"
          fill="none"
          className="opacity-40"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          stroke="var(--ink)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="sr-only">
        {elapsedPct}% elapsed (Hour {hourOfEvent} of {totalHours})
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5 mb-2 pb-2.5 border-b border-border/70 shrink-0 select-none">
      {/* 1. All rooms back link */}
      {!isCollapsed ? (
        <Link
          to="/app/rooms"
          className="group flex items-center gap-1.5 text-xs font-medium text-ink-2 hover:text-ink transition-colors w-fit px-1 py-0.5 rounded cursor-pointer"
        >
          <BackArrowIcon size={14} className="text-ink-3 group-hover:text-ink" />
          <span>All rooms</span>
        </Link>
      ) : (
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Link
              to="/app/rooms"
              className="group flex items-center justify-center size-8 rounded-md hover:bg-hover text-ink-2 hover:text-ink transition-colors mx-auto"
            >
              <BackArrowIcon size={16} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">All rooms</TooltipContent>
        </Tooltip>
      )}

      {/* 2. Room Switcher Row */}
      {!isCollapsed ? (
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left p-1 rounded-[var(--r-control)] hover:bg-hover transition-colors cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-ink"
                aria-label="Switch room"
              >
                {/* 32px room tile with deterministic generative gradient */}
                <div
                  className="size-8 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 text-ink shadow-2xs border border-black/5"
                  style={{ background: cover.gradient }}
                >
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[14px] font-semibold text-ink leading-tight truncate">
                      {roomTitle}
                    </span>
                    <ChevronDown className="size-3.5 text-ink-3 shrink-0 group-hover:text-ink transition-colors" />
                  </div>
                  {/* Phase chip with semantic dot */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn('size-1.5 rounded-full shrink-0', phaseInfo.dotColor)} />
                    <span className="text-[11px] font-medium text-ink-2 leading-none truncate capitalize">
                      {phaseInfo.label}
                    </span>
                  </div>
                </div>
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              sideOffset={6}
              className="w-[260px] p-2 rounded-[18px] bg-card border border-border shadow-xl font-[var(--font-inter)] z-50"
            >
              <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3 border-b border-border/50">
                Your rooms
              </div>
              <div className="flex flex-col gap-0.5 mt-1 max-h-48 overflow-y-auto">
                {rooms.map((r) => {
                  const isCurrent = r.id === roomId;
                  const itemCover = getRoomCover(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleRoomSwitch(r.id)}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer',
                        isCurrent
                          ? 'bg-active font-semibold text-ink'
                          : 'hover:bg-hover text-ink-2 hover:text-ink'
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="size-6 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 border border-black/5"
                          style={{ background: itemCover.gradient }}
                        >
                          {r.title?.slice(0, 2).toUpperCase() || 'RM'}
                        </div>
                        <span className="truncate">{r.title}</span>
                      </div>
                      {isCurrent && <Check className="size-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Right side: 24px Progress Ring + Invite Icon */}
          <div className="flex items-center gap-1 shrink-0">
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                {progressRing}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-mono font-medium">
                Hour {hourOfEvent} of {totalHours}
              </TooltipContent>
            </Tooltip>
            <InvitePopover roomId={roomId} />
          </div>
        </div>
      ) : (
        /* Collapsed mode: tile with ring & invite */
        <div className="flex flex-col items-center gap-2 py-1">
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <div
                className="relative size-8 rounded-xl text-xs font-bold flex items-center justify-center text-ink cursor-pointer border border-black/5"
                style={{ background: cover.gradient }}
              >
                {initials}
                <div className="absolute -inset-1 pointer-events-none">
                  {progressRing}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold">{roomTitle}</p>
              <p className="text-[11px] text-muted-foreground capitalize">
                {phaseInfo.label} · Hour {hourOfEvent} of {totalHours}
              </p>
            </TooltipContent>
          </Tooltip>
          <InvitePopover roomId={roomId} />
        </div>
      )}
    </div>
  );
}
