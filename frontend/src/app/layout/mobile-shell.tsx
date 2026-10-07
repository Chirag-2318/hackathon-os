/**
 * Mobile shell (≤767px)
 * Source: design.md §3.3, PRD §3.5
 *
 * Simplified top bar + bottom tab bar (5 items) + sidebar-as-sheet.
 * Pink blocker FAB overlays the tab bar.
 * Right-rail content stacks below main (structural only).
 */
import { cn } from 'cn';
import {
  Zap, LayoutDashboard, Lightbulb, Send, MoreHorizontal,
  Clock, Bell,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { CountBadge } from '@/components/primitives/count-badge';
import { BlockerFAB } from '@/components/primitives/blocker-fab';
import { useOverlay } from '@/app/providers/overlay-store';
import { useSidebarStore } from './use-sidebar-store';
import { useState, type ReactNode } from 'react';

// ── Mobile Top Bar ──────────────────────────────────────────────

function MobileTopBar({ inRoom }: { inRoom: boolean }) {
  const roomFeed = useOverlay('room-feed');
  const { roomName } = useSidebarStore();

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-canvas border-b border-border shrink-0">
      <span className="text-body-strong truncate">
        {inRoom && roomName ? roomName : 'Hackathon OS'}
      </span>
      <div className="flex items-center gap-2">
        {inRoom && (
          <div className="flex items-center gap-1 h-7 px-2 rounded-pill bg-pastel-peach text-ink text-caption font-semibold">
            <Clock className="size-3" />
            <span className="tabular-nums">3h 20m</span>
          </div>
        )}
        <button
          onClick={roomFeed.open}
          className="relative flex items-center justify-center size-8 rounded-full hover:bg-surface-sunken text-ink-muted"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <span className="absolute -top-0.5 -right-0.5">
            <CountBadge count={3} variant="danger" />
          </span>
        </button>
      </div>
    </header>
  );
}

// ── Bottom Tab Bar ──────────────────────────────────────────────

interface TabItem {
  label: string;
  icon: ReactNode;
  id: string;
}

const tabs: TabItem[] = [
  { label: 'Now', icon: <Zap className="size-5" />, id: 'now' },
  { label: 'Board', icon: <LayoutDashboard className="size-5" />, id: 'board' },
  { label: 'Ideas', icon: <Lightbulb className="size-5" />, id: 'ideas' },
  { label: 'Ship', icon: <Send className="size-5" />, id: 'ship' },
  { label: 'More', icon: <MoreHorizontal className="size-5" />, id: 'more' },
];

function BottomTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  const blockerOverlay = useOverlay('blocker-dialog');

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex items-end justify-around bg-canvas border-t border-border pb-[env(safe-area-inset-bottom)] h-16">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-caption',
            activeTab === tab.id
              ? 'text-lav-600 font-bold'
              : 'text-ink-muted'
          )}
          aria-label={tab.label}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}

      {/* Pink blocker FAB — center-right, overlaying tab bar */}
      <BlockerFAB
        className="absolute -top-7 right-4 size-14 shadow-e3"
        onClick={blockerOverlay.open}
        aria-label="I'm blocked"
      />
    </nav>
  );
}

// ── Mobile Shell ────────────────────────────────────────────────

interface MobileShellProps {
  children: ReactNode;
  inRoom?: boolean;
  rightRail?: ReactNode;
}

export function MobileShell({ children, inRoom = false, rightRail }: MobileShellProps) {
  const [activeTab, setActiveTab] = useState('now');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (id: string) => {
    if (id === 'more') {
      setSidebarOpen(true);
    } else {
      setActiveTab(id);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <MobileTopBar inRoom={inRoom} />

      {/* Main content — with bottom padding for tab bar */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 py-4 flex flex-col gap-6">
        <div>
          {children}
        </div>

        {/* Right-rail content stacks below main as cards */}
        {rightRail && (
          <div className="flex flex-col gap-6" aria-label="Additional content">
            {rightRail}
          </div>
        )}
      </main>

      <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Sidebar as full-height sheet (opened from "More") */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[300px] bg-sidebar text-sidebar-text p-0">
          <div className="p-6">
            <h2 className="text-h2 text-sidebar-text mb-4">Menu</h2>
            <p className="text-body text-sidebar-muted">
              Full sidebar navigation content arrives when connected to routing.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
