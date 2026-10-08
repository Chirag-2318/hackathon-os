/**
 * AppShell — redesigned desktop frame (Section 4.1 / Section 8.2)
 *
 * Layout: h-dvh flex-row, sidebar + inset panel.
 * Panel: mt-2 (8px), bg-surface, 1px border, 16px top-left/right radius, internal scroll.
 * No top bar at shell level — PanelHeader lives inside the panel.
 */
import { cn } from 'cn';
import { AppSidebar } from './sidebar';
import { PanelHeader } from './top-bar';
import { PhaseTrack } from './phase-track';
import { useSidebarStore } from './use-sidebar-store';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  showPhaseTrack?: boolean;
  pageName?: string;
  rightRail?: ReactNode;
}

export function AppShell({
  children,
  showPhaseTrack = false,
  pageName = 'Home',
  rightRail,
}: AppShellProps) {
  const { context } = useSidebarStore();
  const inRoom = context === 'room';

  return (
    <div className="flex h-dvh overflow-hidden bg-shell">
      {/* Fixed-width sidebar — never scrolls */}
      <AppSidebar />

      {/* Inset main panel — scrolls internally */}
      <main
        className={cn(
          'flex-1 flex flex-col min-w-0',
          'mt-2 bg-surface',
          'border border-b-0 border-r-0 border-border',
          'rounded-tl-[16px] rounded-tr-[16px]',
          'overflow-y-auto panel-scroll',
        )}
        data-testid="panel"
      >
        {/* Sticky header inside the panel */}
        <PanelHeader pageName={pageName} inRoom={inRoom} />

        {/* Phase Track — room pages only */}
        {showPhaseTrack && inRoom && <PhaseTrack />}

        {/* Page content */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 min-w-0">
            {children}
          </div>
          {/* Right rail slot */}
          {rightRail && (
            <aside
              className="hidden xl:flex flex-col gap-5 w-[320px] shrink-0 border-l border-border p-6 overflow-y-auto"
              aria-label="Right rail"
            >
              {rightRail}
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
