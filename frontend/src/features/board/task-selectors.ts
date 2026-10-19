import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { boardService } from '@/services/boardService';
import type { Task } from '@/services/types';

export interface PhaseTaskCounts {
  total: number;
  confirmed: number;
  awaitingLeader: number;
  inProgress: number;
  todo: number;
  dropped: number;
}

export interface DerivedTaskCounts {
  total: number;
  open: number;
  todo: number;
  inProgress: number;
  done: number;
  confirmed: number;
  awaitingLeader: number;
  needsConfirmation: number;
  blocked: number;
  unassigned: number;
  dueToday: number;
  byPhase: Record<string, PhaseTaskCounts>;
}

export function selectTaskCounts(tasks: Task[] = []): DerivedTaskCounts {
  let total = 0;
  let open = 0;
  let todo = 0;
  let inProgress = 0;
  let done = 0;
  let confirmed = 0;
  let awaitingLeader = 0;
  let blocked = 0;
  let unassigned = 0;
  let dueToday = 0;

  const byPhase: Record<string, PhaseTaskCounts> = {};

  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;

  for (const t of tasks) {
    if (t.status === 'dropped') {
      const pKey = (t.phaseKey || t.phaseId || 'P1').toUpperCase();
      if (!byPhase[pKey]) {
        byPhase[pKey] = { total: 0, confirmed: 0, awaitingLeader: 0, inProgress: 0, todo: 0, dropped: 0 };
      }
      byPhase[pKey].total++;
      byPhase[pKey].dropped++;
      continue;
    }

    total++;
    const isDone = t.status === 'done';
    const isConf = isDone && (t.reviewState === 'CONFIRMED' || Boolean(t.confirmedAt));
    const isAwaiting = isDone && !isConf;

    if (isDone) {
      done++;
      if (isConf) {
        confirmed++;
      } else {
        awaitingLeader++;
      }
    } else {
      open++;
      if (t.status === 'inprogress') {
        inProgress++;
      } else {
        todo++;
      }
    }

    if (t.flagged || Boolean(t.blockedReason) || Boolean(t.isBlocked)) {
      blocked++;
    }

    if (!t.assigneeId) {
      unassigned++;
    }

    if (t.dueAt) {
      const diff = new Date(t.dueAt).getTime() - now;
      if (diff >= 0 && diff <= dayMs) {
        dueToday++;
      }
    }

    const pKey = (t.phaseKey || t.phaseId || 'P1').toUpperCase();
    if (!byPhase[pKey]) {
      byPhase[pKey] = { total: 0, confirmed: 0, awaitingLeader: 0, inProgress: 0, todo: 0, dropped: 0 };
    }
    byPhase[pKey].total++;
    if (isConf) byPhase[pKey].confirmed++;
    else if (isAwaiting) byPhase[pKey].awaitingLeader++;
    else if (t.status === 'inprogress') byPhase[pKey].inProgress++;
    else byPhase[pKey].todo++;
  }

  return {
    total,
    open,
    todo,
    inProgress,
    done,
    confirmed,
    awaitingLeader,
    needsConfirmation: awaitingLeader,
    blocked,
    unassigned,
    dueToday,
    byPhase,
  };
}

export function useTasksQuery(roomId?: string, phasesUpdatedAt?: string) {
  return useQuery<Task[]>({
    queryKey: ['tasks', roomId, phasesUpdatedAt],
    queryFn: () => (roomId ? boardService.getTasks(roomId) : Promise.resolve([])),
    enabled: Boolean(roomId),
  });
}

export function useTaskCounts(roomId?: string, phasesUpdatedAt?: string): DerivedTaskCounts {
  const { data: tasks = [] } = useTasksQuery(roomId, phasesUpdatedAt);
  return useMemo(() => selectTaskCounts(tasks), [tasks]);
}
