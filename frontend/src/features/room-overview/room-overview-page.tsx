import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useParams, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomService, checkpointService } from '@/services';
import { phaseService } from '@/services/phaseService';
import { PhaseRail } from '../board/components/phase-rail';
import { useTaskCounts } from '../board/task-selectors';
import { useRoomOverview } from './hooks/use-room-overview';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { OverviewHeader } from './components/overview-header';
import { OverviewStatStrip } from './components/overview-stat-strip';
import { OverviewNeedsAttention, type AttentionItemData } from './components/overview-needs-attention';
import { OverviewCheckpoints, type CheckpointData } from './components/overview-checkpoints';
import { OverviewMyTasks, type TaskItemData } from './components/overview-my-tasks';
import { OverviewRecentActivity, type ActivityEntryData } from './components/overview-recent-activity';
import { OverviewRightPanel } from './components/overview-right-panel';

function formatClockStatus(room: any, overview: any): string {
  if (room?.submittedAt || room?.status === 'SUBMITTED') {
    return 'Submitted';
  }

  const startStr = room?.eventStart || overview?.clock?.startsAt;
  const endStr = room?.eventEnd || overview?.clock?.endsAt;

  if (startStr) {
    const diffStartMs = new Date(startStr).getTime() - Date.now();
    if (diffStartMs > 0) {
      const d = Math.floor(diffStartMs / (24 * 3600 * 1000));
      const h = Math.floor((diffStartMs % (24 * 3600 * 1000)) / (3600 * 1000));
      return `Starts in ${d}d ${h}h`;
    }
  }

  if (endStr) {
    const diffEndMs = new Date(endStr).getTime() - Date.now();
    if (diffEndMs <= 0) {
      return 'Submitted';
    }
    if (diffEndMs <= 2 * 3600 * 1000) {
      return 'Feature freeze';
    }
  }

  const curHour = overview?.clock?.hourOfEvent ?? overview?.clock?.currentHour ?? 0;
  const totHours = overview?.clock?.totalHours ?? room?.durationHours ?? 36;
  return `Live, hour ${curHour} of ${totHours}`;
}

export function RoomOverviewPage() {
  const { roomId, id } = useParams<{ roomId?: string; id?: string }>();
  const activeRoomId = roomId || id || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();

  const outletContext = useOutletContext<{ setRightRail: (node: React.ReactNode) => void } | null>();
  React.useLayoutEffect(() => {
    if (outletContext?.setRightRail) {
      outletContext.setRightRail(null);
    }
  }, [outletContext]);

  // Primary Queries
  const {
    data: room,
    isLoading: isRoomLoading,
    isError: isRoomError,
    refetch: refetchRoom,
  } = useQuery({
    queryKey: ['room', activeRoomId],
    queryFn: () => roomService.getRoom(activeRoomId),
    enabled: Boolean(activeRoomId),
  });

  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    refetch: refetchOverview,
  } = useRoomOverview(activeRoomId);

  const { data: phasesData = [] } = useQuery({
    queryKey: ['phases', activeRoomId],
    queryFn: () => phaseService.getPhases(activeRoomId),
    enabled: Boolean(activeRoomId),
  });

  const passCheckpointMutation = useMutation({
    mutationFn: (cpId: string) => checkpointService.passCheckpoint(activeRoomId, cpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-overview', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['checkpoints', activeRoomId] });
    },
  });

  // Loading skeleton state
  if (isRoomLoading) {
    return (
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8 space-y-8 animate-pulse">
        <div className="h-14 bg-muted/40 rounded-[10px] w-2/5" />
        <div className="h-20 bg-muted/20 border-y border-border" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="h-28 bg-muted/20 rounded-[10px]" />
            <div className="h-44 bg-muted/20 rounded-[10px]" />
          </div>
          <div className="lg:col-span-4 h-96 bg-muted/20 rounded-[14px]" />
        </div>
      </div>
    );
  }

  if (isRoomError || !room) {
    return (
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center text-center space-y-4">
        <h2 className="font-display text-2xl text-foreground">Failed to load room overview</h2>
        <p className="text-sm text-muted-foreground">Unable to connect to the room workspace.</p>
        <button
          onClick={() => refetchRoom()}
          className="px-4 py-2 rounded-[8px] bg-inverse text-on-inverse text-xs font-medium cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // Real facts derivation
  const roomName = room.name || 'Hackathon Workspace';
  const stage = (room.stage || 'build').toLowerCase();
  const templateName = room.templateName || (room as any).template || 'Hackathon Sprint';
  const durationHours = room.durationHours || overview?.clock?.totalHours || 36;
  const clockStatusText = formatClockStatus(room, overview);

  const totalPhasesCount = phasesData.length || overview?.phases?.length || 0;
  const firstPhaseKey = phasesData[0]?.key || 'P1';
  const isBuildStage = stage === 'build';

  // Stat Strip Data
  const vitals = overview?.vitals;
  const taskCounts = useTaskCounts(activeRoomId);
  const passedCheckpoints = vitals?.checkpoints?.passed ?? 0;
  const totalCheckpoints = vitals?.checkpoints?.total ?? Math.max(1, overview?.checkpoints?.length ?? 1);
  const openTasksCount = taskCounts.total > 0 ? taskCounts.open : (vitals?.tasks?.open ?? 0);
  const todoCount = taskCounts.total > 0 ? taskCounts.todo : (vitals?.tasks?.todo ?? 0);
  const inProgressCount = taskCounts.total > 0 ? taskCounts.inProgress : (vitals?.tasks?.inProgress ?? 0);
  const blockedCount = taskCounts.total > 0 ? taskCounts.blocked : (vitals?.tasks?.blocked ?? 0);
  const deltaPct = vitals?.vsPlan?.deltaPct ?? overview?.progress?.deltaPct ?? 0;
  const actualPct = vitals?.vsPlan?.actualPct ?? overview?.progress?.actualPct ?? 0;
  const plannedPct = vitals?.vsPlan?.plannedPct ?? overview?.progress?.plannedPct ?? 0;
  const activeMembersCount = vitals?.team?.active ?? 1;
  const totalMembersCount = vitals?.team?.total ?? (overview?.team?.members?.length || 1);

  // Attention Items Data
  const attentionItems: AttentionItemData[] = (overview?.attention && Array.isArray(overview.attention))
    ? overview.attention.map((a: any) => ({
        id: a.id,
        dotColor: (a.priority === 'CRITICAL' ? 'red' : a.priority === 'WARNING' ? 'amber' : 'blue') as 'red' | 'amber' | 'blue',
        sentence: a.reason ? `${a.title}: ${a.reason}` : a.title,
        actionText: a.linkText || 'View',
        href: a.href || `/app/room/${activeRoomId}/board`,
      }))
    : [];

  // Checkpoints Data
  const checkpoints: CheckpointData[] = (overview?.checkpoints && overview.checkpoints.length > 0)
    ? overview.checkpoints.map((cp: any) => ({
        id: cp.id,
        label: cp.title || cp.label,
        status: (cp.status === 'passed' ? 'done' : cp.status === 'in_progress' ? 'current' : 'upcoming') as 'done' | 'current' | 'upcoming',
        timeLabel: cp.timeEstimate || cp.timeLabel || 'Phase exit',
      }))
    : [];

  // Tasks Data
  const myTasksList: TaskItemData[] = [
    ...(overview?.myTasks?.now || []).map((t: any) => ({
      id: t.id,
      key: t.key || t.id.slice(0, 5).toUpperCase(),
      title: t.summary || t.title,
      status: t.status || 'in progress',
      dueOrPhase: t.phaseKey || 'P1',
      isMine: true,
    })),
    ...(overview?.myTasks?.today || []).map((t: any) => ({
      id: t.id,
      key: t.key || t.id.slice(0, 5).toUpperCase(),
      title: t.summary || t.title,
      status: t.status || 'todo',
      dueOrPhase: t.phaseKey || 'P1',
      isMine: true,
    })),
    ...(overview?.myTasks?.later || []).map((t: any) => ({
      id: t.id,
      key: t.key || t.id.slice(0, 5).toUpperCase(),
      title: t.summary || t.title,
      status: t.status || 'todo',
      dueOrPhase: t.phaseKey || 'P2',
      isMine: true,
    })),
  ];

  // Recent Activity Data
  const recentActivities: ActivityEntryData[] = (overview?.recentActivity || []).map((a: any) => ({
    id: a.id,
    userId: a.userId,
    memberName: a.memberName || a.user?.name || 'Teammate',
    avatarUrl: a.avatarUrl || a.user?.avatarUrl,
    action: a.action || 'updated',
    object: a.object || a.targetTitle || 'task',
    relativeTime: a.relativeTime || 'recently',
  }));

  // Right Panel Data
  const projectRubric = (overview?.project?.rubric || []).map((r: any) => ({
    criterion: r.criterion || r.label,
    weight: r.weight || 20,
  }));

  const mvpChecks = overview?.project?.mvpHealth?.checks
    ? [
        { label: 'Runs without crashing', pass: Boolean(overview.project.mvpHealth.checks.runs) },
        { label: 'Stable core path', pass: Boolean(overview.project.mvpHealth.checks.stable) },
        { label: 'Clear 30s value', pass: Boolean(overview.project.mvpHealth.checks.clear30) },
        { label: '60s wow factor', pass: Boolean(overview.project.mvpHealth.checks.wow60) },
      ]
    : [
        { label: 'Runs without crashing', pass: true },
        { label: 'Stable core path', pass: true },
        { label: 'Clear value', pass: true },
        { label: 'Demo ready', pass: true },
      ];

  const teamMembers = (overview?.team?.members || []).map((m: any) => ({
    userId: m.userId || m.id,
    name: m.name || 'Member',
    username: m.username,
    avatarUrl: m.avatarUrl,
    role: m.role || 'Contributor',
    status: m.status || 'idle',
    isLeader: m.role?.toLowerCase() === 'leader',
  }));

  const workloadItems = (overview?.workload || []).map((w: any) => ({
    userId: w.userId,
    name: w.name || 'Member',
    avatarUrl: w.avatarUrl,
    confirmedHours: w.confirmedHours ?? (w.completedTasks || 0),
    openHours: w.openHours ?? (w.openTasks || 0),
  }));

  const skillCoverage = (overview?.team?.skillCoverage || []).map((s: any) => ({
    area: s.area || s.role,
    covered: Boolean(s.covered || (s.memberIds && s.memberIds.length > 0)),
  }));

  const progressChartData = {
    totalHours: overview?.clock?.totalHours || 36,
    nowHour: overview?.clock?.hourOfEvent ?? overview?.clock?.currentHour ?? 0,
    deltaPct: overview?.progress?.deltaPct ?? 0,
    actualPct: overview?.progress?.actualPct ?? 0,
    plannedPct: overview?.progress?.plannedPct ?? 0,
    plannedWaypoints: (overview?.progress?.plannedWaypoints || []).map((w: any) => ({
      hour: w.hour,
      pct: w.pct,
    })),
    actualWaypoints: (overview?.progress?.actualWaypoints || []).map((w: any) => ({
      hour: w.hour,
      pct: w.pct,
    })),
  };

  const stagger = shouldReduceMotion ? 0 : 0.024;

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8 space-y-8 bg-page text-foreground">
      {/* 1. Header (Banner + Room Name + Facts line + Actions) */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <OverviewHeader
          roomId={activeRoomId}
          roomName={roomName}
          stage={stage}
          templateName={templateName}
          durationHours={durationHours}
          clockStatusText={clockStatusText}
          hasPhases={phasesData.length > 0}
          totalPhasesCount={totalPhasesCount}
          firstPhaseKey={firstPhaseKey}
          isBuildStage={isBuildStage}
        />

        {/* 2. Phase rail directly under header if phases exist */}
        {phasesData.length > 0 && (
          <div className="mt-4">
            <PhaseRail
              phases={phasesData}
              selectedPhaseKey={null}
              onSelectPhase={(key) =>
                navigate(key ? `/app/room/${activeRoomId}/board?phase=${key}` : `/app/room/${activeRoomId}/board`)
              }
              size="small"
            />
          </div>
        )}

        {/* 2b. Slim row for the next action directly under the rail */}
        {room.nextStep && room.nextStep.label && (() => {
          const nextStep = room.nextStep;
          return (
            <div className="mt-2.5 flex items-center justify-between gap-3 px-3.5 py-2 rounded-[12px] bg-card border border-border text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                  Next up
                </span>
                {nextStep.reason && (
                  <>
                    <span className="text-muted-foreground/60 shrink-0">·</span>
                    <span className="text-muted-foreground truncate">
                      {nextStep.reason}
                    </span>
                  </>
                )}
              </div>

              <div className="shrink-0 flex items-center">
                {nextStep.leaderOnly && !room.isLeader ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(nextStep.route || `/app/room/${activeRoomId}/board`)}
                    className="h-7 px-3 rounded-full text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                  >
                    View
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => navigate(nextStep.route || `/app/room/${activeRoomId}/board`)}
                    className="h-7 px-3.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
                  >
                    {nextStep.label}
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </motion.div>

      {/* 3. Stat Strip (4 stats separated by hairlines above and below) */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: stagger * 1 }}
      >
        <OverviewStatStrip
          passedCheckpoints={passedCheckpoints}
          totalCheckpoints={totalCheckpoints}
          openTasksCount={openTasksCount}
          todoCount={todoCount}
          inProgressCount={inProgressCount}
          blockedCount={blockedCount}
          deltaPct={deltaPct}
          actualPct={actualPct}
          plannedPct={plannedPct}
          activeMembersCount={activeMembersCount}
          totalMembersCount={totalMembersCount}
        />
      </motion.div>

      {/* 4. Main Area (Two columns: 8 left / 4 right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN — 8 cols */}
        <div className="lg:col-span-8 space-y-8">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: stagger * 2 }}
            className="border-b border-border pb-8"
          >
            <OverviewNeedsAttention
              items={attentionItems}
              isLoading={isOverviewLoading}
              isError={isOverviewError}
              onRetry={refetchOverview}
            />
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: stagger * 3 }}
            className="border-b border-border pb-8"
          >
            <OverviewCheckpoints
              roomId={activeRoomId}
              checkpoints={checkpoints}
              onPassCheckpoint={(cpId) => passCheckpointMutation.mutate(cpId)}
              isLoading={isOverviewLoading}
              isError={isOverviewError}
              onRetry={refetchOverview}
            />
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: stagger * 4 }}
            className="border-b border-border pb-8"
          >
            <OverviewMyTasks
              roomId={activeRoomId}
              tasks={myTasksList}
              isLeader={room.isLeader}
              firstPhaseKey={firstPhaseKey}
              isLoading={isOverviewLoading}
              isError={isOverviewError}
              onRetry={refetchOverview}
            />
          </motion.div>

          {/* Desktop Activity (shown in left column on >= 1024px) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: stagger * 5 }}
            className="hidden lg:block"
          >
            <OverviewRecentActivity
              roomId={activeRoomId}
              activities={recentActivities}
              isLoading={isOverviewLoading}
              isError={isOverviewError}
              onRetry={refetchOverview}
            />
          </motion.div>
        </div>

        {/* RIGHT COLUMN — 4 cols (ONE continuous panel: Project, Team, Progress vs Plan) */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: stagger * 3 }}
          className="lg:col-span-4 space-y-8"
        >
          <OverviewRightPanel
            roomId={activeRoomId}
            roomCode={room.joinCode || (room as any).code || (room as any).inviteCode || activeRoomId.slice(0, 8).toUpperCase()}
            projectName={room.name || 'Hackathon Project'}
            projectDescription={room.description || overview?.project?.identity || 'Active workspace'}
            rubric={projectRubric}
            mvpChecks={mvpChecks}
            teamMembers={teamMembers}
            workload={workloadItems}
            skillCoverage={skillCoverage}
            progress={progressChartData}
          />

          {/* Mobile/Tablet Activity (shown after right panel on < 1024px to satisfy order) */}
          <div className="block lg:hidden border-t border-border pt-8">
            <OverviewRecentActivity
              roomId={activeRoomId}
              activities={recentActivities}
              isLoading={isOverviewLoading}
              isError={isOverviewError}
              onRetry={refetchOverview}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
