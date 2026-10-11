/**
 * Speed Mode shell (S31 shell region only)
 * Source: design.md §3.4, PRD §3.6
 *
 * 72px icon rail, team avatars, pink blocker FAB.
 * Dark theme by default, compact density.
 * Page content is out of scope — shell region only.
 */
import { cn } from 'cn';
import { Zap, LayoutDashboard, FileText, MessageSquare } from 'lucide-react';
import { BlockerFAB } from '@/components/primitives/blocker-fab';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useOverlay } from '@/app/providers/overlay-store';
import { BackArrowIcon } from '@/components/icons';
import type { ReactNode } from 'react';

// ── Icon rail items ─────────────────────────────────────────────

const railItems = [
  { label: 'Focus', icon: <Zap className="size-5" />, id: 'focus' },
  { label: 'Board', icon: <LayoutDashboard className="size-5" />, id: 'board' },
  { label: 'Docs', icon: <FileText className="size-5" />, id: 'docs' },
  { label: 'Chat', icon: <MessageSquare className="size-5" />, id: 'chat' },
];

// ── Team avatars (placeholder) ──────────────────────────────────

const teamMembers = [
  { id: '1', initials: 'A', color: '#C4C5FC' },
  { id: '2', initials: 'S', color: '#B7D9FF' },
  { id: '3', initials: 'R', color: '#C9EF84' },
];

interface SpeedModeShellProps {
  children?: ReactNode;
}

export function SpeedModeShell({ children }: SpeedModeShellProps) {
  const blockerOverlay = useOverlay('blocker-dialog');

  return (
    <div className="dark density-compact min-h-screen bg-canvas flex">
      {/* Icon rail — 72px */}
      <aside className="w-[72px] shrink-0 flex flex-col items-center bg-sidebar border-r border-white/8 py-4 gap-2">
        {/* Exit speed mode button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                const match = window.location.pathname.match(/\/(?:room|speed-mode)\/([^/]+)/);
                if (match && match[1]) {
                  window.location.href = `/app/room/${match[1]}/overview`;
                } else {
                  window.location.href = '/app/rooms';
                }
              }}
              className="flex items-center justify-center size-10 rounded-control text-sidebar-muted hover:text-white hover:bg-white/10 transition-colors mb-2 cursor-pointer"
              aria-label="Exit speed mode"
              data-testid="exit-speed-mode"
            >
              <BackArrowIcon size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Exit speed mode</TooltipContent>
        </Tooltip>

        {/* Logo mark */}
        <div className="size-10 rounded-full bg-lav-500 flex items-center justify-center text-[#070707] text-label font-bold mb-4">
          H
        </div>

        {/* Rail nav items */}
        {railItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <button
                className="flex items-center justify-center size-10 rounded-control text-sidebar-muted hover:text-sidebar-text hover:bg-white/8 transition-colors"
                aria-label={item.label}
              >
                {item.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Team avatars with presence */}
        <div className="flex flex-col items-center gap-1.5 mb-3">
          {teamMembers.map((member) => (
            <Tooltip key={member.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <div
                    className="size-8 rounded-full flex items-center justify-center text-ink text-caption font-bold"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initials}
                  </div>
                  {/* Presence dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-pastel-lime border-2 border-sidebar" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Online</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Pink blocker FAB */}
        <BlockerFAB
          className={cn(
            'relative bottom-auto right-auto',
            'size-12 bg-accent-pink text-[#14151A]'
          )}
          onClick={blockerOverlay.open}
          aria-label="I'm blocked"
        />
      </aside>

      {/* Single-column focus content area */}
      <main className="flex-1 min-w-0 p-6 overflow-y-auto">
        {children ?? (
          <div className="flex items-center justify-center h-full text-ink-muted text-body">
            Speed Mode content arrives in a later phase.
          </div>
        )}
      </main>
    </div>
  );
}
