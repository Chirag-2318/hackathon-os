/**
 * AppSidebar — redesigned light sidebar with Room Nav takeover
 *
 * Width: 232px expanded / 64px collapsed icon-only rail.
 * Padding: 20px.
 * Background: --shell (light gray).
 */
import * as React from 'react';
import { cn } from 'cn';
import { NavLink, useMatch, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebarStore } from './use-sidebar-store';
import {
  HomeIcon,
  MyRoomsIcon,
  PlaybooksIcon,
  ToolDirectoryIcon,
  PortfolioIcon,
  SettingsIcon,
  CollapseLeftIcon,
  CollapseRightIcon,
} from '@/components/icons';
import { RoomNav } from './room-nav';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useOverlay } from '@/app/providers/overlay-store';
import { useHome } from '@/features/home/hooks/use-home';
import { formatClock, useClock } from '@/shared/lib/clock';
import { Copy, Plus } from 'lucide-react';
import { UserName } from '@/components/ui/user-name';
import { UserAvatar } from '@/components/ui/user-avatar';
import goproImg from '../../../images/gopro.png';

// ── Nav configuration ──────────────────────────────────────────────
interface NavItem {
  label: string;
  icon: (props: { size: number; className?: string }) => React.ReactNode;
  path: string;
  key: string;
  badge?: number;
  iconClassName?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    icon: ({ size, className }) => <HomeIcon size={size} className={className} />,
    path: '/app/home',
    key: 'home',
  },
  {
    label: 'My rooms',
    icon: ({ size, className }) => <MyRoomsIcon size={size} className={className} />,
    path: '/app/rooms',
    key: 'my-rooms',
  },
  {
    label: 'Playbooks',
    icon: ({ size, className }) => <PlaybooksIcon size={size} className={className} />,
    path: '/app/playbooks',
    key: 'playbooks',
  },
  {
    label: 'Tool directory',
    icon: ({ size, className }) => <ToolDirectoryIcon size={size} className={className} />,
    path: '/app/tools',
    key: 'tools',
  },
  {
    label: 'Portfolio',
    icon: ({ size, className }) => <PortfolioIcon size={size} className={className} />,
    path: '/app/portfolio',
    key: 'portfolio',
  },
  {
    label: 'Settings',
    icon: ({ size, className }) => <SettingsIcon size={size} className={className} />,
    path: '/app/settings',
    key: 'settings',
  },
];

// ── Nav row ─────────────────────────────────────────────────────────
function NavRow({
  item,
  isCollapsed,
  onCreateRoom,
}: {
  item: NavItem;
  isCollapsed: boolean;
  onCreateRoom?: () => void;
}) {
  const match = useMatch({ path: item.path, end: item.path === '/app/home' });
  const isActive = !!match;

  const row = (
    <NavLink
      to={item.path}
      aria-current={isActive ? 'page' : undefined}
      className={({ isActive: a }) =>
        cn(
          'nav-row group relative flex items-center h-8 rounded-[var(--r-control)] px-2.5 gap-2.5 w-full outline-none',
          'transition-colors duration-[150ms] cursor-pointer text-[14px] leading-[20px] font-medium',
          'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
          a
            ? 'bg-hover-surface text-ink'
            : 'bg-transparent text-ink hover:bg-hover active:scale-[0.99]',
        )
      }
      style={({ isActive: a }) => ({
        ['--nav-icon-bg' as string]: a ? 'var(--hover-surface)' : 'var(--sidebar)',
      })}
      data-testid={`nav-row-${item.key}`}
      data-tour={`nav-${item.key === 'my-rooms' ? 'rooms' : item.key}`}
    >
      {/* 2px active accent bar */}
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />
      )}

      {/* Icon */}
      <span className="shrink-0 flex items-center justify-center size-5" data-testid={`nav-icon-${item.key}`}>
        {item.icon({ size: 18 })}
      </span>

      {/* Label */}
      {!isCollapsed && (
        <span className="flex-1 truncate" data-testid={`nav-label-${item.key}`}>
          {item.label}
        </span>
      )}

      {/* My rooms hover '+' icon button (Section addition) */}
      {!isCollapsed && item.key === 'my-rooms' && onCreateRoom && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCreateRoom();
          }}
          aria-label="Create room"
          title="Create room"
          className="opacity-0 group-hover:opacity-100 size-5 rounded hover:bg-surface text-ink-2 hover:text-ink flex items-center justify-center transition-all cursor-pointer mr-0.5"
        >
          <Plus className="size-3.5 hover:rotate-90 transition-transform duration-200" />
        </button>
      )}

      {/* Badge */}
      {!isCollapsed && item.badge != null && item.badge > 0 && (
        <span className="ml-auto inline-flex items-center justify-center h-5 px-2 rounded-full bg-success-bg text-[12px] leading-[16px] font-mono font-semibold text-success-fg tabular-nums" data-testid={`nav-badge-${item.key}`}>
          {item.badge}
        </span>
      )}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>{row}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12} className="rounded-[8px] text-[14px]">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return row;
}

// ── Brand logo mark ─────────────────────────────────────────────────
function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      data-testid="brand-glyph"
    >
      <rect width="18" height="18" rx="4" fill="var(--logo-bg)" />
      <path
        d="M5 4v10M13 4v10M5 9h8"
        stroke="var(--logo-fg)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────
export function AppSidebar() {
  const { isCollapsed, toggleCollapsed } = useSidebarStore();
  const { data: user } = useCurrentUser();
  const { data: homeData } = useHome();
  const createRoomModal = useOverlay('create-room-dialog');
  const location = useLocation();

  const myRoomsCount = homeData?.roomList?.length ?? 0;
  const clock = useClock();

  // Detect room context
  const roomMatch = location.pathname.match(/\/app\/room\/([^/]+)/);
  const roomId = roomMatch ? roomMatch[1] : null;
  const inRoom = Boolean(roomId);

  const displayName = user?.displayName ?? user?.email ?? '';

  const [copyFeedback, setCopyFeedback] = React.useState(false);

  function handleCopyEmail() {
    if (user?.email) {
      navigator.clipboard.writeText(user.email).catch(() => {});
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
  }

  return (
    <aside
      className={cn(
        'flex flex-col bg-[var(--sidebar)] h-dvh shrink-0',
        'transition-[width] duration-200',
        'overflow-hidden',
        isCollapsed ? 'px-[12px] pt-10 pb-8' : 'px-5 pt-10 pb-8'
      )}
      style={{
        width: isCollapsed ? 64 : 232,
        transitionTimingFunction: 'var(--ease)',
      }}
      aria-label="Primary navigation"
      data-testid="sidebar"
    >
      <div className="flex flex-col h-full" style={{ minWidth: isCollapsed ? 40 : 192 }}>

        {/* 1. Brand row */}
        <div className="flex h-7 items-center gap-2.5 px-2.5 mb-0 shrink-0">
          <div className="shrink-0 flex items-center justify-center size-5">
            <LogoMark size={20} />
          </div>
          {!isCollapsed && (
            <span
              className="text-[16px] leading-[24px] font-semibold text-ink truncate tracking-[-0.01em]"
              style={{ fontWeight: 600 }}
              data-testid="brand-text"
            >
              Hackathon OS
            </span>
          )}
        </div>

        {/* 2. Collapse row */}
        <button
          onClick={toggleCollapsed}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex items-center gap-2.5 h-7 rounded-[8px] px-2.5 mb-4 mt-0 shrink-0',
            'text-ink-2 text-[14px] cursor-pointer',
            'hover:bg-hover transition-colors duration-[150ms]',
            'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
            isCollapsed && 'justify-center px-0',
          )}
        >
          {isCollapsed ? (
            <div className="shrink-0 flex items-center justify-center size-5">
              <CollapseRightIcon size={16} />
            </div>
          ) : (
            <>
              <div className="shrink-0 flex items-center justify-center size-5">
                <CollapseLeftIcon size={16} data-testid="collapse-icon" />
              </div>
              <span className="text-[14px] font-normal leading-[20px]" data-testid="collapse-text">Collapse</span>
            </>
          )}
        </button>

        {/* 3. Primary nav BODY: swaps between Global list and Room list */}
        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {inRoom && roomId ? (
              <motion.div
                key={`room-nav-${roomId}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col min-h-0"
              >
                <RoomNav roomId={roomId} isCollapsed={isCollapsed} />
              </motion.div>
            ) : (
              <motion.div
                key="global-nav"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col min-h-0"
              >
                <nav className="flex flex-col gap-1" aria-label="Primary">
                  {NAV_ITEMS.map((item) => (
                    <NavRow
                      key={item.path}
                      item={{ ...item, badge: item.key === 'my-rooms' ? myRoomsCount : item.badge }}
                      isCollapsed={isCollapsed}
                      onCreateRoom={item.key === 'my-rooms' ? createRoomModal.open : undefined}
                    />
                  ))}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Promo card (shown only when NOT in a room) */}
        {!isCollapsed && (
          <AnimatePresence>
            {!inRoom && (
              <motion.a
                key="gopro-promo"
                href="/app/settings/billing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={cn(
                  'block rounded-[var(--r-card)] border border-border bg-card p-1 shrink-0 mt-4',
                  'hover:border-border-strong transition-colors duration-150',
                  'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
                  '[@media(max-height:680px)]:hidden'
                )}
                aria-label="Go Pro — unlock AI planning and auto-scheduling"
                data-testid="promo"
              >
                {/* Art */}
                <div className="rounded-[10px] overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img src={goproImg} alt="Go Pro" className="w-full h-full object-cover" />
                </div>
                <div className="px-1 pt-2 pb-2 flex flex-col">
                  <p className="text-[14px] leading-[20px] font-medium text-ink" data-testid="promo-title">
                    Go Pro
                  </p>
                  <p
                    className="text-[11px] leading-[14px] font-normal text-ink-2"
                    data-testid="promo-caption"
                    style={{ textWrap: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    AI planning and auto-scheduling.
                  </p>
                </div>
              </motion.a>
            )}
          </AnimatePresence>
        )}

        {/* 5. Footer: email + clock (Home/global sidebar) */}
        {!isCollapsed && !inRoom && (
          <div className="flex flex-col mt-2 shrink-0">
            <AnimatePresence initial={false}>
              {displayName && (
                <motion.div
                  key="footer-email-row"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center h-8 gap-2.5 px-2.5 hover:text-ink-2 transition-colors cursor-pointer group focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 rounded w-full"
                    aria-label="Copy email"
                    title={copyFeedback ? 'Copied!' : 'Copy email'}
                  >
                    <div className="shrink-0 flex items-center justify-center size-5 rounded-full overflow-hidden" data-testid="footer-copy-box">
                      <UserAvatar user={user} size={20} />
                    </div>
                    <span className="text-[14px] font-normal leading-[20px] text-ink truncate" data-testid="footer-email">
                      <UserName user={user} showDisplayName={true} />
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <p
              className="text-[13px] text-ink-3 font-mono tabular-nums leading-[16px] ml-10 mt-1 shrink-0"
              aria-live="polite"
              aria-atomic="true"
              data-testid="footer-clock"
            >
              {clock}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
