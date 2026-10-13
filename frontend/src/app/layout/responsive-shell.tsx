/**
 * ResponsiveShell — selects desktop or mobile shell based on viewport.
 * Wraps the app content with the appropriate shell layout.
 */
import { useIsMobile } from '@/shared/hooks/use-media-query';
import { AppShell } from './app-shell';
import { MobileShell } from './mobile-shell';
import { useSidebarStore } from './use-sidebar-store';
import type { ReactNode } from 'react';

interface ResponsiveShellProps {
  children: ReactNode;
  showPhaseTrack?: boolean;
  pageName?: string;
  rightRail?: ReactNode;
}

export function ResponsiveShell({
  children,
  pageName = 'Home',
  rightRail,
}: ResponsiveShellProps) {
  const isMobile = useIsMobile();
  const context = useSidebarStore((s) => s.context);
  const inRoom = context === 'room';

  if (isMobile) {
    return <MobileShell inRoom={inRoom} rightRail={rightRail}>{children}</MobileShell>;
  }

  return (
    <AppShell pageName={pageName} rightRail={rightRail}>
      {children}
    </AppShell>
  );
}
