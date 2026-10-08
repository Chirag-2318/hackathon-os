/**
 * PanelHeader — sticky header inside the main panel (Section 8.3)
 *
 * Height 56px, px-8, sticky top-0, bg-surface.
 * Left: breadcrumb. Center: search button + KbdChip. Right: bell + avatar menu.
 * Log out is in the avatar dropdown — not a bare link.
 */
import * as React from 'react';
import { cn } from 'cn';
import {
  Search,
  Bell,
  ChevronRight,
  Settings,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOverlay } from '@/app/providers/overlay-store';
import { useSidebarStore } from './use-sidebar-store';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { authApi } from '@/features/auth/api';
import { useQueryClient } from '@tanstack/react-query';
import { KbdChip } from '@/shared/ui/primitives/KbdChip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PanelHeaderProps {
  inRoom?: boolean;
  pageName?: string;
}

export function PanelHeader({ inRoom = false, pageName = 'Home' }: PanelHeaderProps) {
  const commandPalette = useOverlay('command-palette');
  const roomFeed = useOverlay('room-feed');
  const { roomName } = useSidebarStore();
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = React.useState(false);

  // Show bottom border only after panel has scrolled
  const panelRef = React.useRef<Element | null>(null);
  React.useEffect(() => {
    // Find the scrollable panel ancestor
    const el = document.querySelector('main.panel-scroll') ??
                document.querySelector('[class*="panel-scroll"]');
    if (!el) return;
    panelRef.current = el;
    function onScroll() {
      setScrolled((panelRef.current?.scrollTop ?? 0) > 4);
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Ctrl/Cmd+K listener
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        commandPalette.open();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [commandPalette]);

  const displayName = user?.displayName ?? user?.email ?? '';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0] ?? '')
    .join('')
    .toUpperCase() || '?';

  async function handleLogout() {
    await authApi.logout();
    queryClient.setQueryData(['currentUser'], null);
    window.location.href = '/login';
  }

  // Notification count — hardcoded to match existing behavior (CountBadge shows 3)
  const notifCount = 3;

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex items-center h-[72px] pl-[80px] pr-8 bg-surface',
        'transition-[border-bottom] duration-150',
        scrolled ? 'border-b border-border' : 'border-b border-transparent',
      )}
    >
      {/* Left: breadcrumb */}
      <nav className="flex items-center gap-1 text-[13px] leading-[16px] font-medium shrink-0 min-w-0" aria-label="Breadcrumb" data-testid="header-breadcrumb">
        <span className="text-ink-2">Workspace</span>
        {inRoom && roomName && (
          <>
            <ChevronRight size={12} className="text-ink-3 shrink-0" />
            <span className="text-ink-2 truncate max-w-[120px]">{roomName}</span>
          </>
        )}
        <ChevronRight size={12} className="text-ink-3 shrink-0" />
        <span className="text-ink truncate">{pageName}</span>
      </nav>

      {/* Center: search button */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
        <button
          onClick={commandPalette.open}
          className={cn(
            'hidden md:flex items-center gap-2 w-[420px]',
            'h-9 px-3 rounded-full border border-border bg-card',
            'text-[13px] leading-[16px] font-medium text-ink-2',
            'hover:border-border-strong transition-colors duration-150',
            'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
          )}
          aria-label="Search tasks, docs, rules (Ctrl K)"
          data-testid="header-search"
        >
          <Search size={14} strokeWidth={1.75} className="shrink-0" />
          <span className="flex-1 text-left truncate">Search tasks, docs, rules</span>
          <KbdChip />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <button
          onClick={roomFeed.open}
          className={cn(
            'relative flex items-center justify-center size-9 rounded-full',
            'text-ink-2 hover:bg-hover hover:text-ink',
            'transition-colors duration-150',
            'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
          )}
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={1.75} />
          {notifCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5',
                'flex items-center justify-center',
                'min-w-4 h-4 px-1 rounded-full',
                'bg-danger text-white text-[10px] font-semibold tabular-nums',
                'ring-2 ring-surface',
              )}
              aria-label={`${notifCount} notifications`}
            >
              {notifCount}
            </span>
          )}
        </button>

        {/* Avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center justify-center size-8 rounded-full',
                'bg-active text-ink text-xs font-semibold',
                'hover:ring-2 hover:ring-border-strong',
                'transition-shadow duration-150',
                'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
              )}
              aria-label="User menu"
              data-testid="header-avatar"
            >
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-[12px]">
            {displayName && (
              <>
                <DropdownMenuLabel className="font-normal py-2">
                  <div className="text-sm font-medium text-ink truncate">{displayName}</div>
                  {user?.email && displayName !== user.email && (
                    <div className="text-xs text-ink-2 truncate mt-0.5">{user.email}</div>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => navigate('/app/settings')}
            >
              <Settings size={14} />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-danger focus:text-danger"
              onClick={handleLogout}
            >
              <LogOut size={14} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// Keep backward-compat export name
export { PanelHeader as TopBar };
