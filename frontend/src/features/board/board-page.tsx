import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { boardService } from '@/services/boardService';
import { roomService } from '@/services/roomService';
import { phaseService, type PhaseSummary } from '@/services/phaseService';
import type { Task, BoardPhase, RoomMember, TaskStatus } from '@/services/types';

import { BoardHeader } from './components/board-header';
import { BoardFilterBar, type BoardFilterState, type GroupByOption } from './components/board-filter-bar';
import { BoardColumn } from './components/board-column';
import { BoardSwimlanes } from './components/board-swimlanes';
import { BoardListView } from './components/board-list-view';
import { CreateTaskModal } from './create-task-modal';
import { TaskDetailModal } from './task-detail-modal';
import { PhaseRail } from './components/phase-rail';
import { PhaseHeaderRow } from './components/phase-header-row';
import { PhaseGenerationPanel } from './components/phase-generation-panel';
import { PhaseCompleteDialog } from './components/phase-complete-dialog';
import { JiraCard } from './components/jira-card';
import { selectTaskCounts } from './task-selectors';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { EmptyState, ErrorState, celebrateAchievement } from '@/design';
import { playSound } from '@/shared/sound/sound-effects';
import { cn } from '@/lib/utils';

import { useCurrentUser } from '@/features/auth/useCurrentUser';

export function BoardPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id ? String(currentUser.id) : '';
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [activeDragWidth, setActiveDragWidth] = useState<number | null>(null);

  // Sequence guard & in-flight mutations tracking
  const sequenceRef = useRef(0);
  const inFlightMovesRef = useRef(new Set<string>());
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      pointerPosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Fetch room data to obtain buildStartedAt (phases updated-at)
  const { data: roomData } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomService.getRoom(roomId!),
    enabled: Boolean(roomId),
  });
  const phasesUpdatedAt = roomData?.buildStartedAt || (roomData as any)?.phasesUpdatedAt || '';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<BoardPhase[]>([]);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [boardSummary, setBoardSummary] = useState<any>(null);
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);
  const [currentPhaseName, setCurrentPhaseName] = useState<string>('Sprint');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);
  const [isLocked, setIsLocked] = useState<{ locked: boolean; reason: string } | null>(null);

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeMobileColumn, setActiveMobileColumn] = useState<TaskStatus>('todo');

  const [dismissedReadyKey, setDismissedReadyKey] = useState<string | null>(null);

  // Phases from phase engine - include phasesUpdatedAt in query keys
  const { data: phasesData = [], refetch: refetchPhases } = useQuery({
    queryKey: ['phases', roomId, phasesUpdatedAt],
    queryFn: () => phaseService.getPhases(roomId!),
    enabled: Boolean(roomId),
  });

  const activePhase = useMemo(
    () => phasesData.find((p) => p.status === 'ACTIVE') || phasesData[0] || null,
    [phasesData]
  );

  const phaseParam = searchParams.get('phase');
  const selectedPhaseKey = phaseParam === 'all' ? null : (phaseParam || activePhase?.key || null);

  const currentPhase = useMemo(() => {
    if (!selectedPhaseKey) return activePhase;
    return phasesData.find((p) => p.key.toUpperCase() === selectedPhaseKey.toUpperCase()) || activePhase;
  }, [selectedPhaseKey, phasesData, activePhase]);

  const nextPhase = useMemo(() => {
    if (!activePhase?.nextPhaseKey) return null;
    return phasesData.find((p) => p.key.toUpperCase() === activePhase.nextPhaseKey?.toUpperCase()) || null;
  }, [activePhase, phasesData]);

  const handleSelectPhase = (key: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (key === null) next.set('phase', 'all');
    else next.set('phase', key);
    setSearchParams(next, { replace: true });
  };

  // Summary quick filter ('open' | 'blocked' | 'unassigned' | 'duetoday' | null)
  const [summaryFilter, setSummaryFilter] = useState<'open' | 'blocked' | 'unassigned' | 'duetoday' | null>(null);

  // Filter state synced with URL query
  const filterState: BoardFilterState = useMemo(() => {
    return {
      search: searchParams.get('q') || '',
      selectedAssigneeId: searchParams.get('assignee') || null,
      onlyMine: searchParams.get('mine') === 'true',
      blocked: searchParams.get('blocked') === 'true',
      dueSoon: searchParams.get('duesoon') === 'true',
      needsConfirmation: searchParams.get('confirmation') === 'true',
      groupBy: (searchParams.get('groupby') as GroupByOption) || 'none',
    };
  }, [searchParams]);

  // Read ?task= from URL to open detail modal
  const selectedTaskKey = searchParams.get('task');
  const selectedTask = useMemo(() => {
    if (!selectedTaskKey) return null;
    return tasks.find(t => t.key === selectedTaskKey || t.id === selectedTaskKey) || null;
  }, [selectedTaskKey, tasks]);

  // Load Board data
  const loadData = async (silent = false) => {
    if (!roomId) return;
    const fetchSeq = ++sequenceRef.current;
    try {
      const [boardData, memberList] = await Promise.all([
        boardService.getBoard(roomId),
        roomService.getMembers(roomId).catch(() => []),
      ]);

      // Sequence guard: ignore if a mutation started or finished after this refetch began
      if (fetchSeq < sequenceRef.current) {
        return;
      }

      setTasks(prev => {
        const incoming = boardData.tasks || [];
        if (inFlightMovesRef.current.size === 0) return incoming;
        // The 15-second poll and live events must not overwrite an in-flight optimistic move
        return incoming.map((t: Task) => inFlightMovesRef.current.has(t.id) ? (prev.find(p => p.id === t.id) || t) : t);
      });
      setPhases(boardData.phases || []);
      setBoardSummary(boardData.summary || null);
      if (typeof boardData.hoursLeft === 'number') setHoursLeft(boardData.hoursLeft);
      if (boardData.currentPhase?.name) setCurrentPhaseName(boardData.currentPhase.name);

      const resolvedMembers: RoomMember[] = (memberList && memberList.length > 0)
        ? memberList
        : (boardData.members || []).map((m: any, idx: number) => ({
            id: String(m.userId || m.id || ''),
            displayName: m.name || m.displayName || 'Team Member',
            initials: m.initials || (m.name || 'TM').slice(0, 2).toUpperCase(),
            avatarColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'][idx % 6],
            role: 'member' as const,
            roleTags: [],
            avatarUrl: m.avatarUrl,
          }));
      setMembers(resolvedMembers);
      setError(null);
      setIsLocked(null);
    } catch (err: any) {
      console.error('Failed to load board data:', err);
      if (err?.code === 'STAGE_LOCKED' || err?.message?.includes('STAGE_LOCKED') || err?.message?.includes('Plan must be validated')) {
        setIsLocked({
          locked: true,
          reason: err?.message || 'Requires all 5 plan steps completed and validated before sprint board unlocks.',
        });
      } else if (!silent) {
        setError({
          message: err?.message || 'Failed to load sprint board tasks',
          requestId: err?.requestId,
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !draggingTaskId) {
        loadData(true);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [roomId, draggingTaskId]);

  // Global keyboard shortcut 'C' for Create Task
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update URL filter state
  const handleFilterChange = (updates: Partial<BoardFilterState>) => {
    const nextParams = new URLSearchParams(searchParams);
    const next = { ...filterState, ...updates };

    if (next.search) nextParams.set('q', next.search); else nextParams.delete('q');
    if (next.selectedAssigneeId) nextParams.set('assignee', next.selectedAssigneeId); else nextParams.delete('assignee');
    if (next.onlyMine) nextParams.set('mine', 'true'); else nextParams.delete('mine');
    if (next.blocked) nextParams.set('blocked', 'true'); else nextParams.delete('blocked');
    if (next.dueSoon) nextParams.set('duesoon', 'true'); else nextParams.delete('duesoon');
    if (next.needsConfirmation) nextParams.set('confirmation', 'true'); else nextParams.delete('confirmation');
    if (next.groupBy !== 'none') nextParams.set('groupby', next.groupBy); else nextParams.delete('groupby');

    setSearchParams(nextParams, { replace: true });
  };

  const handleClearFilters = () => {
    const nextParams = new URLSearchParams();
    if (selectedTaskKey) nextParams.set('task', selectedTaskKey);
    setSummaryFilter(null);
    setSearchParams(nextParams, { replace: true });
  };

  // Task open/close
  const handleOpenTask = (task: Task) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('task', task.key);
    setSearchParams(nextParams);
  };

  const handleCloseTaskModal = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('task');
    setSearchParams(nextParams);
  };

  // Status Change with Optimistic Update and Sequence Guard
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus, targetIndex = 0) => {
    if (!roomId) return;
    const prevTask = tasks.find(t => t.id === taskId);
    if (!prevTask || prevTask.status === newStatus) return;

    // Sequence guard: counter increases on local mutation start
    sequenceRef.current++;
    inFlightMovesRef.current.add(taskId);

    const currentMember = members.find((m) => m.id === currentUserId) || members[0] || null;
    const isLeaderUser = currentMember?.role === 'leader' || roomData?.ownerId === currentUserId;
    const willBeConfirmed = newStatus === 'done' && isLeaderUser;

    const updated: Task = {
      ...prevTask,
      status: newStatus,
      order: targetIndex,
      reviewState: willBeConfirmed ? 'CONFIRMED' : (newStatus === 'done' ? 'AWAITING' : 'NONE'),
      confirmedAt: willBeConfirmed ? new Date().toISOString() : prevTask.confirmedAt,
      confirmedBy: willBeConfirmed ? currentUserId : prevTask.confirmedBy,
    };

    // 2. Optimistic update: changes the SAME state (tasks) that the board renders immediately
    setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));

    try {
      // 4. On move response, apply server's task and positions instead of refetching whole board
      const serverTask = await boardService.moveTask(
        roomId,
        taskId,
        newStatus,
        targetIndex,
        (prevTask as any).version
      );

      // Apply server's task and positions (server response wins if it disagrees with UI)
      setTasks(prev => {
        const effective = (serverTask && serverTask.id) ? serverTask : updated;
        return prev.map(t => (t.id === taskId ? effective : t));
      });

      if (newStatus === 'done') {
        playSound('success');
        const remainingOpen = tasks.filter(t => t.id !== taskId && t.status !== 'done').length;
        const totalDoneBefore = tasks.filter(t => t.status === 'done').length;
        if (totalDoneBefore === 0) {
          celebrateAchievement('First task done! The momentum begins.');
        } else if (remainingOpen === 0) {
          celebrateAchievement('All tasks completed! Ready for the demo stage.');
        }
      }

      toast.success(
        `Moved ${prevTask.key} to ${
          newStatus === 'todo' ? 'To do' : newStatus === 'inprogress' ? 'In progress' : 'Done'
        }`
      );
    } catch (err: any) {
      // Revert optimistic update on failure
      setTasks(prev => prev.map(t => (t.id === taskId ? prevTask : t)));

      if (err?.status === 409 || err?.message?.includes('TASK_CHANGED')) {
        toast.error('Task was updated by another team member. Reloading board...');
        loadData();
      } else {
        toast.error(err?.message || 'Failed to update status');
      }
    } finally {
      // Sequence guard: mutation finished
      sequenceRef.current++;
      inFlightMovesRef.current.delete(taskId);
    }
  };

  // Double-click shortcut to quickly advance a task: To Do -> In Progress -> Done
  const handleAdvanceStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const nextStatus: TaskStatus = task.status === 'todo' ? 'inprogress' : task.status === 'inprogress' ? 'done' : 'todo';
    await handleStatusChange(taskId, nextStatus);
  };

  // Assign to me
  const handleAssignToMe = async (taskId: string) => {
    if (!roomId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updated = { ...task, assigneeId: currentUserId };
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    queryClient.setQueryData<Task[]>(['tasks', roomId, phasesUpdatedAt], old =>
      (old || []).map(t => t.id === taskId ? updated : t)
    );

    try {
      await boardService.updateTask(roomId, taskId, { assigneeId: currentUserId });
      toast.success(`Assigned ${task.key} to you`);
      queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
      queryClient.invalidateQueries({ queryKey: ['phases', roomId] });
      queryClient.invalidateQueries({ queryKey: ['board', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    } catch (err: any) {
      setTasks(prev => prev.map(t => t.id === taskId ? task : t));
      queryClient.setQueryData<Task[]>(['tasks', roomId, phasesUpdatedAt], old =>
        (old || []).map(t => t.id === taskId ? task : t)
      );
      toast.error(err?.message || 'Failed to assign task');
    }
  };

  // Toggle Block
  const handleToggleBlock = async (taskId: string) => {
    if (!roomId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const willBlock = !task.flagged;
    const updated = { ...task, flagged: willBlock, blockedReason: willBlock ? 'Blocked' : undefined };
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    queryClient.setQueryData<Task[]>(['tasks', roomId, phasesUpdatedAt], old =>
      (old || []).map(t => t.id === taskId ? updated : t)
    );

    try {
      await boardService.updateTask(
        roomId,
        taskId,
        { flagged: willBlock, blockedReason: willBlock ? 'Blocked' : undefined }
      );
      toast.success(willBlock ? `Flagged ${task.key} as blocked` : `Unblocked ${task.key}`);
      queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
      queryClient.invalidateQueries({ queryKey: ['phases', roomId] });
      queryClient.invalidateQueries({ queryKey: ['board', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    } catch (err: any) {
      setTasks(prev => prev.map(t => t.id === taskId ? task : t));
      queryClient.setQueryData<Task[]>(['tasks', roomId, phasesUpdatedAt], old =>
        (old || []).map(t => t.id === taskId ? task : t)
      );
      toast.error(err?.message || 'Failed to toggle blocked flag');
    }
  };

  // Inline Create
  const handleInlineCreate = async (status: TaskStatus, summary: string) => {
    if (!roomId) return;
    const targetPhaseKey = currentPhase?.key || phases[0]?.id || 'P1';
    try {
      const newTask = await boardService.createTask(roomId, {
        summary,
        status,
        phaseId: targetPhaseKey,
        phaseKey: targetPhaseKey,
        assigneeId: currentUserId,
        reporterId: currentUserId,
      });
      setTasks(prev => [...prev, newTask]);
      queryClient.setQueryData<Task[]>(['tasks', roomId, phasesUpdatedAt], old =>
        old ? [...old, newTask] : [newTask]
      );
      queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
      queryClient.invalidateQueries({ queryKey: ['phases', roomId] });
      queryClient.invalidateQueries({ queryKey: ['board', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      refetchPhases();
      toast.success(`Created ${newTask.key}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create task');
    }
  };

  // Defer Task (leader only)
  const handleDeferTask = async (taskId: string) => {
    if (!roomId) return;
    const prev = tasks.find(t => t.id === taskId);
    setTasks(ts => ts.filter(t => t.id !== taskId));
    queryClient.setQueryData<Task[]>(['tasks', roomId, phasesUpdatedAt], old =>
      (old || []).filter(t => t.id !== taskId)
    );
    try {
      await phaseService.deferTask(roomId, taskId);
      toast.success('Task deferred to next phase');
      queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
      queryClient.invalidateQueries({ queryKey: ['phases', roomId] });
      queryClient.invalidateQueries({ queryKey: ['board', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      refetchPhases();
      handleCloseTaskModal();
    } catch (err: any) {
      if (prev) {
        setTasks(ts => [...ts, prev]);
        queryClient.setQueryData<Task[]>(['tasks', roomId, phasesUpdatedAt], old =>
          old ? [...old, prev] : [prev]
        );
      }
      toast.error(err?.message || 'Failed to defer task');
    }
  };

  // Drop Task (leader only)
  const handleDropTaskLeader = async (taskId: string) => {
    if (!roomId) return;
    const prev = tasks.find(t => t.id === taskId);
    setTasks(ts => ts.filter(t => t.id !== taskId));
    queryClient.setQueryData<Task[]>(['tasks', roomId, phasesUpdatedAt], old =>
      (old || []).filter(t => t.id !== taskId)
    );
    try {
      playSound('destructive');
      await phaseService.dropTask(roomId, taskId, 'Dropped by leader');
      toast.success('Task dropped');
      queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
      queryClient.invalidateQueries({ queryKey: ['phases', roomId] });
      queryClient.invalidateQueries({ queryKey: ['board', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      refetchPhases();
      handleCloseTaskModal();
    } catch (err: any) {
      if (prev) {
        setTasks(ts => [...ts, prev]);
        queryClient.setQueryData<Task[]>(['tasks', roomId, phasesUpdatedAt], old =>
          old ? [...old, prev] : [prev]
        );
      }
      toast.error(err?.message || 'Failed to drop task');
    }
  };

  // Create Task via Modal
  const handleCreateTask = async (draft: Partial<Task>, createAnother: boolean) => {
    if (!roomId) return;
    try {
      const newTask = await boardService.createTask(roomId, draft);
      setTasks(prev => [...prev, newTask]);
      queryClient.setQueryData<Task[]>(['tasks', roomId, phasesUpdatedAt], old =>
        old ? [...old, newTask] : [newTask]
      );
      queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
      queryClient.invalidateQueries({ queryKey: ['phases', roomId] });
      queryClient.invalidateQueries({ queryKey: ['board', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      refetchPhases();
      toast.success(`Created ${newTask.key}`);
      if (!createAnother) {
        setIsCreateModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create task');
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!roomId) return;
    const prev = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    queryClient.setQueryData<Task[]>(['tasks', roomId, phasesUpdatedAt], old =>
      (old || []).filter(t => t.id !== taskId)
    );
    try {
      await boardService.deleteTask(roomId, taskId);
      queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
      queryClient.invalidateQueries({ queryKey: ['phases', roomId] });
      queryClient.invalidateQueries({ queryKey: ['board', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      refetchPhases();
      handleCloseTaskModal();
      toast.success('Task deleted');
    } catch (err: any) {
      if (prev) {
        setTasks(curr => [...curr, prev]);
        queryClient.setQueryData<Task[]>(['tasks', roomId, phasesUpdatedAt], old =>
          old ? [...old, prev] : [prev]
        );
      }
      toast.error(err?.message || 'Failed to delete task');
    }
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Exclude dropped tasks
      if (task.status === 'dropped') return false;

      // Phase filter
      if (selectedPhaseKey !== null) {
        const matchesPhase =
          task.phaseKey?.toUpperCase() === selectedPhaseKey.toUpperCase() ||
          task.phaseId === selectedPhaseKey ||
          (currentPhase?.id && task.phaseId === currentPhase.id);
        if (!matchesPhase) return false;
      }

      // Summary filter
      if (summaryFilter === 'open' && task.status === 'done') return false;
      if (summaryFilter === 'blocked' && !task.flagged && !task.blockedReason && !task.isBlocked) return false;
      if (summaryFilter === 'unassigned' && task.assigneeId) return false;
      if (summaryFilter === 'duetoday') {
        if (!task.dueAt) return false;
        const diff = new Date(task.dueAt).getTime() - Date.now();
        if (diff < 0 || diff > 24 * 3600 * 1000) return false;
      }

      // Search filter (key or summary)
      if (filterState.search) {
        const query = filterState.search.toLowerCase();
        const matchesKey = task.key.toLowerCase().includes(query);
        const matchesSummary = task.summary.toLowerCase().includes(query);
        if (!matchesKey && !matchesSummary) return false;
      }

      // Assignee filter
      if (filterState.selectedAssigneeId === 'unassigned') {
        if (task.assigneeId) return false;
      } else if (filterState.selectedAssigneeId) {
        if (task.assigneeId !== filterState.selectedAssigneeId) return false;
      }

      // Only mine
      if (filterState.onlyMine && task.assigneeId !== currentUserId) return false;

      // Blocked
      if (filterState.blocked && !task.flagged && !task.blockedReason && !task.isBlocked) return false;

      // Due soon (within 6h or overdue)
      if (filterState.dueSoon) {
        if (!task.dueAt) return false;
        const diffHours = (new Date(task.dueAt).getTime() - Date.now()) / (3600 * 1000);
        if (diffHours > 6) return false;
      }

      // Needs confirmation filter
      if (filterState.needsConfirmation && (task.status !== 'done' || task.reviewState !== 'AWAITING')) {
        return false;
      }

      return true;
    });
  }, [tasks, filterState, summaryFilter, selectedPhaseKey, currentPhase, currentUserId]);

  // @dnd-kit Drag and Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveDragTask(task);
      setDraggingTaskId(task.id);
      const el = document.querySelector(`[data-task-id="${task.id}"]`) as HTMLElement | null;
      if (el) {
        setActiveDragWidth(el.getBoundingClientRect().width);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTask(null);
    setDraggingTaskId(null);
    setActiveDragWidth(null);

    // 1. Take target column and index from the element under the pointer
    let targetStatus: TaskStatus | null = null;
    let targetIndex = 0;

    if (pointerPosRef.current) {
      const el = document.elementFromPoint(pointerPosRef.current.x, pointerPosRef.current.y);
      if (el) {
        const colEl = el.closest('[data-column-status]') as HTMLElement | null;
        if (colEl) {
          const colStatus = colEl.getAttribute('data-column-status') as TaskStatus;
          if (['todo', 'inprogress', 'done'].includes(colStatus)) {
            targetStatus = colStatus;
          }
          const cardEl = el.closest('[data-task-id]') as HTMLElement | null;
          if (cardEl) {
            const cards = Array.from(colEl.querySelectorAll('[data-task-id]'));
            const idx = cards.indexOf(cardEl);
            if (idx >= 0) targetIndex = idx;
          } else {
            targetIndex = colEl.querySelectorAll('[data-task-id]').length;
          }
        }
      }
    }

    if (!targetStatus && over?.id) {
      const overId = String(over.id);
      if (['todo', 'inprogress', 'done'].includes(overId)) {
        targetStatus = overId as TaskStatus;
      }
    }

    if (!targetStatus) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === targetStatus) return;

    // Check if forward move is blocked
    const isForward =
      (task.status === 'todo' && (targetStatus === 'inprogress' || targetStatus === 'done')) ||
      (task.status === 'inprogress' && targetStatus === 'done');

    const isTaskBlocked = Boolean(
      task.isBlocked ||
      task.flagged ||
      task.blockedReason ||
      (task.prerequisites && task.prerequisites.some((p) => !p.confirmed))
    );

    if (isForward && isTaskBlocked) {
      const blockedPrereq = (task.prerequisites || []).find((p) => !p.confirmed);
      const prereqKey = blockedPrereq ? blockedPrereq.key : (task.dependsOn?.[0] || 'prerequisite');
      toast.error(`${task.key} is blocked by ${prereqKey}, which is waiting for the leader to confirm it`, {
        action: blockedPrereq ? {
          label: `Open ${prereqKey}`,
          onClick: () => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('task', prereqKey);
            setSearchParams(nextParams);
          },
        } : undefined,
      });
      return;
    }

    await handleStatusChange(task.id, targetStatus, targetIndex);
  };

  const todoTasks = useMemo(() => filteredTasks.filter(t => t.status === 'todo'), [filteredTasks]);
  const inProgressTasks = useMemo(() => filteredTasks.filter(t => t.status === 'inprogress'), [filteredTasks]);
  const doneTasks = useMemo(() => filteredTasks.filter(t => t.status === 'done'), [filteredTasks]);

  // Collapsed by default; stored in localStorage per user
  const [isControlsCollapsed, setIsControlsCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('board_toolbar_collapsed');
    return stored !== null ? stored === 'true' : true;
  });

  const handleToggleCollapse = () => {
    setIsControlsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('board_toolbar_collapsed', String(next));
      return next;
    });
  };

  const currentMember = members.find((m) => m.id === currentUserId) || members[0] || null;
  const isLeader = currentMember?.role === 'leader' || roomData?.ownerId === currentUserId;

  // Derive counts from ONE selector over tasks list in query cache
  const taskCounts = useMemo(() => selectTaskCounts(tasks), [tasks]);
  const needsConfirmationCount = taskCounts.needsConfirmation;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (summaryFilter) count++;
    if (filterState.search) count++;
    if (filterState.selectedAssigneeId) count++;
    if (filterState.onlyMine) count++;
    if (filterState.blocked) count++;
    if (filterState.dueSoon) count++;
    if (filterState.needsConfirmation) count++;
    if (filterState.groupBy !== 'none') count++;
    return count;
  }, [summaryFilter, filterState]);

  const currentPhaseTasks = useMemo(() => {
    if (!currentPhase) return [];
    return tasks.filter(t => t.phaseKey?.toUpperCase() === currentPhase.key?.toUpperCase() || t.phaseId === currentPhase.id);
  }, [tasks, currentPhase]);

  // Directly show generation panel if current phase has not generated tasks or has 0 tasks and is not completed
  const showGenerationPanel = Boolean(
    currentPhase &&
    (!currentPhase.tasksGenerated || currentPhaseTasks.length === 0) &&
    currentPhase.status !== 'COMPLETED'
  );

  const hasTasks = Boolean(!showGenerationPanel && tasks.length > 0);

  const isActivePhaseComplete = Boolean(
    activePhase &&
    activePhase.status === 'ACTIVE' &&
    (activePhase.ready || (currentPhaseTasks.length > 0 && currentPhaseTasks.every(t => t.status === 'done' || t.status === 'dropped')))
  );

  const showPhaseCompleteDialog = Boolean(
    isLeader &&
    activePhase &&
    activePhase.status === 'ACTIVE' &&
    activePhase.ready &&
    dismissedReadyKey !== activePhase.key
  );

  return (
    <div className="flex flex-col gap-2.5 px-5 pb-5 pt-0 max-w-full min-h-full flex-1 bg-page">
      {/* Phase Rail at top of Board */}
      {phasesData.length > 0 && (
        <div className="mt-3 h-10 sticky top-[72px] z-10 bg-page flex items-center shrink-0">
          <PhaseRail
            phases={phasesData}
            selectedPhaseKey={selectedPhaseKey}
            onSelectPhase={handleSelectPhase}
            tasks={tasks}
            roomId={roomId}
            rightAction={
              hasTasks ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleCollapse}
                  className="h-9 px-3 rounded-full text-xs font-medium border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  title={isControlsCollapsed ? (activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Expand') : 'Collapse'}
                  aria-label={isControlsCollapsed ? (activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Expand') : 'Collapse'}
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span>{isControlsCollapsed ? (activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Expand') : 'Collapse'}</span>
                  <ChevronDown className={cn("size-3.5 transition-transform duration-[180ms]", !isControlsCollapsed && "rotate-180")} />
                </Button>
              ) : null
            }
          />
        </div>
      )}

      {/* Active Phase Completed - Jump into Next Phase Banner */}
      {isActivePhaseComplete && nextPhase && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-950 dark:text-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <Check className="size-4 stroke-[3]" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">
                Phase {activePhase.key} is completed!
              </span>
              <span className="text-xs text-muted-foreground">
                All deliverables in {activePhase.key} are finished. You can now advance to Phase {nextPhase.key} ({nextPhase.name}).
              </span>
            </div>
          </div>

          {isLeader ? (
            <Button
              onClick={async () => {
                try {
                  await phaseService.advancePhase(roomId!, activePhase.key);
                  playSound('success');
                  toast.success(`Phase ${activePhase.key} completed! Welcome to Phase ${nextPhase.key}.`);
                  handleSelectPhase(nextPhase.key);
                  loadData();
                  refetchPhases();
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to advance phase');
                }
              }}
              className="h-9 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
            >
              <span>Phase {activePhase.key} is completed. Jump into {nextPhase.key}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          ) : (
            <span className="text-xs font-mono text-muted-foreground">
              Waiting for leader to advance to Phase {nextPhase.key}
            </span>
          )}
        </div>
      )}

      {/* Non-blocking banner for members when active phase is complete */}
      {!isLeader && !isActivePhaseComplete && activePhase && activePhase.status === 'ACTIVE' && activePhase.ready && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <span>{activePhase.key} is complete. Waiting for the leader to start {nextPhase?.key || 'the next phase'}.</span>
        </div>
      )}

      {/* 1 & 2: Header & Summary chips */}
      <BoardHeader
        currentPhaseName={currentPhase?.name || currentPhaseName || phases[0]?.name || 'Sprint'}
        timeLeftText={hoursLeft !== null ? `${hoursLeft}h left` : undefined}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateClick={() => setIsCreateModalOpen(true)}
        tasks={tasks}
        activeFilter={summaryFilter}
        onSelectSummaryFilter={setSummaryFilter}
        showControls={hasTasks}
        isControlsCollapsed={isControlsCollapsed}
        onToggleCollapse={undefined}
        activeFilterCount={activeFilterCount}
      />

      {/* Collapsible toolbar section: PhaseHeaderRow and BoardFilterBar animates over 180ms */}
      <div
        className={cn(
          "transition-all duration-[180ms] ease-in-out overflow-hidden flex flex-col gap-2.5",
          isControlsCollapsed ? "max-h-0 opacity-0 pointer-events-none" : "max-h-[500px] opacity-100"
        )}
      >
        {currentPhase && currentPhase.tasksGenerated && (
          <PhaseHeaderRow
            roomId={roomId!}
            phase={currentPhase}
            nextPhase={nextPhase}
            isLeader={isLeader}
            tasks={tasks}
            onRefresh={() => {
              loadData();
              refetchPhases();
            }}
            onAdvanceEarly={async (choice) => {
              try {
                await phaseService.advancePhase(roomId!, currentPhase.key, choice);
                toast.success(`Advanced to ${nextPhase?.key || 'next phase'}`);
                loadData();
                refetchPhases();
              } catch (err: any) {
                toast.error(err?.message || 'Failed to advance phase');
              }
            }}
          />
        )}

        {hasTasks && (
          <BoardFilterBar
            members={members}
            currentUserId={currentUserId}
            isLeader={isLeader}
            needsConfirmationCount={needsConfirmationCount}
            filterState={filterState}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        )}
      </div>

      {/* Main Board / List View Area */}
      {showGenerationPanel && currentPhase ? (
        <PhaseGenerationPanel
          roomId={roomId!}
          phase={currentPhase}
          isLeader={isLeader}
          mode="FRESH"
          onImportSuccess={() => {
            loadData();
            refetchPhases();
          }}
        />
      ) : isLocked?.locked ? (
        <EmptyState
          illustration="checklist"
          headline="Board is Locked"
          subtext={isLocked.reason}
          primaryAction={{
            label: 'Go to Plan Page',
            onClick: () => navigate(`/app/room/${roomId}/plan`),
          }}
          secondaryAction={{
            label: 'View Overview',
            variant: 'secondary',
            onClick: () => navigate(`/app/room/${roomId}/overview`),
          }}
          className="my-12 max-w-lg mx-auto"
        />
      ) : error ? (
        <ErrorState
          message={error.message}
          requestId={error.requestId}
          onRetry={() => {
            setLoading(true);
            loadData();
          }}
          className="my-8"
        />
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[500px] rounded-[16px]" />
          <Skeleton className="h-[500px] rounded-[16px]" />
          <Skeleton className="h-[500px] rounded-[16px]" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          illustration="clipboard"
          headline={`No tasks yet for ${currentPhase?.key || 'this phase'}`}
          subtext="Create tasks manually or wait for phase import."
          secondaryAction={{
            label: 'Create task manually',
            variant: 'secondary',
            onClick: () => setIsCreateModalOpen(true),
          }}
          className="my-8"
        />
      ) : viewMode === 'list' ? (
        <BoardListView
          tasks={filteredTasks}
          members={members}
          phases={phases}
          onOpenTask={handleOpenTask}
          onStatusChange={handleStatusChange}
        />
      ) : filterState.groupBy !== 'none' ? (
        <BoardSwimlanes
          groupBy={filterState.groupBy as 'assignee' | 'phase'}
          tasks={filteredTasks}
          members={members}
          phases={phases}
          onOpenTask={handleOpenTask}
          onStatusChange={handleStatusChange}
          onAssignToMe={handleAssignToMe}
          onToggleBlock={handleToggleBlock}
        />
      ) : (
        <>
          {/* Mobile responsive column switcher below 900px */}
          <div className="md:hidden flex justify-center pb-1">
            <SegmentedControl className="w-full">
              <SegmentedControlItem
                active={activeMobileColumn === 'todo'}
                onClick={() => setActiveMobileColumn('todo')}
                className="flex-1 text-xs"
              >
                To do ({todoTasks.length})
              </SegmentedControlItem>
              <SegmentedControlItem
                active={activeMobileColumn === 'inprogress'}
                onClick={() => setActiveMobileColumn('inprogress')}
                className="flex-1 text-xs"
              >
                In progress ({inProgressTasks.length})
              </SegmentedControlItem>
              <SegmentedControlItem
                active={activeMobileColumn === 'done'}
                onClick={() => setActiveMobileColumn('done')}
                className="flex-1 text-xs"
              >
                Done ({doneTasks.length})
              </SegmentedControlItem>
            </SegmentedControl>
          </div>

          {/* 4: Three equal columns grid with @dnd-kit drag and drop */}
          <DndContext sensors={sensors} autoScroll={false} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
              <div className={activeMobileColumn !== 'todo' ? 'hidden md:block' : 'block'}>
                <BoardColumn
                  status="todo"
                  title="TO DO"
                  tasks={todoTasks}
                  members={members}
                  phases={phases}
                  draggingTaskId={draggingTaskId}
                  isLeader={isLeader}
                  onOpenTask={handleOpenTask}
                  onStatusChange={handleStatusChange}
                  onAssignToMe={handleAssignToMe}
                  onToggleBlock={handleToggleBlock}
                  onDeferTask={handleDeferTask}
                  onDropTaskLeader={handleDropTaskLeader}
                  onInlineCreate={handleInlineCreate}
                  onAdvanceTaskStatus={handleAdvanceStatus}
                />
              </div>

              <div className={activeMobileColumn !== 'inprogress' ? 'hidden md:block' : 'block'}>
                <BoardColumn
                  status="inprogress"
                  title="IN PROGRESS"
                  tasks={inProgressTasks}
                  members={members}
                  phases={phases}
                  draggingTaskId={draggingTaskId}
                  isLeader={isLeader}
                  onOpenTask={handleOpenTask}
                  onStatusChange={handleStatusChange}
                  onAssignToMe={handleAssignToMe}
                  onToggleBlock={handleToggleBlock}
                  onDeferTask={handleDeferTask}
                  onDropTaskLeader={handleDropTaskLeader}
                  onInlineCreate={handleInlineCreate}
                  onAdvanceTaskStatus={handleAdvanceStatus}
                />
              </div>

              <div className={activeMobileColumn !== 'done' ? 'hidden md:block' : 'block'}>
                <BoardColumn
                  status="done"
                  title="DONE"
                  tasks={doneTasks}
                  members={members}
                  phases={phases}
                  draggingTaskId={draggingTaskId}
                  isLeader={isLeader}
                  onOpenTask={handleOpenTask}
                  onStatusChange={handleStatusChange}
                  onAssignToMe={handleAssignToMe}
                  onToggleBlock={handleToggleBlock}
                  onDeferTask={handleDeferTask}
                  onDropTaskLeader={handleDropTaskLeader}
                  onInlineCreate={handleInlineCreate}
                  onAdvanceTaskStatus={handleAdvanceStatus}
                />
              </div>
            </div>

            {typeof document !== 'undefined' && createPortal(
              <DragOverlay dropAnimation={null}>
                {activeDragTask ? (
                  <div
                    style={{
                      width: activeDragWidth ? `${activeDragWidth}px` : undefined,
                      transition: 'none',
                      animation: 'none',
                    }}
                    className="shadow-2xl opacity-95 pointer-events-none cursor-grabbing select-none"
                  >
                    <JiraCard
                      task={activeDragTask}
                      members={members}
                      phases={phases}
                      isLeader={isLeader}
                      onOpen={() => {}}
                      onStatusChange={() => {}}
                      onAssignToMe={() => {}}
                      onToggleBlock={() => {}}
                      isOverlay
                    />
                  </div>
                ) : null}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        </>
      )}

      {/* Task Detail Modal (?task=CBS-12) */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          allTasks={tasks}
          members={members}
          phases={phases}
          onClose={handleCloseTaskModal}
          onUpdateTask={(updated) => {
            setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
            queryClient.setQueryData<Task[]>(['tasks', roomId, phasesUpdatedAt], old =>
              (old || []).map(t => t.id === updated.id ? updated : t)
            );
            queryClient.invalidateQueries({ queryKey: ['tasks', roomId] });
            queryClient.invalidateQueries({ queryKey: ['phases', roomId] });
            queryClient.invalidateQueries({ queryKey: ['board', roomId] });
            queryClient.invalidateQueries({ queryKey: ['room', roomId] });
          }}
          onDeleteTask={handleDeleteTask}
          onDeferTask={handleDeferTask}
          onDropTask={handleDropTaskLeader}
          onOpenTaskByKey={(key) => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('task', key);
            setSearchParams(nextParams);
          }}
        />
      )}

      {/* Create Task Modal */}
      {isCreateModalOpen && roomId && (
        <CreateTaskModal
          roomId={roomId}
          phases={phases}
          members={members}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateTask}
        />
      )}

      {/* Phase Complete Dialog */}
      {showPhaseCompleteDialog && activePhase && (
        <PhaseCompleteDialog
          isOpen={showPhaseCompleteDialog}
          phase={activePhase}
          nextPhase={nextPhase}
          roomId={roomId!}
          isLeader={isLeader}
          onClose={() => {
            setDismissedReadyKey(activePhase.key);
            phaseService.dismissReady(roomId!, activePhase.key).catch(() => {});
          }}
          onAdvanceSuccess={(newPhaseKey, isBuildComplete) => {
            if (isBuildComplete) {
              toast.success('Build complete!');
              navigate(`/app/room/${roomId}/overview`);
            } else {
              toast.success(`Started ${newPhaseKey || 'next phase'}`);
              handleSelectPhase(newPhaseKey);
              loadData();
              refetchPhases();
            }
          }}
        />
      )}
    </div>
  );
}
