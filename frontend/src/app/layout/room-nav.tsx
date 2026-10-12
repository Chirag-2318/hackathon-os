import * as React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoomEvents } from '@/api/useRoomEvents';
import { useHome } from '@/features/home/hooks/use-home';
import { useRoomOverview } from '@/features/room-overview/hooks/use-room-overview';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  OverviewIcon,
  TeamIcon,
  SpeedModeIcon,
} from '@/components/icons';
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
import { useClock } from '@/shared/lib/clock';
import { RoomIdentity } from './room-identity';
import { JourneyRail } from './journey-rail';
import { RoomFooter } from './room-footer';

interface RoomNavProps {
  roomId: string;
  isCollapsed: boolean;
}

export function RoomNav({ roomId, isCollapsed }: RoomNavProps) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const clock = useClock();
  useRoomEvents(roomId);

  const { data: homeData } = useHome();
  const { data: overviewData } = useRoomOverview(roomId);

  const [unlockEarlyOpen, setUnlockEarlyOpen] = React.useState(false);

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

  const { data: navBadges } = useQuery({
    queryKey: ['nav-badges', roomId],
    queryFn: () => roomService.getNavBadges(roomId),
    refetchInterval: 60000,
  });

  // Heartbeat
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

  const isLeader = roomData ? (roomData as any).currentUserRole === 'leader' : true;
  const isBuildUnlocked = roomData
    ? roomData.stage === 'build' ||
      Boolean(roomData.stageDone?.plan) ||
      Boolean((roomData as any).planDone) ||
      Boolean((roomData as any).buildStartedAt)
    : true;

  // Prep progress
  const prepList = Array.isArray(prepData)
    ? prepData
    : Array.isArray((prepData as any)?.checklist)
    ? (prepData as any).checklist
    : [];
  const prepDone = (prepData as any)?.progress?.done ?? prepList.filter((p: any) => p.done).length;
  const prepTotal = (prepData as any)?.progress?.total ?? (prepList.length || 6);

  // Ideas count
  const ideaList = Array.isArray(ideasData)
    ? ideasData
    : Array.isArray((ideasData as any)?.ideas)
    ? (ideasData as any).ideas
    : Array.isArray((ideasData as any)?.items)
    ? (ideasData as any).items
    : [];
  const approvedIdeasCount = ideaList.filter((i: any) => i.status === 'approved').length;

  // Open tasks
  const openTasks = navBadges?.openTasks !== undefined
    ? String(navBadges.openTasks)
    : String(overviewData?.kpis?.tasksOpen?.value ?? '0');

  // Attention flags
  const githubHasAttention = Boolean((navBadges?.github ?? navBadges?.attentionCount ?? 0) > 0);

  // Room details
  const rooms = (homeData?.roomList ?? []).map((r: any) => ({
    id: r.id,
    title: r.name || r.title || 'Hackathon Workspace',
  }));

  const roomTitle = roomData?.name || rooms.find((r: any) => r.id === roomId)?.title || 'Hackathon Workspace';

  // Current subpath
  const currentSubPath = location.pathname.replace(`/app/room/${roomId}`, '').replace(/^\//, '') || 'overview';
  const isSpeedModeActive = location.pathname.startsWith(`/speed-mode/${roomId}`);

  // ── Primary Pinned Items (Overview, Team, Speed mode) ─────────────
  const renderPinnedItem = (
    id: string,
    label: string,
    path: string,
    icon: React.ReactNode,
    extraContent?: React.ReactNode
  ) => {
    const isActive = id === 'overview'
      ? currentSubPath === 'overview' || currentSubPath === ''
      : id === 'speed-mode'
      ? isSpeedModeActive
      : currentSubPath.startsWith(id);

    const content = (
      <Link
        to={path}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group relative flex items-center h-8 rounded-[8px] px-2 gap-2 w-full outline-none transition-colors duration-150 cursor-pointer text-[13px] font-medium select-none',
          isActive
            ? 'bg-active text-ink font-semibold'
            : 'text-ink-2 hover:bg-hover hover:text-ink active:scale-[0.99]'
        )}
      >
        {/* Active left 2px bar */}
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-ink" />
        )}

        <span className="size-4 shrink-0 flex items-center justify-center">
          {icon}
        </span>

        {!isCollapsed && <span className="flex-1 truncate">{label}</span>}

        {!isCollapsed && extraContent && (
          <div className="shrink-0 ml-auto flex items-center">{extraContent}</div>
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={id} delayDuration={100}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }

    return <div key={id}>{content}</div>;
  };

  return (
    <div className="flex flex-col h-full min-h-0 select-none">
      {/* 1. Room Identity Block */}
      <RoomIdentity
        roomId={roomId}
        roomTitle={roomTitle}
        stage={roomData?.stage}
        isCollapsed={isCollapsed}
        rooms={rooms}
        clockData={overviewData?.clock}
        currentSubPath={currentSubPath}
      />

      {/* 2. Primary Items (Overview, Team, Speed mode) */}
      <div className="flex flex-col gap-0.5 pb-2 mb-1.5 border-b border-border/70 shrink-0">
        {renderPinnedItem(
          'overview',
          'Overview',
          `/app/room/${roomId}/overview`,
          <OverviewIcon size={16} />
        )}
        {renderPinnedItem(
          'team',
          'Team',
          `/app/room/${roomId}/team`,
          <TeamIcon size={16} />
        )}
        {/* Speed mode with bolt icon and On/Off pill */}
        {renderPinnedItem(
          'speed-mode',
          'Speed mode',
          `/speed-mode/${roomId}`,
          <SpeedModeIcon size={16} className={isSpeedModeActive ? 'text-amber-500' : undefined} />,
          <span
            className={cn(
              'px-1.5 py-0.2 rounded-full text-[10px] font-semibold tabular-nums border transition-colors',
              isSpeedModeActive
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'bg-muted/50 border-border/40 text-ink-3'
            )}
          >
            {isSpeedModeActive ? 'On' : 'Off'}
          </span>
        )}
      </div>

      {/* 3. The Journey (replaces blunt accordions with tree rail) */}
      <JourneyRail
        roomId={roomId}
        currentSubPath={currentSubPath}
        isCollapsed={isCollapsed}
        roomData={roomData}
        overviewData={overviewData}
        prepDone={prepDone}
        prepTotal={prepTotal}
        approvedIdeasCount={approvedIdeasCount}
        openTasks={openTasks}
        isBuildUnlocked={isBuildUnlocked}
        githubHasAttention={githubHasAttention}
        isLeader={isLeader}
        onUnlockEarlyRequest={() => setUnlockEarlyOpen(true)}
      />

      {/* 4. "Next Up" Footer */}
      <RoomFooter
        roomId={roomId}
        isCollapsed={isCollapsed}
        clock={clock}
        roomData={roomData}
        overviewData={overviewData}
      />

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
