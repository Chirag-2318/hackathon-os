import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, Lock, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  PlanIcon,
  BoardIcon,
  GithubIcon,
  PitchDeckIcon,
  ReadinessIcon,
  PrepIcon,
  BriefIcon,
  IdeateIcon,
  CrowdCheckIcon,
  ScheduleIcon,
  MvpStudioIcon,
  DocsIcon,
  ApiHubIcon,
  DiagramsIcon,
  RehearseIcon,
  SubmissionIcon,
  RetroIcon,
} from '@/components/icons';
import { isModuleHidden } from '@/config/featureFlags';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type GroupState = 'done' | 'current' | 'upcoming' | 'locked';

export interface JourneyRailProps {
  roomId: string;
  currentSubPath: string;
  isCollapsed: boolean;
  roomData?: any;
  overviewData?: any;
  prepDone: number;
  prepTotal: number;
  approvedIdeasCount: number;
  openTasks: string;
  isBuildUnlocked: boolean;
  githubHasAttention: boolean;
  isLeader?: boolean;
  onUnlockEarlyRequest: () => void;
}

interface JourneyItemDef {
  id: string;
  label: string;
  path: string;
  icon: (props: { size: number; className?: string }) => React.ReactNode;
  badge?: () => React.ReactNode;
  isDone?: boolean;
  hasAttention?: boolean;
}

interface JourneyGroupDef {
  id: string;
  label: string;
  icon: (props: { size: number; className?: string }) => React.ReactNode;
  state: GroupState;
  unlockRequirement?: string;
  progressText?: string | null;
  hasAttentionDot?: boolean;
  items: JourneyItemDef[];
}

export function JourneyRail({
  roomId,
  currentSubPath,
  isCollapsed,
  roomData,
  overviewData,
  prepDone,
  prepTotal,
  approvedIdeasCount,
  openTasks,
  isBuildUnlocked,
  githubHasAttention,
  isLeader,
  onUnlockEarlyRequest,
}: JourneyRailProps) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const storageKey = `hackathon_os_journey_expanded_${roomId}`;

  const stage = (roomData?.stage || 'brief').toLowerCase();
  const stageDone = roomData?.stageDone || {};

  // ── Calculate Group States and Progress ─────────────────────────────
  const groups: JourneyGroupDef[] = React.useMemo(() => {
    // 1. PLAN Group
    const planStepsDone = [stageDone.brief, stageDone.ideate, stageDone.crowd, stageDone.plan].filter(Boolean).length;
    const planItems: JourneyItemDef[] = [
      {
        id: 'prep',
        label: 'Prep',
        path: `/app/room/${roomId}/prep`,
        icon: (p: any) => <PrepIcon {...p} />,
        badge: () => <span className="text-[10px] text-ink-3 font-mono">{prepDone}/{prepTotal}</span>,
      },
      {
        id: 'brief',
        label: 'Brief',
        path: `/app/room/${roomId}/brief`,
        icon: (p: any) => <BriefIcon {...p} />,
        isDone: Boolean(stageDone.brief),
      },
      {
        id: 'ideate',
        label: 'Ideate',
        path: `/app/room/${roomId}/ideate`,
        icon: (p: any) => <IdeateIcon {...p} />,
        isDone: Boolean(stageDone.ideate),
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
        icon: (p: any) => <CrowdCheckIcon {...p} />,
        isDone: Boolean(stageDone.crowd),
      },
      {
        id: 'plan',
        label: 'Plan',
        path: `/app/room/${roomId}/plan`,
        icon: (p: any) => <PlanIcon {...p} />,
        isDone: Boolean(stageDone.plan),
      },
    ].filter((item) => !isModuleHidden(item.id));

    const isSampleRoom = roomId === 'sample-room';
    const planGroupActive = ['brief', 'ideate', 'plan', 'prep', 'crowd-check'].some(s => currentSubPath.startsWith(s));
    const buildGroupActive = ['board', 'schedule', 'mvp', 'docs'].some(s => currentSubPath.startsWith(s));
    const techGroupActive = ['github', 'apis', 'diagrams'].some(s => currentSubPath.startsWith(s));
    const presentGroupActive = ['deck', 'pitch', 'pitch-kit', 'submission'].some(s => currentSubPath.startsWith(s));
    const reviewGroupActive = ['readiness', 'summary', 'retro'].some(s => currentSubPath.startsWith(s));

    const isPlanDone = isBuildUnlocked || Boolean(stageDone.plan) || ['build', 'freeze', 'polish', 'submit', 'review'].includes(stage);
    const isPlanCurrent = ['brief', 'ideate', 'plan', 'crowd', 'before'].includes(stage) && !isPlanDone;
    const planState: GroupState = isSampleRoom
      ? (planGroupActive ? 'current' : 'done')
      : (isPlanDone ? 'done' : isPlanCurrent ? 'current' : 'upcoming');

    // 2. BUILD Group
    const vitalsTasks = overviewData?.vitals?.tasks;
    const tasksDone = vitalsTasks?.done ?? 0;
    const tasksTotal = vitalsTasks?.total ?? 0;
    const buildProgress = tasksTotal > 0 ? `${tasksDone}/${tasksTotal}` : null;

    const isBuildDone = ['polish', 'deck', 'pitch', 'submit', 'submitted', 'review'].includes(stage);
    const isBuildCurrent = ['build', 'freeze'].includes(stage);
    const buildState: GroupState = isSampleRoom
      ? (buildGroupActive ? 'current' : (techGroupActive || presentGroupActive || reviewGroupActive ? 'done' : 'upcoming'))
      : (!isBuildUnlocked
      ? 'locked'
      : isBuildDone
      ? 'done'
      : isBuildCurrent
      ? 'current'
      : 'upcoming');

    const buildItems: JourneyItemDef[] = [
      {
        id: 'board',
        label: 'Board',
        path: `/app/room/${roomId}/board`,
        icon: (p: any) => <BoardIcon {...p} />,
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
        icon: (p: any) => <ScheduleIcon {...p} />,
      },
      {
        id: 'mvp',
        label: 'MVP studio',
        path: `/app/room/${roomId}/mvp`,
        icon: (p: any) => <MvpStudioIcon {...p} />,
      },
      {
        id: 'docs',
        label: 'Docs',
        path: `/app/room/${roomId}/docs`,
        icon: (p: any) => <DocsIcon {...p} />,
      },
    ].filter((item) => !isModuleHidden(item.id));

    // 3. TECH Group
    const techState: GroupState = isSampleRoom
      ? (techGroupActive ? 'current' : (presentGroupActive || reviewGroupActive ? 'done' : 'upcoming'))
      : (!isBuildUnlocked
      ? 'locked'
      : ['submit', 'submitted', 'review'].includes(stage)
      ? 'done'
      : ['build', 'freeze', 'polish'].includes(stage)
      ? 'current'
      : 'upcoming');

    const techItems: JourneyItemDef[] = [
      {
        id: 'github',
        label: 'GitHub',
        path: `/app/room/${roomId}/github`,
        icon: (p: any) => <GithubIcon {...p} />,
        hasAttention: githubHasAttention,
      },
      {
        id: 'apis',
        label: 'API hub',
        path: `/app/room/${roomId}/apis`,
        icon: (p: any) => <ApiHubIcon {...p} />,
      },
      {
        id: 'diagrams',
        label: 'Diagrams',
        path: `/app/room/${roomId}/diagrams`,
        icon: (p: any) => <DiagramsIcon {...p} />,
      },
    ].filter((item) => !isModuleHidden(item.id));

    // 4. PRESENT Group
    const isPresentDone = ['submit', 'submitted', 'review'].includes(stage);
    const isPresentCurrent = ['polish', 'deck', 'pitch', 'rehearse'].includes(stage);
    const presentState: GroupState = isSampleRoom
      ? (presentGroupActive ? 'current' : (reviewGroupActive ? 'done' : 'upcoming'))
      : (isPresentDone ? 'done' : isPresentCurrent ? 'current' : 'upcoming');

    const presentItems: JourneyItemDef[] = [
      {
        id: 'deck',
        label: 'Deck',
        path: `/app/room/${roomId}/deck`,
        icon: (p: any) => <PitchDeckIcon {...p} />,
      },
      {
        id: 'pitch-kit',
        label: 'Pitch kit',
        path: `/app/room/${roomId}/pitch-kit`,
        icon: (p: any) => <RehearseIcon {...p} />,
      },
      {
        id: 'submission',
        label: 'Submission',
        path: `/app/room/${roomId}/submission`,
        icon: (p: any) => <SubmissionIcon {...p} />,
        hasAttention: stage === 'polish' || stage === 'submit',
      },
    ].filter((item) => !isModuleHidden(item.id));

    // 5. REVIEW Group
    const isReviewDone = stage === 'ended';
    const isReviewCurrent = ['review', 'after'].includes(stage);
    const reviewState: GroupState = isSampleRoom
      ? (reviewGroupActive ? 'current' : 'upcoming')
      : (isReviewDone ? 'done' : isReviewCurrent ? 'current' : 'upcoming');

    const reviewItems: JourneyItemDef[] = [
      {
        id: 'readiness',
        label: 'Readiness',
        path: `/app/room/${roomId}/readiness`,
        icon: (p: any) => <ReadinessIcon {...p} />,
      },
      {
        id: 'summary',
        label: 'Summary',
        path: `/app/room/${roomId}/summary`,
        icon: (p: any) => <RetroIcon {...p} />,
      },
      {
        id: 'retro',
        label: 'Retro',
        path: `/app/room/${roomId}/retro`,
        icon: (p: any) => <RetroIcon {...p} />,
      },
    ].filter((item) => !isModuleHidden(item.id));

    return [
      {
        id: 'PLAN',
        label: 'Plan',
        icon: ({ size, className }) => <PlanIcon size={size} className={className} />,
        state: planState,
        progressText: `${planStepsDone}/${planItems.length}`,
        items: planItems,
      },
      {
        id: 'BUILD',
        label: 'Build',
        icon: ({ size, className }) => <BoardIcon size={size} className={className} />,
        state: buildState,
        unlockRequirement: 'Unlocks after Plan is validated',
        progressText: buildProgress,
        items: buildItems,
      },
      {
        id: 'TECH',
        label: 'Tech',
        icon: ({ size, className }) => <GithubIcon size={size} className={className} />,
        state: techState,
        unlockRequirement: 'Unlocks after Plan is validated',
        progressText: null,
        items: techItems,
      },
      {
        id: 'PRESENT',
        label: 'Present',
        icon: ({ size, className }) => <PitchDeckIcon size={size} className={className} />,
        state: presentState,
        unlockRequirement: 'Unlocks during Polishing phase',
        hasAttentionDot: true,
        progressText: null,
        items: presentItems,
      },
      {
        id: 'REVIEW',
        label: 'Review',
        icon: ({ size, className }) => <ReadinessIcon size={size} className={className} />,
        state: reviewState,
        unlockRequirement: 'Unlocks after hackathon ends',
        progressText: null,
        items: reviewItems,
      },
    ];
  }, [
    roomId,
    stage,
    stageDone,
    isBuildUnlocked,
    overviewData?.vitals?.tasks,
    openTasks,
    prepDone,
    prepTotal,
    approvedIdeasCount,
    githubHasAttention,
  ]);

  // Find which group contains current active sub-path
  const activeGroupId = React.useMemo(() => {
    for (const g of groups) {
      if (g.items.some((item) => currentSubPath.startsWith(item.id))) {
        return g.id;
      }
    }
    const currentG = groups.find((g) => g.state === 'current');
    return currentG?.id || 'PLAN';
  }, [groups, currentSubPath]);

  // Accordion open state: default to current/active group, remember manual in localStorage
  const [openGroup, setOpenGroup] = React.useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return activeGroupId;
  });

  // Auto-expand group containing active route if route changes
  React.useEffect(() => {
    if (activeGroupId && (roomId === 'sample-room' || openGroup !== activeGroupId)) {
      setOpenGroup(activeGroupId);
    }
  }, [activeGroupId, roomId]);

  const handleToggleGroup = (groupId: string, isLocked: boolean) => {
    if (isLocked) {
      toast('Unlocks when the plan is complete', {
        action: {
          label: 'Go to Plan',
          onClick: () => navigate(`/app/room/${roomId}/plan`),
        },
        cancel: isLeader
          ? {
              label: 'Unlock early',
              onClick: onUnlockEarlyRequest,
            }
          : undefined,
      });
      return;
    }

    const next = openGroup === groupId ? '' : groupId;
    setOpenGroup(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // ignore
    }
  };

  // Node 20px circle glyph on the rail
  const renderNodeGlyph = (state: GroupState) => {
    switch (state) {
      case 'done':
        return (
          <span className="size-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shadow-2xs z-10">
            <Check className="size-2.5 stroke-[2.5]" />
          </span>
        );
      case 'current':
        return (
          <span className="size-5 rounded-full ring-2 ring-blue-500 bg-background flex items-center justify-center shadow-2xs z-10">
            <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
          </span>
        );
      case 'locked':
        return (
          <span className="size-5 rounded-full border border-border/80 bg-muted/60 text-ink-3 flex items-center justify-center z-10">
            <Lock className="size-2.5" />
          </span>
        );
      case 'upcoming':
      default:
        return (
          <span className="size-5 rounded-full border border-border/80 bg-background text-ink-3 z-10" />
        );
    }
  };

  // ── Collapsed icon-only view ────────────────────────────────────────
  if (isCollapsed) {
    return (
      <div className="relative flex flex-col items-center gap-3 py-2 flex-1 overflow-y-auto">
        {/* Continuous 1px vertical rail */}
        <div className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-[1px] bg-border/60 pointer-events-none" />

        {groups.map((group) => {
          const isLocked = group.state === 'locked';
          const isGroupActive = group.items.some((i) => currentSubPath.startsWith(i.id));

          return (
            <Popover key={group.id}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'relative size-8 rounded-[var(--r-control)] flex items-center justify-center transition-all cursor-pointer z-10',
                    isGroupActive
                      ? 'bg-active text-ink font-semibold'
                      : 'text-ink-2 hover:bg-hover hover:text-ink',
                    isLocked && 'opacity-60 cursor-not-allowed'
                  )}
                  aria-label={`${group.label} (${group.state})`}
                >
                  {renderNodeGlyph(group.state)}
                </button>
              </PopoverTrigger>

              <PopoverContent
                side="right"
                sideOffset={12}
                className="w-[200px] p-2 rounded-[18px] bg-card border border-border shadow-xl font-[var(--font-inter)] z-50"
              >
                <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3 border-b border-border/50 mb-1">
                  <span>{group.label}</span>
                  {group.progressText && (
                    <span className="font-mono text-[10px] text-ink-2" style={{ fontFamily: 'var(--font-mono)' }}>
                      {group.progressText}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const isActive = currentSubPath.startsWith(item.id);
                    return (
                      <Link
                        key={item.id}
                        to={isLocked ? '#' : item.path}
                        data-tour={`nav-${item.id === 'pitch-kit' ? 'pitch' : item.id}`}
                        onClick={(e) => {
                          if (isLocked) {
                            e.preventDefault();
                            handleToggleGroup(group.id, true);
                          }
                        }}
                        className={cn(
                          'flex items-center gap-2 h-7 px-2 rounded-md text-xs transition-colors',
                          isActive ? 'bg-active font-semibold text-ink' : 'text-ink-2 hover:bg-hover hover:text-ink',
                          isLocked && 'opacity-50 pointer-events-none'
                        )}
                      >
                        <span className="size-4 shrink-0 flex items-center justify-center">{item.icon({ size: 14 })}</span>
                        <span className="truncate flex-1">{item.label}</span>
                        {item.isDone && <Check className="size-2.5 text-emerald-600" />}
                      </Link>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    );
  }

  // ── Expanded Tree-Rail View ─────────────────────────────────────────
  return (
    <div className="relative flex flex-col gap-1 flex-1 overflow-y-auto pr-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none">
      {/* 1px Vertical Rail down the left (aligned with the 20px nodes) */}
      <div className="absolute top-4 bottom-4 left-[13px] w-[1px] bg-border/60 pointer-events-none" />

      {groups.map((group) => {
        const isOpen = openGroup === group.id;
        const isLocked = group.state === 'locked';

        return (
          <div key={group.id} className="relative flex flex-col">
            {/* Group Header Row */}
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleToggleGroup(group.id, isLocked)}
                  aria-expanded={isOpen}
                  aria-disabled={isLocked}
                  className={cn(
                    'group relative flex items-center justify-between h-8 pl-1 pr-2 rounded-[8px] transition-colors cursor-pointer outline-none',
                    'hover:bg-hover/60 focus-visible:ring-2 focus-visible:ring-ink',
                    isOpen && 'bg-hover/40 text-ink font-semibold',
                    isLocked && 'opacity-65 cursor-not-allowed hover:bg-transparent'
                  )}
                >
                  {/* Left: 20px Circle Node on the rail + Group label */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0 size-5 flex items-center justify-center">
                      {renderNodeGlyph(group.state)}
                    </div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-ink truncate leading-tight">
                      {group.label}
                    </span>
                  </div>

                  {/* Right: Progress text (in font-mono) / Attention dot / Chevron */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    {group.hasAttentionDot && (
                      <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" title="Needs attention" />
                    )}
                    {group.progressText && !isLocked && (
                      <span
                        className="text-[10px] text-ink-3 font-mono tabular-nums leading-none"
                        style={{ fontFamily: 'var(--font-mono, monospace)' }}
                      >
                        {group.progressText}
                      </span>
                    )}
                    {!isLocked && (
                      <ChevronRight
                        className={cn(
                          'size-3 text-ink-3 transition-transform duration-200',
                          isOpen && 'rotate-90 text-ink'
                        )}
                      />
                    )}
                  </div>
                </button>
              </TooltipTrigger>
              {isLocked && group.unlockRequirement && (
                <TooltipContent side="right" className="text-xs">
                  {group.unlockRequirement}
                </TooltipContent>
              )}
            </Tooltip>

            {/* Tree Branch Content: Spring Height + Child Stagger */}
            <AnimatePresence initial={false}>
              {isOpen && !isLocked && (
                <motion.div
                  key="branch"
                  initial={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="relative overflow-hidden flex flex-col gap-0.5 ml-[13px] pl-3 py-1"
                >
                  {/* Tree branch connector lines for children */}
                  <div className="absolute top-0 bottom-3 left-0 w-[1px] bg-border/60 pointer-events-none" />

                  {group.items.map((item, idx) => {
                    const isActive = currentSubPath.startsWith(item.id);

                    return (
                      <motion.div
                        key={item.id}
                        initial={prefersReducedMotion ? {} : { opacity: 0, x: -4 }}
                        animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.18 }}
                        className="relative"
                      >
                        {/* Tree elbow branch to each child */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-[1px] bg-border/60 pointer-events-none" />

                        <Link
                          to={item.path}
                          data-tour={`nav-${item.id === 'pitch-kit' ? 'pitch' : item.id}`}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'group relative flex items-center h-8 px-2 rounded-[8px] gap-2 w-full outline-none transition-colors duration-150 cursor-pointer text-[13px] font-medium',
                            isActive
                              ? 'bg-active text-ink font-semibold'
                              : 'text-ink-2 hover:bg-hover hover:text-ink active:scale-[0.99]'
                          )}
                        >
                          {/* 2px Left Accent Bar on Active */}
                          {isActive && (
                            <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-ink" />
                          )}

                          {/* Icon with hover animation */}
                          <span className="size-4 shrink-0 flex items-center justify-center">
                            {item.icon({
                              size: 15,
                              className: isActive ? 'text-ink' : 'text-ink-2 group-hover:text-ink',
                            })}
                          </span>

                          {/* Label */}
                          <span className="flex-1 truncate">{item.label}</span>

                          {/* Status Glyphs on Right */}
                          <div className="shrink-0 flex items-center gap-1.5 ml-auto">
                            {item.badge && item.badge()}
                            {item.isDone && (
                              <span className="size-3.5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                <Check className="size-2 stroke-[3]" />
                              </span>
                            )}
                            {item.hasAttention && (
                              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" title="Needs attention" />
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
