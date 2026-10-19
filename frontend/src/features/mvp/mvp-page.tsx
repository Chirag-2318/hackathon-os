import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mvpService } from '@/services/mvpService';
import { boardService } from '@/services/boardService';
import { roomService } from '@/services/roomService';
import type { MvpState, Task, RoomMember } from '@/services/types';
import { MvpPitchCard } from './components/mvp-pitch-card';
import { MvpCoreFlow } from './components/mvp-core-flow';
import { MvpRealityLedger } from './components/mvp-reality-ledger';
import { MvpHealthCard } from './components/mvp-health-card';
import { MvpJudgePrep } from './components/mvp-judge-prep';
import { MvpCutList } from './components/mvp-cut-list';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { computeMvpHealth } from '@/shared/lib/mvp-health';

export function MvpPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<MvpState | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    let mounted = true;

    Promise.all([
      mvpService.getMvpState(roomId),
      boardService.getBoard(roomId),
      roomService.getRoom(roomId),
    ]).then(([mvpData, boardData, roomData]) => {
      if (mounted) {
        setState(mvpData);
        setTasks(boardData.tasks || []);
        setMembers((roomData as any)?.members || boardData.members || []);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [roomId]);

  const triggerSavedFeedback = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1500);
  };

  const handleUpdate = async (patch: Partial<MvpState>) => {
    if (!roomId || !state) return;
    const nextState = { ...state, ...patch };
    setState(nextState);
    triggerSavedFeedback();
    await mvpService.saveMvpState(roomId, nextState);
  };

  const handleToggleHealth = async (key: keyof MvpState['health']) => {
    if (!state) return;
    const nextHealth = { ...state.health, [key]: !state.health[key] };
    await handleUpdate({ health: nextHealth });
  };

  if (loading || !state) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-36 w-full rounded-[24px]" />
        <Skeleton className="h-44 w-full rounded-[24px]" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Skeleton className="lg:col-span-7 h-80 rounded-[24px]" />
          <Skeleton className="lg:col-span-5 h-80 rounded-[24px]" />
        </div>
      </div>
    );
  }

  // Count checks
  const { done: healthChecksPassed, total: totalChecks, allPassed: allChecksPassed } = computeMvpHealth(state.health);

  return (
    <div className="flex flex-col gap-4 p-5 max-w-7xl mx-auto w-full min-h-full flex-1 bg-page">
      {/* 1. Header: title + chip "3 of 4 checks" */}
      <div className="flex items-center justify-between h-12 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-display font-normal tracking-tight text-foreground leading-none">
            MVP Studio
          </h1>
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border shrink-0 inline-flex items-center transition-colors',
              allChecksPassed
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            )}
          >
            {healthChecksPassed} of {totalChecks} checks
          </span>
        </div>

        {/* Small "Saved" gray text indicator for 1.5s */}
        <div className="h-5 flex items-center">
          {showSaved && (
            <span className="text-xs text-muted-foreground font-medium animate-in fade-in duration-200">
              Saved
            </span>
          )}
        </div>
      </div>

      {/* 2. PITCH card */}
      <MvpPitchCard
        identity={state.identity}
        wow={state.wow}
        onUpdate={handleUpdate}
      />

      {/* 3. CORE FLOW card */}
      <MvpCoreFlow
        steps={state.coreFlow}
        allTasks={tasks}
        onUpdateSteps={(coreFlow) => handleUpdate({ coreFlow })}
        onOpenTaskByKey={(key) => navigate(`/app/room/${roomId}/board?task=${key}`)}
      />

      {/* 4. Two Columns 7/5 Below */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT (7/12): REALITY LEDGER card */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <MvpRealityLedger
            ledger={state.ledger}
            members={members}
            allTasks={tasks}
            onUpdateLedger={(ledger) => handleUpdate({ ledger })}
            onOpenTaskByKey={(key) => navigate(`/app/room/${roomId}/board?task=${key}`)}
          />
        </div>

        {/* RIGHT (5/12): MVP HEALTH, JUDGE PREP, CUT LIST */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <MvpHealthCard
            health={state.health}
            onToggleHealth={handleToggleHealth}
          />

          <MvpJudgePrep
            differentiation={state.differentiation}
            breaksFirst={state.breaksFirst}
            onUpdate={handleUpdate}
          />

          <MvpCutList
            cutList={state.cutList}
            onUpdateCutList={(cutList) => handleUpdate({ cutList })}
          />
        </div>
      </div>
    </div>
  );
}
