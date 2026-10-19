import type { ReactNode } from 'react';
import {
  OverviewIcon,
  TeamIcon,
  PlanIcon,
  BriefIcon,
  IdeateIcon,
  BoardIcon,
  MvpStudioIcon,
  DocsIcon,
  GithubIcon,
  ApiHubIcon,
  PitchDeckIcon,
  RehearseIcon,
  SubmissionIcon,
  BackArrowIcon,
  SearchIcon,
} from '@/components/icons';
import { ChevronRight, Bell, Volume2, Lock, Check } from 'lucide-react';
import { KbdChip } from '@/shared/ui/primitives/KbdChip';
import { SHELL_FIXTURE } from '../../data/product-fixtures';

// Replicated from the product's real desktop frame:
// - AppShell (frontend/src/app/layout/app-shell.tsx)
// - PanelHeader (frontend/src/app/layout/top-bar.tsx)
// - AppSidebar (frontend/src/app/layout/sidebar.tsx)
// - RoomNav & JourneyRail (frontend/src/app/layout/room-nav.tsx & journey-rail.tsx)
// - RoomIdentity (frontend/src/app/layout/room-identity.tsx)

export const ROOM_DESIGN_WIDTH = 1272;
export const ROOM_COMPACT_WIDTH = 1040; // 1272 - 232px sidebar

interface ProductRoomShellProps {
  active: string;
  clock: string;
  rings: number[];
  compact: boolean;
  children: ReactNode;
}

export function ProductRoomShell({
  active,
  clock,
  rings,
  compact,
  children,
}: ProductRoomShellProps) {
  const normActive = active.toLowerCase();

  // Active section metadata for breadcrumbs
  const getBreadcrumbMeta = () => {
    if (normActive.includes('brief')) return { group: 'Plan', label: 'Brief' };
    if (normActive.includes('plan')) return { group: 'Plan', label: 'Plan' };
    if (normActive.includes('board')) return { group: 'Build', label: 'Board' };
    if (normActive.includes('present') || normActive.includes('pitch')) return { group: 'Present', label: 'Pitch kit' };
    return { group: 'Plan', label: 'Overview' };
  };

  const breadcrumb = getBreadcrumbMeta();

  // Derived readiness percentage
  const avgReadiness = Math.round(
    rings.reduce((sum, val) => sum + val, 0) / (rings.length || 1)
  );

  return (
    <div
      className="flex h-full w-full overflow-hidden bg-shell select-none text-ink font-sans"
      style={{ width: compact ? ROOM_COMPACT_WIDTH : ROOM_DESIGN_WIDTH }}
    >
      {/* ── 1. SIDEBAR (232px) — omitted in compact mode ── */}
      {!compact && (
        <aside
          className="flex flex-col bg-shell h-full shrink-0 border-r border-border px-5 pt-6 pb-4 overflow-hidden"
          style={{ width: 232 }}
          aria-label="Room navigation"
        >
          {/* Brand header */}
          <div className="flex h-9 items-center mb-4 shrink-0 px-1">
            <span className="flex items-center gap-2 font-display text-xl font-normal tracking-tight text-ink">
              <span className="font-mono text-base font-bold text-accent">[</span>
              <span>brackit</span>
              <span className="font-mono text-base font-bold text-accent">]</span>
            </span>
          </div>

          {/* Room identity block */}
          <div className="flex flex-col gap-1.5 mb-3 pb-3 border-b border-border/70 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-2">
              <BackArrowIcon size={12} className="text-ink-3" />
              <span>All rooms</span>
            </div>
            <div className="flex items-center justify-between gap-1.5 mt-1">
              <div className="font-semibold text-[13px] leading-tight text-ink truncate">
                {SHELL_FIXTURE.roomName}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="size-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-[11px] font-medium text-ink-2">Planning</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-surface border border-border text-ink-3 truncate max-w-[110px]">
                Sprint 2026
              </span>
            </div>
          </div>

          {/* Primary pinned items */}
          <div className="flex flex-col gap-0.5 pb-2 mb-2 border-b border-border/70 shrink-0 text-[13px]">
            <div className="flex items-center h-8 rounded-lg px-2 gap-2 text-ink-2 hover:bg-hover">
              <span className="size-4 shrink-0 flex items-center justify-center">
                <OverviewIcon size={16} />
              </span>
              <span className="flex-1 truncate">Overview</span>
            </div>
            <div className="flex items-center h-8 rounded-lg px-2 gap-2 text-ink-2 hover:bg-hover">
              <span className="size-4 shrink-0 flex items-center justify-center">
                <TeamIcon size={16} />
              </span>
              <span className="flex-1 truncate">Team</span>
              <span className="text-[10px] font-mono text-ink-3">4</span>
            </div>
          </div>

          {/* Journey Rail groups */}
          <div className="flex-1 flex flex-col gap-3 overflow-hidden text-[13px]">
            {/* PLAN GROUP */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-3">
                <span>Plan</span>
                <span className="font-mono text-[10px]">4/4</span>
              </div>

              {/* Brief */}
              <div
                className={`relative flex items-center h-8 rounded-lg px-2 gap-2 cursor-pointer transition-colors ${
                  normActive.includes('brief')
                    ? 'bg-hover-surface text-ink font-semibold'
                    : 'text-ink-2'
                }`}
              >
                {normActive.includes('brief') && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />
                )}
                <span className="size-4 shrink-0 flex items-center justify-center">
                  <BriefIcon size={15} />
                </span>
                <span className="flex-1 truncate">Brief</span>
                <Check className="size-3 text-emerald-600 shrink-0" strokeWidth={2.5} />
              </div>

              {/* Ideate */}
              <div className="flex items-center h-8 rounded-lg px-2 gap-2 text-ink-2">
                <span className="size-4 shrink-0 flex items-center justify-center">
                  <IdeateIcon size={15} />
                </span>
                <span className="flex-1 truncate">Ideate</span>
                <span className="px-1.5 py-0.2 rounded-full bg-surface border border-border text-[10px] font-mono font-semibold text-ink">
                  1
                </span>
              </div>

              {/* Plan */}
              <div
                className={`relative flex items-center h-8 rounded-lg px-2 gap-2 cursor-pointer transition-colors ${
                  normActive.includes('plan')
                    ? 'bg-hover-surface text-ink font-semibold'
                    : 'text-ink-2'
                }`}
              >
                {normActive.includes('plan') && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />
                )}
                <span className="size-4 shrink-0 flex items-center justify-center">
                  <PlanIcon size={15} />
                </span>
                <span className="flex-1 truncate">Plan</span>
                <Check className="size-3 text-emerald-600 shrink-0" strokeWidth={2.5} />
              </div>
            </div>

            {/* BUILD GROUP */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-3">
                <span>Build</span>
                <span className="font-mono text-[10px]">2/6</span>
              </div>

              {/* Board */}
              <div
                className={`relative flex items-center h-8 rounded-lg px-2 gap-2 cursor-pointer transition-colors ${
                  normActive.includes('board')
                    ? 'bg-hover-surface text-ink font-semibold'
                    : 'text-ink-2'
                }`}
              >
                {normActive.includes('board') && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />
                )}
                <span className="size-4 shrink-0 flex items-center justify-center">
                  <BoardIcon size={15} />
                </span>
                <span className="flex-1 truncate">Board</span>
                <span className="px-1.5 py-0.2 rounded-full bg-surface border border-border text-[10px] font-mono font-semibold text-ink">
                  4
                </span>
              </div>

              {/* MVP studio */}
              <div className="flex items-center h-8 rounded-lg px-2 gap-2 text-ink-2">
                <span className="size-4 shrink-0 flex items-center justify-center">
                  <MvpStudioIcon size={15} />
                </span>
                <span className="flex-1 truncate">MVP studio</span>
              </div>

              {/* Docs */}
              <div className="flex items-center h-8 rounded-lg px-2 gap-2 text-ink-2">
                <span className="size-4 shrink-0 flex items-center justify-center">
                  <DocsIcon size={15} />
                </span>
                <span className="flex-1 truncate">Docs</span>
                <span className="text-[10px] font-mono text-ink-3">9</span>
              </div>
            </div>

            {/* PRESENT GROUP */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-3">
                <span>Present</span>
              </div>

              {/* Pitch kit */}
              <div
                className={`relative flex items-center h-8 rounded-lg px-2 gap-2 cursor-pointer transition-colors ${
                  normActive.includes('present') || normActive.includes('pitch')
                    ? 'bg-hover-surface text-ink font-semibold'
                    : 'text-ink-2'
                }`}
              >
                {(normActive.includes('present') || normActive.includes('pitch')) && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />
                )}
                <span className="size-4 shrink-0 flex items-center justify-center">
                  <RehearseIcon size={15} />
                </span>
                <span className="flex-1 truncate">Pitch kit</span>
              </div>

              {/* Submission */}
              <div className="flex items-center h-8 rounded-lg px-2 gap-2 text-ink-2">
                <span className="size-4 shrink-0 flex items-center justify-center">
                  <SubmissionIcon size={15} />
                </span>
                <span className="flex-1 truncate">Submission</span>
              </div>
            </div>
          </div>

          {/* Footer with clock */}
          <div className="pt-3 mt-auto border-t border-border/70 shrink-0 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono font-medium text-ink tabular-nums">{clock}</span>
            </div>
            <span className="text-[10px] font-mono text-ink-3">IST</span>
          </div>
        </aside>
      )}

      {/* ── 2. INSET MAIN PANEL ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface border border-b-0 border-r-0 border-border rounded-tl-[16px] overflow-hidden">
        {/* Sticky Panel Header (72px) */}
        <header className="flex items-center justify-between h-[72px] px-8 border-b border-border bg-surface shrink-0">
          {/* Left: breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[13px] font-medium shrink-0 min-w-0" aria-label="Breadcrumb">
            <span className="text-ink-2">My rooms</span>
            <ChevronRight size={12} className="text-ink-3 shrink-0" />
            <span className="text-ink-2 truncate max-w-[180px]">{SHELL_FIXTURE.roomName}</span>
            <ChevronRight size={12} className="text-ink-3 shrink-0" />
            <span className="text-ink-2 shrink-0">{breadcrumb.group}</span>
            <ChevronRight size={12} className="text-ink-3 shrink-0" />
            <span className="text-ink font-semibold truncate">{breadcrumb.label}</span>
          </nav>

          {/* Center: search bar */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 w-[340px] h-9 px-3 rounded-full border border-border bg-card text-[13px] text-ink-2">
              <SearchIcon size={14} className="shrink-0 text-ink-2" />
              <span className="flex-1 text-left truncate">Search tasks, docs, rules</span>
              <KbdChip />
            </div>
          </div>

          {/* Right: Sound + Notifications + Readiness + Team avatars */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="size-8 rounded-full border border-border flex items-center justify-center text-ink-2">
              <Volume2 size={14} />
            </div>
            <div className="size-8 rounded-full border border-border flex items-center justify-center text-ink-2 relative">
              <Bell size={14} />
              <span className="absolute top-1 right-1 size-1.5 rounded-full bg-amber-500" />
            </div>

            {/* Readiness progress ring */}
            <div className="flex items-center gap-2 pl-2 border-l border-border/80">
              <div className="relative size-7 flex items-center justify-center">
                <svg className="size-7 -rotate-90" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="11" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                  <circle
                    cx="14"
                    cy="14"
                    r="11"
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth="2.5"
                    strokeDasharray={2 * Math.PI * 11}
                    strokeDashoffset={2 * Math.PI * 11 * (1 - avgReadiness / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-ink">
                  {avgReadiness}%
                </span>
              </div>
            </div>

            {/* Team avatars stack */}
            <div className="flex -space-x-1.5 pl-1">
              {SHELL_FIXTURE.members.map((member) => (
                <div
                  key={member.id}
                  className="size-7 rounded-full flex items-center justify-center font-bold text-[11px] border-2 border-surface text-ink-strong"
                  style={{ backgroundColor: member.color }}
                  title={`${member.name} (${member.role})`}
                >
                  {member.initials}
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* Page content scroll area */}
        <div className="flex-1 overflow-hidden bg-page">
          {children}
        </div>
      </main>
    </div>
  );
}
