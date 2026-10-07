/**
 * C02 Top bar — desktop shell
 * Source: design.md §3.1, PRD §3.3
 *
 * 64px height. Left: breadcrumb. Center: search pill. Right: clock chip, bell, avatar.
 */
import { cn } from 'cn';
import { Search, Clock, Bell, User, ChevronRight } from 'lucide-react';
import { useOverlay } from '@/app/providers/overlay-store';
import { useSidebarStore } from './use-sidebar-store';
import { CountBadge } from '@/components/primitives/count-badge';
import { authApi } from '@/features/auth/api';
import { useQueryClient } from '@tanstack/react-query';

interface TopBarProps {
  /** Whether we're inside a room (shows clock chip) */
  inRoom?: boolean;
  /** Current page name for breadcrumb */
  pageName?: string;
  className?: string;
}

export function TopBar({
  inRoom = false,
  pageName = 'Home',
  className,
}: TopBarProps) {
  const commandPalette = useOverlay('command-palette');
  const roomFeed = useOverlay('room-feed');
  const { roomName } = useSidebarStore();

  return (
    <header
      className={cn(
        'h-14 flex items-center justify-between px-5 bg-canvas border-b border-border shrink-0',
        className
      )}
    >
      {/* Left: Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-body text-ink-muted min-w-0">
        <span className="hover:text-ink cursor-pointer">Workspace</span>
        {inRoom && roomName && (
          <>
            <ChevronRight className="size-3.5 shrink-0" />
            <span className="hover:text-ink cursor-pointer truncate">
              {roomName}
            </span>
          </>
        )}
        <ChevronRight className="size-3.5 shrink-0" />
        <span className="text-ink font-medium truncate">{pageName}</span>
      </nav>

      {/* Center: Search pill */}
      <button
        onClick={commandPalette.open}
        className="hidden md:flex items-center gap-2 h-8 px-3 rounded-pill bg-surface-raised border border-border text-ink-muted hover:border-border-strong hover:text-ink transition-colors"
      >
        <Search className="size-4" />
        <span className="text-body">Search tasks, docs, rules</span>
        <kbd className="ml-2 text-caption text-ink-disabled bg-surface-sunken px-1.5 py-0.5 rounded-chip">
          Ctrl K
        </kbd>
      </button>

      {/* Right: clock chip + bell + avatar */}
      <div className="flex items-center gap-3">
        {/* Clock chip — only inside a room */}
        {inRoom && (
          <div className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-pill bg-pastel-peach text-ink text-caption font-semibold">
            <Clock className="size-3.5" />
            <span className="tabular-nums">Freeze in 3h 20m</span>
          </div>
        )}

        {/* Bell with count badge */}
        <button
          onClick={roomFeed.open}
          className="relative flex items-center justify-center size-8 rounded-full hover:bg-surface-sunken transition-colors text-ink-muted hover:text-ink"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute -top-0.5 -right-0.5">
            <CountBadge count={3} variant="danger" />
          </span>
        </button>

        {/* Avatar menu */}
        <button
          className="flex items-center justify-center size-8 rounded-full bg-lav-200 text-ink text-caption font-bold hover:ring-2 hover:ring-lav-500 transition-shadow"
          aria-label="User menu"
        >
          <User className="size-4" />
        </button>
        <LogoutButton />
      </div>
    </header>
  );
}

function LogoutButton() {
  const queryClient = useQueryClient();
  return (
    <button
      className="text-caption text-ink-muted hover:text-ink transition-colors"
      onClick={async () => {
        await authApi.logout();
        queryClient.setQueryData(['currentUser'], null);
        window.location.href = '/login';
      }}
    >
      Log out
    </button>
  );
}
