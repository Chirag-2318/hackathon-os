import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, ArrowRight, MoreVertical, Copy, UserPlus, Clock, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getRoomCover } from '@/shared/utils/room-cover';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { RoomListItem } from '@/services/types';

export interface RoomCardProps {
  room: RoomListItem;
  onInvite?: (room: RoomListItem) => void;
  variant?: 'default' | 'compact';
  className?: string;
}

const PHASES = ['Planning', 'Build', 'Present', 'Submitted'];

function getMonogram(name: string): string {
  if (!name) return 'RO';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatRoomTime(room: RoomListItem): { text: string; isMono?: boolean } {
  if (room.phase === 'Submitted' || room.submittedAt) {
    return { text: 'Submitted' };
  }
  const now = Date.now();
  const startMs = room.startsAt ? new Date(room.startsAt).getTime() : room.eventStart ? new Date(room.eventStart).getTime() : null;
  const endMs = room.endsAt ? new Date(room.endsAt).getTime() : room.eventEnd ? new Date(room.eventEnd).getTime() : null;

  if (startMs && startMs > now) {
    const diffSec = Math.floor((startMs - now) / 1000);
    const totalHours = Math.floor(diffSec / 3600);
    if (totalHours > 48) {
      const days = Math.floor(totalHours / 24);
      const remHours = totalHours % 24;
      return { text: `Starts in ${days}d ${remHours}h` };
    }
    const mins = Math.floor((diffSec % 3600) / 60);
    return { text: `Starts in ${totalHours}h ${mins}m` };
  }

  if (endMs) {
    if (endMs < now) return { text: 'Ended' };
    const diffSec = Math.floor((endMs - now) / 1000);
    const totalHours = Math.floor(diffSec / 3600);
    if (totalHours > 48) {
      const days = Math.floor(totalHours / 24);
      const remHours = totalHours % 24;
      return { text: `${days}d ${remHours}h left`, isMono: true };
    }
    const mins = Math.floor((diffSec % 3600) / 60);
    return { text: `${totalHours}h ${mins.toString().padStart(2, '0')}m left`, isMono: true };
  }

  return { text: 'Active' };
}

export function RoomCard({ room, onInvite, variant = 'default', className }: RoomCardProps) {
  const navigate = useNavigate();
  const cover = React.useMemo(() => getRoomCover(room.id), [room.id]);
  const timeInfo = React.useMemo(() => formatRoomTime(room), [room]);
  const monogram = React.useMemo(() => getMonogram(room.name), [room.name]);

  const currentPhaseIndex = typeof room.phaseIndex === 'number'
    ? room.phaseIndex
    : PHASES.indexOf(room.phase || 'Planning') >= 0
    ? PHASES.indexOf(room.phase || 'Planning')
    : 0;

  const currentPhaseName = room.phase || PHASES[currentPhaseIndex] || 'Planning';
  const isLeader = Boolean(room.isLeader || (room.myRole || '').toUpperCase() === 'LEADER');
  const duration = room.durationHours || 36;
  const attentionCount = room.attentionCount || 0;
  const memberCount = room.memberCount ?? (room.memberPreview?.length || 1);
  const previews = room.memberPreview || [];

  const handleOpenRoom = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    navigate(`/app/room/${room.id}/overview`);
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = (room as any).joinCode || room.id.slice(0, 4).toUpperCase();
    navigator.clipboard.writeText(code);
    toast.success(`Room code ${code} copied to clipboard`);
  };

  const handleInvite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInvite) {
      onInvite(room);
    } else {
      const url = `${window.location.origin}/app/room/${room.id}/overview`;
      navigator.clipboard.writeText(url);
      toast.success('Room link copied to clipboard');
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpenRoom}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpenRoom();
        }
      }}
      className={cn(
        'group relative flex flex-col rounded-[var(--r-card,16px)] bg-card border border-border overflow-hidden select-none',
        'cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'transition-all duration-[180ms] ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-border-strong',
        className
      )}
    >
      {/* ── COVER STRIP (88px) ────────────────────────────────────────── */}
      <div
        className="relative h-[88px] w-full overflow-hidden p-3 flex items-start justify-between border-b border-border/40"
        style={{
          background: cover.meshGradient,
          backgroundSize: '200% 200%',
        }}
      >
        {/* Animated shift layer */}
        <div
          className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out group-hover:scale-105"
          style={{
            background: cover.gradient,
            opacity: 0.35,
          }}
        />

        {/* Noise grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Faint large monogram in --font-display */}
        <span
          className="absolute -right-1 -bottom-3 text-[64px] font-[var(--font-display)] font-bold text-black/[0.12] dark:text-white/[0.12] leading-none pointer-events-none select-none tracking-tight"
          aria-hidden="true"
        >
          {monogram}
        </span>

        {/* Phase chip on top-left */}
        <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xs text-xs font-semibold text-ink shadow-2xs border border-white/40">
          <span
            className={cn(
              'size-2 rounded-full shrink-0',
              currentPhaseIndex === 0 && 'bg-blue-500',
              currentPhaseIndex === 1 && 'bg-amber-500',
              currentPhaseIndex === 2 && 'bg-purple-500',
              currentPhaseIndex === 3 && 'bg-emerald-500'
            )}
          />
          <span className="leading-none text-[11px] tracking-wide">{currentPhaseName}</span>
        </div>

        {/* Top-right: Attention Badge + Kebab Menu */}
        <div className="relative z-10 flex items-center gap-1.5 ml-auto">
          {attentionCount > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#E11D48] text-white text-[11px] font-mono font-bold shadow-xs leading-none"
              title={`${attentionCount} pending attention item${attentionCount === 1 ? '' : 's'}`}
            >
              {attentionCount}
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="size-7 rounded-full flex items-center justify-center bg-white/75 dark:bg-neutral-900/75 hover:bg-white dark:hover:bg-neutral-900 text-ink-2 hover:text-ink shadow-2xs border border-white/40 cursor-pointer focus-visible:outline-none"
              aria-label="Room options"
            >
              <MoreVertical className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 z-50 bg-popover">
              <DropdownMenuItem onClick={handleCopyCode} className="gap-2 text-xs cursor-pointer">
                <Copy className="size-3.5" /> Copy room code
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleInvite} className="gap-2 text-xs cursor-pointer">
                <UserPlus className="size-3.5" /> Invite team
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenRoom} className="gap-2 text-xs cursor-pointer">
                <ArrowRight className="size-3.5" /> Open room
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── CARD BODY (padding 18px) ─────────────────────────────────── */}
      <div className="p-4 sm:p-[18px] flex flex-col gap-3 flex-1">
        {/* Room name */}
        <h3
          className="text-[22px] sm:text-[24px] font-[var(--font-display)] text-ink leading-tight truncate group-hover:text-blue-600 transition-colors"
          title={room.name}
        >
          {room.name || 'Untitled Room'}
        </h3>

        {/* Meta line: Template + Duration */}
        <div className="flex items-center gap-3 text-xs text-ink-2">
          <span className="inline-flex items-center gap-1 truncate font-medium">
            <Layers className="size-3.5 text-ink-3 shrink-0" />
            <span className="truncate">{room.templateName || 'Hackathon Sprint'}</span>
          </span>
          <span className="size-1 rounded-full bg-border shrink-0" />
          <span className="inline-flex items-center gap-1 font-mono font-medium shrink-0">
            <Clock className="size-3.5 text-ink-3 shrink-0" />
            <span>{duration}h</span>
          </span>
        </div>

        {/* Segmented Phase Progress bar */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex gap-1.5 h-1.5 w-full">
            {PHASES.map((p, idx) => {
              const isPast = idx < currentPhaseIndex;
              const isCurrent = idx === currentPhaseIndex;
              return (
                <div
                  key={p}
                  className={cn(
                    'flex-1 h-full rounded-full transition-all duration-300',
                    isPast && 'bg-[#141414] dark:bg-neutral-100',
                    isCurrent && 'bg-[var(--color-home-accent,#2563EB)] animate-pulse',
                    !isPast && !isCurrent && 'bg-[#E8E8E8] dark:bg-neutral-800'
                  )}
                  title={`${p} phase`}
                />
              );
            })}
          </div>
        </div>

        {/* TIME block */}
        <div className="flex items-baseline justify-between gap-2 pt-0.5">
          <span
            className={cn(
              'text-xs font-semibold text-ink',
              timeInfo.isMono && 'font-[var(--font-mono)] tabular-nums'
            )}
          >
            {timeInfo.text}
          </span>
        </div>

        {/* NEXT STEP line */}
        {room.nextStepLabel && (
          <div className="flex items-center gap-1.5 text-xs text-ink-2 truncate bg-surface/60 rounded-[6px] px-2 py-1 border border-border/40">
            <span className="size-1.5 rounded-full bg-blue-500 shrink-0" />
            <span className="truncate font-medium">{room.nextStepLabel}</span>
          </div>
        )}

        {/* ── FOOTER ROW (separated by hairline divider) ────────────────── */}
        <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between gap-3 min-h-[36px]">
          {/* Stacked Member Avatars */}
          <div className="flex items-center">
            {previews.slice(0, 4).map((member, i) => (
              <Tooltip key={member.id || i}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'relative ring-2 ring-card rounded-full transition-all duration-200 group-hover:-ml-1',
                      i > 0 ? '-ml-2' : ''
                    )}
                  >
                    <UserAvatar
                      user={member}
                      size={26}
                      className="border-none"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  @{member.username || member.displayName || 'member'}
                </TooltipContent>
              </Tooltip>
            ))}

            {memberCount > 4 && (
              <span
                className="size-[26px] rounded-full bg-surface border border-border text-ink-2 ring-2 ring-card -ml-2 group-hover:-ml-1 transition-all duration-200 flex items-center justify-center text-[10px] font-mono font-semibold"
                title={`${memberCount} total members`}
              >
                +{memberCount - 4}
              </span>
            )}
          </div>

          {/* Role marker + Hover link */}
          <div className="flex items-center gap-3 ml-auto">
            {isLeader ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-500">
                <Crown className="size-3.5 fill-amber-500/20 stroke-amber-600 dark:stroke-amber-500" />
                <span>Leader</span>
              </span>
            ) : (
              <span className="text-xs text-ink-3">Member</span>
            )}

            {/* Sliding "Open room" arrow link */}
            <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-[180ms] pointer-events-none">
              <span>Open</span>
              <ArrowRight className="size-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
