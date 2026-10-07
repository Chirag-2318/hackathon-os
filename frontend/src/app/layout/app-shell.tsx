/**
 * AppShell — main desktop layout grid
 * Source: design.md §3.1, PRD §3.1
 *
 * CSS grid: sidebar + topbar + phase track + content + right rail.
 * No entrance animation on first paint (choreography rule 8).
 * max-width 1440px on main content. 12-col grid, 24px gutters.
 */
import { cn } from 'cn';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { PhaseTrack } from './phase-track';
import { useSidebarStore } from './use-sidebar-store';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  /** Show Phase Track (room pages only) */
  showPhaseTrack?: boolean;
  /** Current page name for breadcrumb */
  pageName?: string;
  /** Content for the right rail */
  rightRail?: ReactNode;
}

export function AppShell({
  children,
  showPhaseTrack = false,
  pageName = 'Home',
  rightRail,
}: AppShellProps) {
  const { isCollapsed, context } = useSidebarStore();
  const inRoom = context === 'room';
  const sidebarWidth = isCollapsed ? 64 : 220;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Sidebar — fixed position, not in grid flow */}
      <Sidebar />

      {/* Main area — offset by sidebar width + margins */}
      <div
        className="flex flex-col min-h-screen transition-[margin-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ marginLeft: `${sidebarWidth + 20}px` }}
      >
        {/* Top bar */}
        <TopBar inRoom={inRoom} pageName={pageName} />

        {/* Phase Track — room pages only */}
        {showPhaseTrack && inRoom && <PhaseTrack />}

        {/* Main content area */}
        <main className="flex-1 flex">
          {/* Content with max-width */}
          <div
            className={cn(
              'flex-1 min-w-0 p-5 w-full',
            )}
          >
            {/* 12-column grid available for page content */}
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12">
                {children}
              </div>
            </div>
          </div>

          {/* Right rail slot */}
          {rightRail && (
            <aside
              className="hidden xl:flex flex-col gap-5 w-[300px] shrink-0 border-l border-border p-5"
              aria-label="Right rail"
            >
              {rightRail}
            </aside>
          )}
        </main>
      </div>
    </div>
  );
}
