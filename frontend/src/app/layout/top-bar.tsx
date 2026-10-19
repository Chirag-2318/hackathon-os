/**
 * PanelHeader — sticky header inside the main panel (Section 8.3)
 *
 * Height 72px, px-8, sticky top-0, bg-surface.
 * Left: breadcrumb. Center: search button + KbdChip (opens command palette).
 * Right: bell (NotificationsPopover) + avatar (AvatarMenuPopover).
 */
import * as React from 'react';
import { cn } from 'cn';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useOverlay } from '@/app/providers/overlay-store';
import { useHome } from '@/features/home/hooks/use-home';
import { KbdChip } from '@/shared/ui/primitives/KbdChip';
import { SearchIcon } from '@/components/icons';
import { NotificationsPopover } from './notifications-popover';
import { AvatarMenuPopover } from './avatar-menu-popover';
import { SoundToggle } from '@/shared/sound/sound-effects';
import { useLiveContext, LiveIndicator } from '@/design';

import { useRoomOverview } from '@/features/room-overview/hooks/use-room-overview';

interface PanelHeaderProps {
  inRoom?: boolean;
  pageName?: string;
}

const SECTION_MAP: Record<string, { group?: string; label: string }> = {
  overview: { label: 'Overview' },
  team: { label: 'Team' },
  prep: { group: 'Plan', label: 'Prep' },
  brief: { group: 'Plan', label: 'Brief' },
  ideate: { group: 'Plan', label: 'Ideate' },
  'crowd-check': { group: 'Plan', label: 'Crowd check' },
  plan: { group: 'Plan', label: 'Plan' },
  board: { group: 'Build', label: 'Board' },
  schedule: { group: 'Build', label: 'Schedule' },
  mvp: { group: 'Build', label: 'MVP studio' },
  docs: { group: 'Build', label: 'Docs' },
  github: { group: 'Tech', label: 'GitHub' },
  apis: { group: 'Tech', label: 'API hub' },
  diagrams: { group: 'Tech', label: 'Diagrams' },
  deck: { group: 'Present', label: 'Deck' },
  'pitch-kit': { group: 'Present', label: 'Pitch kit' },
  pitch: { group: 'Present', label: 'Deck' },
  'pitch/deck': { group: 'Present', label: 'Deck' },
  'pitch/rehearse': { group: 'Present', label: 'Pitch kit' },
  'pitch/qa': { group: 'Present', label: 'Pitch kit' },
  demo: { group: 'Present', label: 'Pitch kit' },
  submission: { group: 'Present', label: 'Submission' },
  submit: { group: 'Present', label: 'Submission' },
  readiness: { group: 'Review', label: 'Readiness' },
  summary: { group: 'Review', label: 'Summary' },
  retro: { group: 'Review', label: 'Retro' },
  notifications: { label: 'Notifications' },
};

export function PanelHeader({ inRoom: inRoomProp = false, pageName = 'Home' }: PanelHeaderProps) {
  const commandPalette = useOverlay('command-palette');
  const location = useLocation();
  const { data: homeData } = useHome();
  const [scrolled, setScrolled] = React.useState(false);

  // Check if inside a room
  const inRoom = inRoomProp || location.pathname.startsWith('/app/room/');
  const roomMatch = location.pathname.match(/\/app\/room\/([^/]+)(?:\/(.*))?/);
  const roomId = roomMatch ? roomMatch[1] : '';
  const subSection = roomMatch && roomMatch[2] ? roomMatch[2] : 'overview';

  const { data: overviewData } = useRoomOverview(roomId);
  const currentRoom = homeData?.roomList?.find((r: any) => r.id === roomId);
  const rawRoomTitle =
    (roomId === 'sample-room' ? 'Team Orbit' : undefined) ??
    overviewData?.room?.name ??
    overviewData?.room?.title ??
    currentRoom?.title ??
    currentRoom?.name ??
    'Hackathon Workspace';
  const roomTitle = rawRoomTitle.length > 24 ? rawRoomTitle.slice(0, 24) + '…' : rawRoomTitle;

  const sectionMeta = SECTION_MAP[subSection] || { label: subSection || 'Overview' };

  const { isReconnecting } = useLiveContext();


  // Show bottom border only after panel has scrolled
  const panelRef = React.useRef<Element | null>(null);
  React.useEffect(() => {
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

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex items-center h-[72px] pl-[80px] pr-8 bg-surface',
        'transition-[border-bottom] duration-150',
        scrolled ? 'border-b border-border' : 'border-b border-transparent',
      )}
    >
      {/* Left: breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px] leading-[16px] font-medium shrink-0 min-w-0" aria-label="Breadcrumb" data-testid="header-breadcrumb">
        {inRoom ? (
          <>
            <Link to="/app/rooms" className="text-ink-2 hover:text-ink transition-colors shrink-0">
              My rooms
            </Link>
            <ChevronRight size={12} className="text-ink-3 shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                to={`/app/room/${roomId}/overview`}
                className="text-ink-2 hover:text-ink transition-colors truncate max-w-[200px]"
                title={rawRoomTitle}
              >
                {roomTitle}
              </Link>
              <LiveIndicator members={overviewData?.members} />
            </div>
            {subSection !== 'overview' && sectionMeta.group && sectionMeta.group.toLowerCase() !== sectionMeta.label.toLowerCase() && (
              <>
                <ChevronRight size={12} className="text-ink-3 shrink-0" />
                <span className="text-ink-2 shrink-0">{sectionMeta.group}</span>
              </>
            )}
            {subSection !== 'overview' && (
              <>
                <ChevronRight size={12} className="text-ink-3 shrink-0" />
                <span className="text-ink truncate">{sectionMeta.label}</span>
              </>
            )}
          </>
        ) : (
          <>
            <span className="text-ink-2">Workspace</span>
            <ChevronRight size={12} className="text-ink-3 shrink-0" />
            <span className="text-ink truncate">{pageName}</span>
          </>
        )}
      </nav>

      {/* Center: search button */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
        <button
          onClick={commandPalette.open}
          className={cn(
            'group hidden md:flex items-center gap-2 w-[420px]',
            'h-9 px-3 rounded-full border border-border bg-card',
            'text-[13px] leading-[16px] font-medium text-ink-2',
            'hover:border-border-strong transition-colors duration-150 cursor-pointer',
            'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
          )}
          aria-label="Search tasks, docs, rules (Ctrl K)"
          data-testid="header-search"
          data-tour="search-box"
        >
          <SearchIcon size={14} className="shrink-0 text-ink-2 group-hover:text-ink" />
          <span className="flex-1 text-left truncate">Search tasks, docs, rules</span>
          <KbdChip />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: sound toggle + bell + avatar */}
      <div className="flex items-center gap-2">
        {/* Sound FX Toggle */}
        <SoundToggle />

        {/* Bell Popover */}
        <NotificationsPopover currentRoomId={roomId} roomList={homeData?.roomList} />

        {/* Avatar Menu Popover */}
        <AvatarMenuPopover />
      </div>
    </header>
  );
}

// Keep backward-compat export name
export { PanelHeader as TopBar };
