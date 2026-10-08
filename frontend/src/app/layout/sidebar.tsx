/**
 * AppSidebar — redesigned light sidebar (Section 4.2 / Section 8.1)
 *
 * Width: 232px expanded / 64px collapsed icon-only rail.
 * Padding: 20px.
 * Background: --shell (light gray).
 */
import * as React from 'react';
import { cn } from 'cn';
import {
  House,
  Wrench,
  Briefcase,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Copy,
} from 'lucide-react';
import { NavLink, useMatch } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebarStore } from './use-sidebar-store';
import { TrayArrowIcon } from '@/shared/ui/icons/TrayArrowIcon';
import { StackIcon } from '@/shared/ui/icons/StackIcon';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useOverlay } from '@/app/providers/overlay-store';
import { useHome } from '@/features/home/hooks/use-home';
import { formatClock } from '@/shared/lib/clock';
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
    icon: ({ size, className }) => (
      <House size={size} className={cn('icon-house', className)} strokeWidth={1.75} />
    ),
    path: '/app/home',
    key: 'home',
  },
  {
    label: 'My rooms',
    icon: ({ size, className }) => (
      <StackIcon size={size} className={className} />
    ),
    path: '/app/rooms',
    key: 'my-rooms',
  },
  {
    label: 'Playbooks',
    icon: ({ size, className }) => (
      <TrayArrowIcon size={size} className={className} />
    ),
    path: '/app/playbooks',
    key: 'playbooks',
  },
  {
    label: 'Tool directory',
    icon: ({ size, className }) => (
      <Wrench size={size} className={cn('icon-wrench', className)} strokeWidth={1.75} />
    ),
    path: '/app/tools',
    key: 'tools',
  },
  {
    label: 'Portfolio',
    icon: ({ size, className }) => (
      <Briefcase size={size} className={className} strokeWidth={1.75} />
    ),
    path: '/app/portfolio',
    key: 'portfolio',
  },
  {
    label: 'Settings',
    icon: ({ size, className }) => (
      <Settings size={size} className={cn('icon-settings', className)} strokeWidth={1.75} />
    ),
    path: '/app/settings',
    key: 'settings',
  },
];

// ── Live clock ──────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = React.useState(() => formatTime());

  function formatTime() {
    return formatClock(new Date());
  }

  React.useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

// ── Nav row ─────────────────────────────────────────────────────────
function NavRow({
  item,
  isCollapsed,
}: {
  item: NavItem;
  isCollapsed: boolean;
}) {
  const match = useMatch({ path: item.path, end: item.path === '/app/home' });
  const isActive = !!match;

  const row = (
    <NavLink
      to={item.path}
      aria-current={isActive ? 'page' : undefined}
      className={({ isActive: a }) =>
        cn(
          'nav-row group flex items-center h-8 rounded-[var(--r-control)] px-2.5 gap-2.5 w-full outline-none',
          'transition-colors duration-[150ms] cursor-pointer text-[14px] leading-[20px] font-medium',
          'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
          a
            ? 'bg-active text-ink'
            : 'bg-transparent text-ink hover:bg-hover active:scale-[0.99]',
        )
      }
      style={({ isActive: a }) => ({
        ['--nav-icon-bg' as string]: a ? 'var(--active)' : 'var(--shell)',
      })}
      data-testid={`nav-row-${item.key}`}
    >
      {/* Icon */}
      <span className="shrink-0 flex items-center justify-center size-5" data-testid={`nav-icon-${item.key}`}>
        {item.icon({ size: 20 })}
      </span>

      {/* Label */}
      {!isCollapsed && (
        <span className="flex-1 truncate" data-testid={`nav-label-${item.key}`}>
          {item.label}
        </span>
      )}

      {/* Badge */}
      {!isCollapsed && item.badge != null && item.badge > 0 && (
        <span className="ml-2 inline-flex items-center justify-center h-5 px-2 rounded-full bg-success-bg text-[12px] leading-[16px] font-semibold text-success-fg tabular-nums" data-testid={`nav-badge-${item.key}`}>
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
      <rect width="18" height="18" rx="4" fill="var(--ink)" />
      <path
        d="M5 4v10M13 4v10M5 9h8"
        stroke="white"
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
  const myRoomsCount = homeData?.roomList?.length ?? 0;
  const clock = useClock();

  const displayName = user?.name ?? user?.email ?? '';

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
        'flex flex-col bg-shell h-dvh shrink-0',
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
        <div className="flex h-7 items-center gap-2.5 px-2.5 mb-0">
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
            'flex items-center gap-2.5 h-7 rounded-[8px] px-2.5 mb-4 mt-0',
            'text-ink-2 text-[14px] cursor-pointer',
            'hover:bg-hover transition-colors duration-[150ms]',
            'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
            isCollapsed && 'justify-center px-0',
          )}
        >
          {isCollapsed ? (
            <div className="shrink-0 flex items-center justify-center size-5">
              <ChevronsRight size={16} />
            </div>
          ) : (
            <>
              <div className="shrink-0 flex items-center justify-center size-5">
                <ChevronsLeft size={16} data-testid="collapse-icon" />
              </div>
              <span className="text-[14px] font-normal leading-[20px]" data-testid="collapse-text">Collapse</span>
            </>
          )}
        </button>

        {/* 3. Primary nav */}
        <nav className="flex flex-col gap-1" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavRow key={item.path} item={{ ...item, badge: item.key === 'my-rooms' ? myRoomsCount : item.badge }} isCollapsed={isCollapsed} />
          ))}
        </nav>

        {/* 4. Promo card */}
        {!isCollapsed && (
          <a
            href="/app/settings/billing"
            className={cn(
              'block rounded-[var(--r-card)] border border-border bg-card p-1 mt-9',
              'hover:border-border-strong transition-colors duration-[150ms]',
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
              <p className="text-[14px] leading-[20px] font-medium text-ink" data-testid="promo-title">Go Pro</p>
              <p className="text-[11px] leading-[14px] font-normal text-ink-2" data-testid="promo-caption" style={{ textWrap: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                AI planning and auto-scheduling.
              </p>
            </div>
          </a>
        )}

        {/* Spacer to push footer to bottom */}
        <div className="flex-1" />

        {/* 5. Footer: email + clock */}
        {!isCollapsed && (
          <div className="flex flex-col gap-0.5">
            {displayName && (
              <button
                onClick={handleCopyEmail}
                className="flex items-center h-8 gap-2.5 px-2.5 hover:text-ink-2 transition-colors cursor-pointer group focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 rounded"
                aria-label="Copy email"
                title={copyFeedback ? 'Copied!' : 'Copy email'}
              >
                <div className="shrink-0 flex items-center justify-center size-5" data-testid="footer-copy-box">
                  <Copy size={18} strokeWidth={1.75} className="opacity-60 group-hover:opacity-100" />
                </div>
                <span className="text-[14px] font-normal leading-[20px] text-ink truncate" data-testid="footer-email">{displayName}</span>
              </button>
            )}
            <p
              className="text-[13px] text-ink-3 tabular-nums leading-[16px] ml-10 mt-4"
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
