import type { ReactNode } from 'react';
import {
  HomeIcon,
  MyRoomsIcon,
  PlaybooksIcon,
  ToolDirectoryIcon,
  PortfolioIcon,
  SettingsIcon,
  CollapseLeftIcon,
  SearchIcon,
} from '@/components/icons';
import { ChevronRight, Volume2, Bell } from 'lucide-react';
import { KbdChip } from '@/shared/ui/primitives/KbdChip';
import goproImg from '../../../../../images/gopro.png';
import darkLogo from '../../../../../images/dark.svg';
import lightLogo from '../../../../../images/light.svg';

// Copied and adapted from:
// - frontend/src/app/layout/app-shell.tsx
// - frontend/src/app/layout/sidebar.tsx
// - frontend/src/app/layout/top-bar.tsx
// - frontend/src/app/layout/notifications-popover.tsx

export const APP_DESIGN_WIDTH = 1272;
export const APP_SIDEBAR_WIDTH = 232;
export const APP_COMPACT_WIDTH = 1040; // 1272 - 232px sidebar

interface ProductAppShellProps {
  active: string;
  crumbs?: string[];
  compact?: boolean;
  children: ReactNode;
}

interface NavItemDef {
  key: string;
  label: string;
  icon: (props: { size: number; className?: string }) => ReactNode;
  badge?: number;
}

const NAV_ITEMS: NavItemDef[] = [
  {
    key: 'home',
    label: 'Home',
    icon: ({ size, className }) => <HomeIcon size={size} className={className} />,
  },
  {
    key: 'my-rooms',
    label: 'My rooms',
    icon: ({ size, className }) => <MyRoomsIcon size={size} className={className} />,
    badge: 2,
  },
  {
    key: 'playbooks',
    label: 'Playbooks',
    icon: ({ size, className }) => <PlaybooksIcon size={size} className={className} />,
  },
  {
    key: 'tools',
    label: 'Tool directory',
    icon: ({ size, className }) => <ToolDirectoryIcon size={size} className={className} />,
  },
  {
    key: 'portfolio',
    label: 'Portfolio',
    icon: ({ size, className }) => <PortfolioIcon size={size} className={className} />,
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: ({ size, className }) => <SettingsIcon size={size} className={className} />,
  },
];

export function ProductAppShell({
  active,
  crumbs = ['Workspace', 'Playbooks'],
  compact = false,
  children,
}: ProductAppShellProps) {
  const normActive = (active || '').toLowerCase();

  return (
    <div
      className="flex h-full w-full overflow-hidden bg-shell select-none text-ink font-sans"
      style={{ width: compact ? APP_COMPACT_WIDTH : APP_DESIGN_WIDTH }}
    >
      {/* ── 1. GLOBAL SIDEBAR (232px) ── */}
      {!compact && (
        <div
          className="flex flex-col bg-shell h-full shrink-0 border-r border-border px-5 pt-6 pb-4 overflow-hidden"
          style={{ width: APP_SIDEBAR_WIDTH }}
        >
          {/* Brand header */}
          <div className="flex h-9 items-center mb-4 shrink-0 px-1">
            <span className="flex items-center gap-1.5 font-display text-xl font-normal tracking-tight text-ink">
              <span className="font-mono text-base font-bold text-accent">[</span>
              <span>brackit</span>
              <span className="font-mono text-base font-bold text-accent">]</span>
            </span>
          </div>

          {/* Collapse control */}
          <div className="flex items-center gap-2.5 h-7 rounded-[8px] px-2.5 mb-4 text-ink-2 text-[14px] shrink-0 cursor-default">
            <div className="shrink-0 flex items-center justify-center size-5">
              <CollapseLeftIcon size={16} />
            </div>
            <span className="text-[14px] font-normal leading-[20px]">Collapse</span>
          </div>

          {/* Nav items */}
          <div className="flex-1 min-h-0 flex flex-col gap-1 overflow-hidden">
            {NAV_ITEMS.map((item) => {
              const isActive =
                normActive === item.key ||
                normActive === item.label.toLowerCase() ||
                (normActive.includes('create') && item.key === 'my-rooms') ||
                (normActive.includes('playbook') && item.key === 'playbooks');

              return (
                <div
                  key={item.key}
                  className={`group relative flex items-center h-8 rounded-[var(--r-control)] px-2.5 gap-2.5 w-full text-[14px] leading-[20px] font-medium transition-colors ${
                    isActive
                      ? 'bg-hover-surface text-ink'
                      : 'bg-transparent text-ink'
                  }`}
                >
                  {/* 2px active accent bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />
                  )}

                  {/* Icon */}
                  <span className="shrink-0 flex items-center justify-center size-5 text-ink">
                    {item.icon({ size: 18 })}
                  </span>

                  {/* Label */}
                  <span className="flex-1 truncate">{item.label}</span>

                  {/* Badge */}
                  {item.badge !== undefined && (
                    <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-surface border border-border text-ink-3">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Promo card: Go Pro */}
          <div className="rounded-[var(--r-card)] border border-border bg-card p-1 shrink-0 mt-3 mb-3">
            <div className="rounded-[10px] overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <img src={goproImg} alt="Go Pro" className="w-full h-full object-cover" />
            </div>
            <div className="px-1 pt-2 pb-1.5 flex flex-col">
              <p className="text-[14px] leading-[20px] font-medium text-ink">
                Go Pro
              </p>
              <p className="text-[11px] leading-[14px] font-normal text-ink-2 truncate">
                AI planning and auto-scheduling.
              </p>
            </div>
          </div>

          {/* Footer user chip with handle and UTC time */}
          <div className="flex flex-col pt-2 border-t border-border/70 shrink-0">
            <div className="flex items-center h-8 gap-2.5 px-2 rounded w-full">
              <div className="shrink-0 flex items-center justify-center size-5 rounded-full bg-accent/20 text-ink text-[11px] font-bold">
                A
              </div>
              <span className="text-[13px] font-medium text-ink truncate">
                @aarav
              </span>
            </div>
            <p className="text-[11px] text-ink-3 font-mono tabular-nums leading-[16px] ml-9 mt-0.5 shrink-0">
              10:24:06 AM UTC
            </p>
          </div>
        </div>
      )}

      {/* ── 2. INSET MAIN PANEL ── */}
      <div className="flex-1 flex flex-col min-w-0 mt-2 bg-page border border-b-0 border-r-0 border-border rounded-tl-[16px] rounded-tr-[16px] overflow-hidden">
        {/* Panel Header (72px) */}
        <div className="flex items-center justify-between h-[72px] pl-[32px] pr-8 bg-surface border-b border-border shrink-0">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-[13px] leading-[16px] font-medium shrink-0 min-w-0">
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1;
              return (
                <div key={crumb} className="flex items-center gap-1.5 min-w-0">
                  {idx > 0 && <ChevronRight size={12} className="text-ink-3 shrink-0" />}
                  <span
                    className={
                      isLast
                        ? 'text-ink font-semibold truncate'
                        : 'text-ink-2 truncate'
                    }
                  >
                    {crumb}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Center: Search button with Ctrl K */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 w-[400px] h-9 px-3 rounded-full border border-border bg-card text-[13px] leading-[16px] font-medium text-ink-2">
              <SearchIcon size={14} className="shrink-0 text-ink-2" />
              <span className="flex-1 text-left truncate">Search tasks, docs, rules</span>
              <KbdChip />
            </div>
          </div>

          {/* Right: Sound toggle + Bell with count badge + Avatar */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Sound toggle icon */}
            <div className="size-8 rounded-full border border-border bg-card flex items-center justify-center text-ink-2">
              <Volume2 size={14} />
            </div>

            {/* Notification bell with count badge */}
            <div className="size-8 rounded-full border border-border bg-card flex items-center justify-center text-ink-2 relative">
              <Bell size={14} />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none flex items-center justify-center">
                3
              </span>
            </div>

            {/* Avatar */}
            <div className="size-8 rounded-full bg-accent/20 border border-border flex items-center justify-center text-ink font-bold text-xs">
              A
            </div>
          </div>
        </div>

        {/* Content Region */}
        <div className="flex-1 flex flex-col min-h-0 bg-page overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
