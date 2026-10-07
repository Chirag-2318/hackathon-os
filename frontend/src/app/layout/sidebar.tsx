/**
 * C01 Sidebar — desktop shell
 * Source: design.md §3.1, PRD §3.2
 *
 * Floating dark rounded container, 248px expanded / 72px collapsed.
 * Two nav groups: Workspace + This room.
 * Bottom slot: upgrade card (workspace) or next-step callout (room).
 *
 * Navigation: uses React Router NavLink so clicking actually changes the URL
 * and the <Outlet /> renders the correct page. Active state is derived from
 * the URL, not from Zustand.
 */
import { cn } from 'cn';
import {
  Home, FolderOpen, BookOpen, Wrench, Briefcase, Settings,
  Eye, FileText, Users, ClipboardList,
  Lightbulb, Map, File,
  LayoutDashboard, Calendar, Rocket, Code, Globe, GitBranch,
  Presentation, Play, Send, CheckCircle,
  RotateCcw, BarChart2,
  ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { NavLink, useMatch, useResolvedPath } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { DarkCallout } from '@/components/primitives/dark-callout';
import { BlockerFAB } from '@/components/primitives/blocker-fab';
import { useSidebarStore } from './use-sidebar-store';
import { useOverlay } from '@/app/providers/overlay-store';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRoomOverview } from '@/api/client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

const TopCurve = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" className="absolute -top-[16px] right-0 pointer-events-none" style={{ fill: 'var(--canvas)' }}>
    <path d="M 16,0 L 16,16 L 0,16 A 16,16 0 0,0 16,0 Z" />
  </svg>
);
const BottomCurve = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" className="absolute -bottom-[16px] right-0 pointer-events-none" style={{ fill: 'var(--canvas)' }}>
    <path d="M 16,16 L 16,0 L 0,0 A 16,16 0 0,1 16,16 Z" />
  </svg>
);

// Helper to determine urgent callout
function useUrgentCallout(roomId: string | undefined, inRoom: boolean) {
  const { data: overview } = useQuery({
    queryKey: ['room-overview', roomId],
    queryFn: () => fetchRoomOverview(roomId!),
    enabled: inRoom && !!roomId,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  if (!overview) return null;

  const { decisionTimer, clockStrip, kpis } = overview;
  const tasksCount = parseInt(kpis.tasksOpen.value, 10) || 0;
  const freezeUnderHour = !clockStrip.freezeCrossed && !/[1-9]\d*h/.test(clockStrip.freezeInText);

  if (decisionTimer.decisionOpen) {
    return {
      title: 'Action required',
      description: `Vote closes in ${decisionTimer.timeRemaining}`,
      buttonLabel: 'Cast vote',
    };
  }

  if (clockStrip.lastHour) {
    return {
      title: 'Submission approaching',
      description: `Event ends in ${clockStrip.submitInText}. Verify links and checklist.`,
      buttonLabel: 'Go to Submit',
    };
  }

  if (freezeUnderHour && tasksCount > 0) {
    return {
      title: 'Freeze approaching',
      description: `Feature freeze in ${clockStrip.freezeInText}. ${tasksCount} tasks open.`,
      buttonLabel: 'Review tasks',
    };
  }

  if (clockStrip.freezeCrossed && tasksCount > 0) {
    return {
      title: 'Freeze crossed',
      description: `You have ${tasksCount} open tasks. Time to cut scope.`,
      buttonLabel: 'Cut scope',
    };
  }

  if (clockStrip.freezeCrossed && tasksCount === 0) {
    return {
      title: 'Freeze crossed',
      description: 'Zero open tasks. Move to polish and submission.',
      buttonLabel: 'Polish & Demo',
    };
  }

  if (kpis.checkpointsPassed.value !== kpis.checkpointsPassed.total) {
    return {
      title: 'Checkpoints pending',
      description: `${kpis.checkpointsPassed.value}/${kpis.checkpointsPassed.total} completed.`,
      buttonLabel: 'View checkpoints',
    };
  }

  if (tasksCount > 0) {
    return {
      title: 'Keep building',
      description: `${tasksCount} open tasks in this phase.`,
      buttonLabel: 'View board',
    };
  }

  return {
    title: 'On track',
    description: 'All tasks and checkpoints are complete.',
    buttonLabel: 'Review docs',
  };
}

// ── Nav items ────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
}

/** Absolute paths — navigate from anywhere in the app */
const workspaceItems: NavItem[] = [
  { label: 'Home',           icon: <Home className="size-5" />,       path: '/app/home' },
  { label: 'My rooms',       icon: <FolderOpen className="size-5" />, path: '/app/rooms' },
  { label: 'Playbooks',      icon: <BookOpen className="size-5" />,   path: '/app/playbooks' },
  { label: 'Tool directory', icon: <Wrench className="size-5" />,     path: '/app/tools' },
  { label: 'Portfolio',      icon: <Briefcase className="size-5" />,  path: '/app/portfolio' },
  { label: 'Settings',       icon: <Settings className="size-5" />,   path: '/app/settings' },
];

interface RoomGroup {
  title: string;
  items: NavItem[];
}

/** Path segments — prefixed with /app/room/:roomId/ at render time */
const roomGroups: RoomGroup[] = [
  {
    title: 'Set up',
    items: [
      { label: 'Overview',    icon: <Eye className="size-5" />,          path: 'overview' },
      { label: 'Brief',       icon: <FileText className="size-5" />,     path: 'brief' },
      { label: 'Team',        icon: <Users className="size-5" />,        path: 'team' },
      { label: 'Prep',        icon: <ClipboardList className="size-5" />, path: 'prep' },
      { label: 'Crowd Check', icon: <BarChart2 className="size-5" />,    path: 'crowd-check' },
    ],
  },
  {
    title: 'Decide',
    items: [
      { label: 'Ideate', icon: <Lightbulb className="size-5" />, path: 'ideate' },
      { label: 'Plan',   icon: <Map className="size-5" />,       path: 'plan' },
      { label: 'Docs',   icon: <File className="size-5" />,      path: 'docs' },
    ],
  },
  {
    title: 'Build',
    items: [
      { label: 'Board',    icon: <LayoutDashboard className="size-5" />, path: 'board' },
      { label: 'Schedule', icon: <Calendar className="size-5" />,        path: 'schedule' },
      { label: 'MVP',      icon: <Rocket className="size-5" />,          path: 'mvp' },
      { label: 'Code',     icon: <Code className="size-5" />,            path: 'github' },
      { label: 'APIs',     icon: <Globe className="size-5" />,           path: 'apis' },
      { label: 'Diagrams', icon: <GitBranch className="size-5" />,       path: 'diagrams' },
    ],
  },
  {
    title: 'Ship',
    items: [
      { label: 'Pitch',     icon: <Presentation className="size-5" />, path: 'pitch' },
      { label: 'Demo',      icon: <Play className="size-5" />,         path: 'demo' },
      { label: 'Submit',    icon: <Send className="size-5" />,         path: 'submit' },
      { label: 'Readiness', icon: <CheckCircle className="size-5" />,  path: 'readiness' },
    ],
  },
  {
    title: 'After',
    items: [
      { label: 'Retro', icon: <RotateCcw className="size-5" />, path: 'retro' },
    ],
  },
];

// ── Shared Transition ──────────────────────────────────────────────
const SIDEBAR_TRANSITION = "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

// ── SidebarItem ───────────────────────────────────────────────────

function SidebarItem({
  item,
  isCollapsed,
  to,
  index = 0,
  setActiveTop,
}: {
  item: NavItem;
  isCollapsed: boolean;
  to: string;
  index?: number;
  setActiveTop: (top: number) => void;
}) {
  const ref = React.useRef<HTMLAnchorElement>(null);
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end: true });

  React.useEffect(() => {
    if (match && ref.current) {
      setActiveTop(ref.current.offsetTop);
    }
  }, [match, setActiveTop, isCollapsed]);

  const link = (
    <NavLink
      ref={ref}
      to={to}
      className={({ isActive }) => cn(
        "group relative flex items-center h-10 w-full outline-none overflow-visible rounded-pill",
        isActive ? "text-sidebar-text font-semibold" : "text-sidebar-muted"
      )}
    >
      {({ isActive }) => (
        <>
          {/* Active pill background */}
          <div className={cn(
            "absolute inset-y-0 left-0 z-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isActive ? "bg-lav-500 opacity-100" : "bg-white/5 opacity-0 group-hover:opacity-100",
            isCollapsed ? "w-10 rounded-pill" : "w-full rounded-pill"
          )} />

          {/* Icon */}
          <div className={cn(
            "w-10 h-full flex items-center justify-center shrink-0 transition-colors duration-300 relative z-10",
            isActive ? "text-[#070707]" : "text-sidebar-muted group-hover:text-sidebar-text",
            !isActive && "group-focus-visible:ring-2 group-focus-visible:ring-lav-500 rounded-pill"
          )}>
            {item.icon}
          </div>
          
          {/* Text */}
          <div className="flex-1 overflow-hidden h-full flex items-center relative z-10">
            <span 
              className={cn(
                "text-body whitespace-nowrap truncate pr-4 transition-all duration-200",
                isActive ? "text-[#070707]" : "text-sidebar-text",
                isCollapsed ? "opacity-0 -translate-x-2 pointer-events-none" : "opacity-100 translate-x-0"
              )}
              style={{ transitionDelay: isCollapsed ? '0ms' : `${Math.min(index * 15, 150)}ms` }}
            >
              {item.label}
            </span>
          </div>
        </>
      )}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={120}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent 
          side="right" 
          sideOffset={28}
          className="rounded-[8px] bg-[#1c1c1e] text-white border border-white/10 shadow-lg px-3 py-1.5 text-sm animate-in fade-in slide-in-from-left-1 duration-150"
          hideWhenDetached
        >
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }
  return link;
}

// ── Section Divider / Header ─────────────────────────────────────

function SectionDivider({ isCollapsed, label }: { isCollapsed: boolean; label: string }) {
  return (
    <div className="relative h-7 flex items-center justify-center my-1.5">
      {/* Divider line for collapsed state */}
      <div className={cn(
        "absolute w-6 border-t border-white/10 transition-opacity duration-200",
        isCollapsed ? "opacity-100 delay-100" : "opacity-0 pointer-events-none"
      )} />
      
      {/* Label for expanded state */}
      <div className={cn(
        "absolute left-3 right-0 transition-opacity duration-200",
        isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100 delay-100"
      )}>
        <span className="text-caption text-sidebar-muted uppercase tracking-wider font-semibold whitespace-nowrap">
          {label}
        </span>
      </div>
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────

import { AlertCircle } from 'lucide-react';
import * as React from 'react';

export function Sidebar() {
  const { isCollapsed, toggleCollapsed, setContext } = useSidebarStore();
  const blockerOverlay = useOverlay('blocker-dialog');
  const [activeTop, setActiveTop] = React.useState<number | null>(null);

  // Derive room context from URL — no manual setActivePath needed
  const roomMatch = useMatch('/app/room/:roomId/*');
  const inRoom = !!roomMatch;
  const effectiveRoomId = roomMatch?.params.roomId ?? '';

  const urgentCallout = useUrgentCallout(effectiveRoomId, inRoom);

  React.useEffect(() => {
    setContext(inRoom ? 'room' : 'workspace');
  }, [inRoom, setContext]);

  return (
    <aside
      className={cn(
        'fixed left-2 top-2 bottom-2 z-40 rounded-panel bg-sidebar text-sidebar-text',
        SIDEBAR_TRANSITION,
        isCollapsed ? 'w-[64px]' : 'w-[220px]',
      )}
    >
      {/* Outer wrapper to extend right edge for overflow clipping */}
      <div className={cn(
         "absolute inset-y-0 left-0 flex flex-col pointer-events-none",
         SIDEBAR_TRANSITION,
         isCollapsed ? "w-[84px]" : "w-[220px]"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center px-2 shrink-0 pointer-events-auto">
          <button 
            onClick={toggleCollapsed}
            className={cn(
              "flex items-center h-[40px] overflow-hidden hover:bg-white/5 transition-colors cursor-pointer",
              SIDEBAR_TRANSITION,
              isCollapsed ? "w-[40px] rounded-[10px]" : "w-full rounded-[20px]"
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className="w-[40px] h-full flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-sidebar-text">H</span>
            </div>
            <span className={cn(
              "text-h3 font-bold text-sidebar-text whitespace-nowrap transition-all duration-200",
              isCollapsed ? "opacity-0 -translate-x-2 pointer-events-none" : "opacity-100 translate-x-0"
            )}>
              ackathon OS
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav 
          className={cn(
            "flex-[1_1_auto] min-h-0 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden flex flex-col pointer-events-auto",
            isCollapsed ? "pl-2 pr-2" : "px-2"
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* We need a full height wrapper to catch mouse wheel over empty space */}
          <div className="flex flex-col min-h-full w-full relative pt-5 gap-1 pb-4">
            
            {/* Workspace section */}
            <div className="flex flex-col">
              {!isCollapsed && (
                <div className="h-7 flex items-center px-2 mb-1">
                  <span className="text-caption text-sidebar-muted uppercase tracking-wider font-semibold whitespace-nowrap">
                    Workspace
                  </span>
                </div>
              )}
              {workspaceItems.map((item, i) => (
                <SidebarItem key={item.path} item={item} isCollapsed={isCollapsed} to={item.path} index={i} setActiveTop={setActiveTop} />
              ))}
            </div>

            {/* Room section */}
            {inRoom && effectiveRoomId && (
              <div className="flex flex-col mt-1">
                <SectionDivider isCollapsed={isCollapsed} label="This room" />
                
                {roomGroups.map((group, groupIdx) => (
                  <div key={group.title} className="flex flex-col">
                    {!isCollapsed && (
                      <div className="h-7 flex items-center px-2">
                        <span className="text-[10px] text-sidebar-muted/70 uppercase tracking-wider font-semibold whitespace-nowrap">
                          {group.title}
                        </span>
                      </div>
                    )}
                    {group.items.map((item, itemIdx) => (
                      <SidebarItem
                        key={item.path}
                        item={item}
                        to={`/app/room/${effectiveRoomId}/${item.path}`}
                        isCollapsed={isCollapsed}
                        index={groupIdx * 3 + itemIdx}
                        setActiveTop={setActiveTop}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Slot */}
        <div className={cn(
          "flex-[0_0_auto] m-4 flex justify-center pointer-events-auto border-t border-white/5 pt-4",
          isCollapsed ? "mx-2 border-t-0 pt-0" : "m-4"
        )}>
          {!inRoom ? (
            <div className={cn(
              "overflow-hidden bg-[#AEE6FF]",
              SIDEBAR_TRANSITION,
              isCollapsed ? "w-[40px] h-[40px] rounded-[10px]" : "w-full h-auto rounded-[20px]"
            )}>
              {isCollapsed ? (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <button className="w-[40px] h-[40px] flex items-center justify-center text-ink hover:bg-black/10 transition-colors">
                      <Rocket className="size-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="rounded-[10px] bg-sidebar text-sidebar-text border border-white/10">Go Pro</TooltipContent>
                </Tooltip>
              ) : (
                <div className="p-4 text-ink flex flex-col justify-center">
                  <p className="text-body-strong mb-1 whitespace-nowrap">Go Pro</p>
                  <p className="text-caption text-ink/70 mb-4 line-clamp-2 leading-relaxed">
                    Unlock AI planning and auto-scheduling.
                  </p>
                  <Button variant="outline" size="sm" className="w-full border-ink/20 text-ink bg-transparent hover:bg-black/5 rounded-pill">
                    Get Pro
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className={cn(
              "overflow-hidden",
              SIDEBAR_TRANSITION,
              isCollapsed ? "w-[40px] h-[40px]" : "w-full h-auto"
            )}>
              {isCollapsed ? (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={blockerOverlay.open}
                      className="w-[40px] h-[40px] flex items-center justify-center text-white bg-callout hover:bg-callout/90 transition-colors rounded-[10px]"
                    >
                      <AlertCircle className="size-5 text-pastel-peach" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="rounded-[10px] bg-sidebar text-sidebar-text border border-white/10">Report Blocker</TooltipContent>
                </Tooltip>
              ) : urgentCallout ? (
                <DarkCallout
                  title={urgentCallout.title}
                  description={urgentCallout.description}
                  buttonLabel={urgentCallout.buttonLabel}
                />
              ) : (
                <div className="flex justify-center w-full">
                  <BlockerFAB onClick={blockerOverlay.open} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
