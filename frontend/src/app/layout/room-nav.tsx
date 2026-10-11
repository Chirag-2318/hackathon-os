import * as React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoomEvents } from '@/api/useRoomEvents';
import { motion, AnimatePresence } from 'framer-motion';
import { useHome } from '@/features/home/hooks/use-home';
import { useRoomOverview } from '@/features/room-overview/hooks/use-room-overview';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { isModuleHidden } from '@/config/featureFlags';
import {
  BackArrowIcon,
  OverviewIcon,
  TeamIcon,
  SpeedModeIcon,
  PrepIcon,
  BriefIcon,
  IdeateIcon,
  CrowdCheckIcon,
  PlanIcon,
  BoardIcon,
  ScheduleIcon,
  MvpStudioIcon,
  DocsIcon,
  GithubIcon,
  ApiHubIcon,
  DiagramsIcon,
  PitchDeckIcon,
  RehearseIcon,
  QaIcon,
  DemoIcon,
  SubmissionIcon,
  ReadinessIcon,
  RetroIcon,
  GroupChevronIcon,
} from '@/components/icons';
import { InvitePopover } from '@/features/room/invite-popover';
import { ChevronDown, Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { roomService, planService, ideaService, prepService } from '@/services';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface RoomNavProps {
  roomId: string;
  isCollapsed: boolean;
}

interface NavItemDef {
  id: string;
  label: string;
  path: string;
  icon: (props: { size: number; className?: string }) => React.ReactNode;
  badge?: () => React.ReactNode;
  state?: 'done' | 'current' | 'upcoming';
}

interface NavGroupDef {
  id: string;
  label: string;
  icon: (props: { size: number; className?: string }) => React.ReactNode;
  phaseMatch: string[]; // Phases that match this group
  items: NavItemDef[];
}

export function RoomNav({ roomId, isCollapsed }: RoomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useRoomEvents(roomId);
  const { data: homeData } = useHome();
  const { data: overviewData } = useRoomOverview(roomId);

  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const [unlockEarlyOpen, setUnlockEarlyOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { data: roomData } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomService.getRoom(roomId),
  });
  const { data: ideasData = [] } = useQuery({
    queryKey: ['ideas', roomId],
    queryFn: () => ideaService.listIdeas(roomId),
  });
  const { data: prepData = [] } = useQuery({
    queryKey: ['prep', roomId],
    queryFn: () => prepService.getPrepItems(roomId),
  });

  const isLeader = roomData ? (roomData as any).currentUserRole === 'leader' : true;
  const isBuildUnlocked = roomData ? roomData.stage === 'build' : true;
  const prepDone = prepData.filter((p: any) => p.done).length;
  const prepTotal = prepData.length || 6;
  const approvedIdeasCount = ideasData.filter((i: any) => i.status === 'approved').length;

  // Room details
  const rooms = homeData?.roomList ?? [];
  const currentRoom = rooms.find((r: any) => r.id === roomId) ?? {
    id: roomId,
    title: roomData?.name || 'Hackathon Workspace',
    meta: { name: homeData?.user?.firstName || 'Builder' },
  };

  const roomTitle = currentRoom.title;
  const initials = (roomTitle || 'Room')
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0] || '')
    .join('')
    .toUpperCase();

  const { data: navBadges } = useQuery({
    queryKey: ['nav-badges', roomId],
    queryFn: () => roomService.getNavBadges(roomId),
    refetchInterval: 60000,
  });

  React.useEffect(() => {
    if (!roomId) return;
    const sendBeat = () => {
      if (document.visibilityState === 'visible') {
        roomService.sendHeartbeat(roomId).catch(() => {});
      }
    };
    sendBeat();
    const interval = setInterval(sendBeat, 60000);
    return () => clearInterval(interval);
  }, [roomId]);

  // Overview metrics
  const timeLeft = overviewData?.kpis?.timeLeft ?? (overviewData?.clock?.formattedRemaining || '');
  const openTasks = navBadges?.openTasks !== undefined
    ? String(navBadges.openTasks)
    : (overviewData?.kpis?.tasksOpen?.value ?? '0');
  const currentPhase = 'Polish'; // Default or from overview

  // Determine active sub-path
  const currentSubPath = location.pathname.replace(`/app/room/${roomId}`, '').replace(/^\//, '') || 'overview';

  // Check if GitHub has attention items
  const githubHasAttention = Boolean((navBadges?.github ?? navBadges?.attentionCount ?? 0) > 0);

  // ── Groups definition ───────────────────────────────────────────
  const GROUPS: NavGroupDef[] = React.useMemo(() => {
    const rawGroups: NavGroupDef[] = [
      {
        id: 'PLAN',
        label: 'Plan',
        icon: ({ size, className }) => <PlanIcon size={size} className={className} />,
        phaseMatch: ['Before', 'Plan'],
        items: [
          {
            id: 'prep',
            label: 'Prep',
            path: `/app/room/${roomId}/prep`,
            icon: (p) => <PrepIcon {...p} />,
            badge: () => <span className="text-[10px] text-ink-3 font-mono">{prepDone}/{prepTotal}</span>,
          },
          {
            id: 'brief',
            label: 'Brief',
            path: `/app/room/${roomId}/brief`,
            icon: (p) => <BriefIcon {...p} />,
            state: roomData?.stageDone?.brief ? 'done' : roomData?.stage === 'brief' ? 'current' : 'upcoming',
          },
          {
            id: 'ideate',
            label: 'Ideate',
            path: `/app/room/${roomId}/ideate`,
            icon: (p) => <IdeateIcon {...p} />,
            state: roomData?.stageDone?.ideate ? 'done' : roomData?.stage === 'ideate' ? 'current' : 'upcoming',
            badge: approvedIdeasCount > 0 ? () => (
              <span className="px-1.5 py-0.2 rounded-full bg-surface border border-border text-[10px] font-semibold text-ink tabular-nums">
                {approvedIdeasCount}
              </span>
            ) : undefined,
          },
          {
            id: 'crowd-check',
            label: 'Crowd check',
            path: `/app/room/${roomId}/crowd-check`,
            icon: (p) => <CrowdCheckIcon {...p} />,
            state: roomData?.stageDone?.crowd ? 'done' : roomData?.stage === 'crowd' ? 'current' : 'upcoming',
          },
          {
            id: 'plan',
            label: 'Plan',
            path: `/app/room/${roomId}/plan`,
            icon: (p) => <PlanIcon {...p} />,
            state: roomData?.stageDone?.plan ? 'done' : roomData?.stage === 'plan' ? 'current' : 'upcoming',
          },
        ],
      },
      {
        id: 'BUILD',
        label: 'Build',
        icon: ({ size, className }) => <BoardIcon size={size} className={className} />,
        phaseMatch: ['Build', 'Freeze'],
        items: [
          {
            id: 'board',
            label: 'Board',
            path: `/app/room/${roomId}/board`,
            icon: (p) => <BoardIcon {...p} />,
            badge: () => (
              <span className="px-1.5 py-0.2 rounded-full bg-surface border border-border text-[10px] font-semibold text-ink tabular-nums">
                {openTasks}
              </span>
            ),
          },
          {
            id: 'schedule',
            label: 'Schedule',
            path: `/app/room/${roomId}/schedule`,
            icon: (p) => <ScheduleIcon {...p} />,
          },
          {
            id: 'mvp',
            label: 'MVP studio',
            path: `/app/room/${roomId}/mvp`,
            icon: (p) => <MvpStudioIcon {...p} />,
          },
          {
            id: 'docs',
            label: 'Docs',
            path: `/app/room/${roomId}/docs`,
            icon: (p) => <DocsIcon {...p} />,
          },
        ],
      },
      {
        id: 'TECH',
        label: 'Tech',
        icon: ({ size, className }) => <GithubIcon size={size} className={className} />,
        phaseMatch: ['Build'],
        items: [
          {
            id: 'github',
            label: 'GitHub',
            path: `/app/room/${roomId}/github`,
            icon: (p) => <GithubIcon {...p} />,
            badge: () =>
              githubHasAttention ? (
                <span
                  className="size-2 rounded-full bg-amber-500 shrink-0"
                  title="Attention items exist"
                />
              ) : null,
          },
          {
            id: 'apis',
            label: 'API hub',
            path: `/app/room/${roomId}/apis`,
            icon: (p) => <ApiHubIcon {...p} />,
          },
          {
            id: 'diagrams',
            label: 'Diagrams',
            path: `/app/room/${roomId}/diagrams`,
            icon: (p) => <DiagramsIcon {...p} />,
          },
        ],
      },
      {
        id: 'PRESENT',
        label: 'Present',
        icon: ({ size, className }) => <PitchDeckIcon size={size} className={className} />,
        phaseMatch: ['Polish', 'Submit'],
        items: [
          {
            id: 'pitch/deck',
            label: 'Pitch deck',
            path: `/app/room/${roomId}/pitch/deck`,
            icon: (p) => <PitchDeckIcon {...p} />,
          },
          {
            id: 'pitch/rehearse',
            label: 'Rehearse',
            path: `/app/room/${roomId}/pitch/rehearse`,
            icon: (p) => <RehearseIcon {...p} />,
          },
          {
            id: 'pitch/qa',
            label: 'Q&A',
            path: `/app/room/${roomId}/pitch/qa`,
            icon: (p) => <QaIcon {...p} />,
          },
          {
            id: 'demo',
            label: 'Demo',
            path: `/app/room/${roomId}/demo`,
            icon: (p) => <DemoIcon {...p} />,
          },
          {
            id: 'submission',
            label: 'Submission',
            path: `/app/room/${roomId}/submission`,
            icon: (p) => <SubmissionIcon {...p} />,
            badge: () => (
              <span
                className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0"
                title="Deadline approaching"
              />
            ),
          },
        ],
      },
      {
        id: 'REVIEW',
        label: 'Review',
        icon: ({ size, className }) => <ReadinessIcon size={size} className={className} />,
        phaseMatch: ['After', 'Review'],
        items: [
          {
            id: 'readiness',
            label: 'Readiness',
            path: `/app/room/${roomId}/readiness`,
            icon: (p) => <ReadinessIcon {...p} />,
          },
          {
            id: 'retro',
            label: 'Retro',
            path: `/app/room/${roomId}/retro`,
            icon: (p) => <RetroIcon {...p} />,
          },
        ],
      },
    ];
    return rawGroups.map((g) => ({
      ...g,
      items: g.items.filter((item) => !isModuleHidden(item.id)),
    }));
  }, [roomId, openTasks, roomData?.stage, roomData?.stageDone, approvedIdeasCount]);

  // Find which group contains the current route
  const activeGroupId = React.useMemo(() => {
    for (const group of GROUPS) {
      if (group.items.some((item) => currentSubPath.startsWith(item.id))) {
        return group.id;
      }
    }
    return 'PLAN';
  }, [GROUPS, currentSubPath]);

  // Accordion open state: ONE open at a time; auto-opens group containing active route
  const [openGroup, setOpenGroup] = React.useState<string>(activeGroupId);

  React.useEffect(() => {
    setOpenGroup(activeGroupId);
  }, [activeGroupId]);

  // Scroll active item into view
  React.useEffect(() => {
    const activeEl = scrollRef.current?.querySelector('[aria-current="page"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [location.pathname]);

  // Phase hint check
  const isPhaseGroup = (group: NavGroupDef) => {
    // Current phase is 'Polish' -> maps to PRESENT
    return group.phaseMatch.includes(currentPhase);
  };

  // Switch room while preserving current sub-section
  const handleRoomSwitch = (targetRoomId: string) => {
    setSwitcherOpen(false);
    if (targetRoomId === roomId) return;
    navigate(`/app/room/${targetRoomId}/${currentSubPath}`);
  };

  // ── 1. Room Header (about 80px) ─────────────────────────────────
  const roomHeader = (
    <div className="flex flex-col gap-1.5 mb-2 pb-2.5 border-b border-border/70 shrink-0">
      {/* Row 1: All rooms back button */}
      {!isCollapsed ? (
        <Link
          to="/app/rooms"
          className="group flex items-center gap-1.5 text-xs font-medium text-ink-2 hover:text-ink transition-colors w-fit px-1 py-0.5 rounded cursor-pointer"
        >
          <BackArrowIcon size={14} className="text-ink-3 group-hover:text-ink" />
          <span>All rooms</span>
        </Link>
      ) : (
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Link
              to="/app/rooms"
              className="group flex items-center justify-center size-8 rounded-md hover:bg-hover text-ink-2 hover:text-ink transition-colors mx-auto"
            >
              <BackArrowIcon size={16} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">All rooms</TooltipContent>
        </Tooltip>
      )}

      {/* Row 2: Room avatar + Room name dropdown + user-plus invite button */}
      {!isCollapsed ? (
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {/* Room switcher dropdown popover */}
          <Popover open={switcherOpen} onOpenChange={setSwitcherOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left p-1 rounded-[var(--r-control)] hover:bg-hover transition-colors cursor-pointer group"
                aria-label="Switch room"
              >
                <div className="size-8 rounded-xl bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[14px] font-semibold text-ink leading-tight truncate">
                      {roomTitle}
                    </span>
                    <ChevronDown className="size-3.5 text-ink-3 shrink-0 group-hover:text-ink transition-colors" />
                  </div>
                  <p className="text-[12px] text-ink-2 truncate leading-tight mt-0.5">
                    Polish · {timeLeft}
                  </p>
                </div>
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              sideOffset={4}
              className="w-[260px] p-2 rounded-[18px] bg-card border border-border shadow-xl font-[var(--font-inter)] z-50"
            >
              <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3 border-b border-border/50">
                Your rooms
              </div>
              <div className="flex flex-col gap-0.5 mt-1 max-h-48 overflow-y-auto">
                {rooms.map((r: any) => {
                  const isCurrent = r.id === roomId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleRoomSwitch(r.id)}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer',
                        isCurrent ? 'bg-active font-semibold text-ink' : 'hover:bg-hover text-ink-2 hover:text-ink'
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="size-6 rounded-lg bg-surface border border-border text-[10px] font-bold flex items-center justify-center shrink-0">
                          {r.title?.slice(0, 2).toUpperCase() || 'RM'}
                        </div>
                        <span className="truncate">{r.title}</span>
                      </div>
                      {isCurrent && <Check className="size-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Invite user-plus button */}
          <InvitePopover roomId={roomId} />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <div className="size-8 rounded-xl bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
            {initials}
          </div>
          <InvitePopover roomId={roomId} />
        </div>
      )}
    </div>
  );

  // ── 2. Pinned Items (36px rows, always visible) ─────────────────
  const PINNED_ITEMS: NavItemDef[] = [
    {
      id: 'overview',
      label: 'Overview',
      path: `/app/room/${roomId}/overview`,
      icon: (p) => <OverviewIcon {...p} />,
    },
    {
      id: 'team',
      label: 'Team',
      path: `/app/room/${roomId}/team`,
      icon: (p) => <TeamIcon {...p} />,
    },
    {
      id: 'speed-mode',
      label: 'Speed mode',
      path: `/speed-mode/${roomId}`,
      icon: (p) => <SpeedModeIcon {...p} />,
      badge: () => (
        <span
          className="size-2 rounded-full bg-blue-500 pulse-dot shrink-0"
          title="Crunch time active"
        />
      ),
    },
  ];

  const renderNavRow = (item: NavItemDef, isPinned: boolean = false, isLocked: boolean = false) => {
    const isActive =
      item.id === 'overview'
        ? currentSubPath === 'overview' || currentSubPath === ''
        : currentSubPath.startsWith(item.id);

    const handleClick = (e: React.MouseEvent) => {
      if (isLocked) {
        e.preventDefault();
        e.stopPropagation();
        toast('Unlocks when the plan is complete', {
          action: {
            label: 'Go to Plan',
            onClick: () => navigate(`/app/room/${roomId}/plan`),
          },
          cancel: isLeader
            ? {
                label: 'Unlock early',
                onClick: () => setUnlockEarlyOpen(true),
              }
            : undefined,
        });
      }
    };

    const rowContent = (
      <Link
        to={item.path}
        onClick={handleClick}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group relative flex items-center rounded-[var(--r-control)] px-2.5 gap-2.5 w-full outline-none transition-colors duration-[150ms] cursor-pointer text-[14px] leading-[20px] font-medium',
          isPinned ? 'h-9' : 'h-[34px]',
          isActive ? 'bg-active text-ink font-semibold' : 'text-ink-2 hover:bg-hover hover:text-ink active:scale-[0.99]',
          item.id === 'speed-mode' && !isActive && 'text-blue-700',
          isLocked && 'opacity-60'
        )}
      >
        {/* Active shared highlight indicator */}
        {isActive && (
          <motion.div
            layoutId="room-nav-active-pill"
            className="absolute inset-0 rounded-[var(--r-control)] bg-active -z-10"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}

        {/* Icon */}
        <span
          className={cn(
            'shrink-0 flex items-center justify-center size-5',
            item.id === 'speed-mode' && 'text-blue-600'
          )}
        >
          {item.icon({ size: 18, className: isActive ? 'text-ink' : 'text-ink-2 group-hover:text-ink' })}
        </span>

        {/* Label */}
        {!isCollapsed && (
          <span className="flex-1 truncate">{item.label}</span>
        )}

        {/* Optional Badge & State */}
        {!isCollapsed && (
          <div className="shrink-0 flex items-center gap-1.5 ml-auto">
            {item.badge && item.badge()}
            {item.state === 'done' && (
              <span className="size-4 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center">
                <Check className="size-2.5 stroke-[3]" />
              </span>
            )}
            {item.state === 'current' && (
              <span className="size-2 rounded-full bg-blue-600 animate-pulse" />
            )}
          </div>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.id} delayDuration={100}>
          <TooltipTrigger asChild>{rowContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.id}>{rowContent}</div>;
  };

  // ── Collapsed Sidebar: One Icon per Group with Flyout ────────────
  if (isCollapsed) {
    return (
      <div className="flex flex-col gap-2 h-full">
        {roomHeader}

        {/* Pinned Icons */}
        <div className="flex flex-col gap-1.5 pb-2 border-b border-border/50">
          {PINNED_ITEMS.map((item) => renderNavRow(item, true))}
        </div>

        {/* Group Icons with Flyout Popovers */}
        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {GROUPS.map((group) => {
            const isGroupActive = group.items.some((i) => currentSubPath.startsWith(i.id));
            const isGroupLocked = group.id !== 'PLAN' && !isBuildUnlocked;
            return (
              <Popover key={group.id}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      'group relative flex items-center justify-center size-8 rounded-[var(--r-control)] transition-colors cursor-pointer mx-auto',
                      isGroupActive ? 'bg-active text-ink font-semibold' : 'text-ink-2 hover:bg-hover hover:text-ink',
                      isGroupLocked && 'opacity-60'
                    )}
                    aria-label={group.label}
                  >
                    {group.icon({ size: 18 })}
                    {isPhaseGroup(group) && (
                      <span className="absolute top-1 right-1 size-1.5 rounded-full bg-blue-500" />
                    )}
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  side="right"
                  sideOffset={12}
                  className="w-[220px] p-2 rounded-[20px] bg-card border border-border shadow-xl font-[var(--font-inter)] z-50"
                >
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3 border-b border-border/50 mb-1">
                    <span>{group.label}</span>
                    {isGroupLocked && <Lock className="size-3 text-ink-3" />}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      return renderNavRow(item, false, isGroupLocked);
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Expanded Sidebar: Full Accordions ─────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0">
      {roomHeader}

      {/* Pinned section (Overview, Team, Speed mode) */}
      <div className="flex flex-col gap-1 pb-2 mb-2 border-b border-border/70 shrink-0">
        {PINNED_ITEMS.map((item) => renderNavRow(item, true))}
      </div>

      {/* Scrollable Accordion Groups with hidden scrollbar and fade masks */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 12px, black calc(100% - 12px), transparent 100%)',
        }}
      >
        {GROUPS.map((group) => {
          const isOpen = openGroup === group.id;
          const hasPhaseHint = isPhaseGroup(group);
          const isGroupLocked = group.id !== 'PLAN' && !isBuildUnlocked;

          return (
            <div key={group.id} className="flex flex-col">
              {/* Group Header (height 32) */}
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? '' : group.id)}
                aria-expanded={isOpen}
                className={cn(
                  'flex items-center justify-between h-8 px-2.5 rounded-[var(--r-control)] transition-colors cursor-pointer text-ink-3 hover:text-ink hover:bg-hover/60',
                  isOpen && 'text-ink font-semibold',
                  isGroupLocked && 'opacity-60'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {group.label}
                  </span>
                  {hasPhaseHint && (
                    <span
                      className="size-1.5 rounded-full bg-blue-500 shrink-0"
                      title="Current phase"
                    />
                  )}
                  {isGroupLocked ? (
                    <Lock className="size-3 text-ink-3 shrink-0" />
                  ) : (
                    <span className="text-[10px] px-1 rounded bg-surface border border-border text-ink-3 tabular-nums">
                      {group.items.length}
                    </span>
                  )}
                </div>

                <GroupChevronIcon
                  size={12}
                  isOpen={isOpen}
                  className="text-ink-3 transition-transform duration-200"
                />
              </button>

              {/* Accordion Content with Height & Stagger animation */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden flex flex-col gap-0.5 pl-0.5 py-0.5"
                  >
                    {group.items.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.025, duration: 0.2 }}
                      >
                        {renderNavRow(item, false, isGroupLocked)}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Unlock Early Confirm Dialog */}
      <Dialog open={unlockEarlyOpen} onOpenChange={setUnlockEarlyOpen}>
        <DialogContent className="max-w-[400px] rounded-[24px] p-6 bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Skip planning?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              You can still finish the plan later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setUnlockEarlyOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                await planService.unlockBuild(roomId);
                queryClient.invalidateQueries({ queryKey: ['room', roomId] });
                queryClient.invalidateQueries({ queryKey: ['rooms'] });
                queryClient.invalidateQueries({ queryKey: ['home'] });
                setUnlockEarlyOpen(false);
                setOpenGroup('BUILD');
                toast.success('Build phase unlocked early!');
              }}
              className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 font-semibold"
            >
              Unlock early
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
