import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { boardService } from '@/services/boardService';
import { roomService } from '@/services/roomService';
import type { Task, BoardPhase, RoomMember, TaskStatus } from '@/services/types';

import { BoardHeader } from './components/board-header';
import { BoardFilterBar, type BoardFilterState, type GroupByOption } from './components/board-filter-bar';
import { BoardColumn } from './components/board-column';
import { BoardSwimlanes } from './components/board-swimlanes';
import { BoardListView } from './components/board-list-view';
import { CreateTaskModal } from './create-task-modal';
import { TaskDetailModal } from './task-detail-modal';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState, celebrateAchievement } from '@/design';

import { useCurrentUser } from '@/features/auth/useCurrentUser';

export function BoardPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id ? String(currentUser.id) : '';
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

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
    try {
      const [boardData, memberList] = await Promise.all([
        boardService.getBoard(roomId),
        roomService.getMembers(roomId).catch(() => []),
      ]);
      setTasks(boardData.tasks || []);
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

  // Status Change with Optimistic Update and Undo toast
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!roomId) return;
    const prevTask = tasks.find(t => t.id === taskId);
    if (!prevTask || prevTask.status === newStatus) return;

    const oldStatus = prevTask.status;
    const updated = { ...prevTask, status: newStatus };
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));

    try {
      await boardService.moveTask(roomId, taskId, newStatus, 0, (prevTask as any).version);

      if (newStatus === 'done') {
        const remainingOpen = tasks.filter(t => t.id !== taskId && t.status !== 'done').length;
        const totalDoneBefore = tasks.filter(t => t.status === 'done').length;
        if (totalDoneBefore === 0) {
          celebrateAchievement('First task done! The momentum begins.');
        } else if (remainingOpen === 0) {
          celebrateAchievement('All tasks completed! Ready for the demo stage.');
        }
      }

      toast.success(`Moved ${prevTask.key} to ${newStatus === 'todo' ? 'To do' : newStatus === 'inprogress' ? 'In progress' : 'Done'}`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            setTasks(prev => prev.map(t => t.id === taskId ? prevTask : t));
            await boardService.moveTask(roomId, taskId, oldStatus, 0, (updated as any).version);
          },
        },
      });
    } catch (err: any) {
      setTasks(prev => prev.map(t => t.id === taskId ? prevTask : t));
      if (err?.status === 409 || err?.message?.includes('TASK_CHANGED')) {
        toast.error('Task was updated by another team member. Reloading board...');
        loadData();
      } else {
        toast.error(err?.message || 'Failed to update status');
      }
    }
  };

  // Double-click shortcut to quickly advance a task: To Do -> In Progress -> Done
  const handleAdvanceStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const nextStatus: TaskStatus = task.status === 'todo' ? 'inprogress' : task.status === 'inprogress' ? 'done' : 'todo';
    await handleStatusChange(taskId, nextStatus);
  };

  // Drag-and-drop on column
  const handleDropTask = async (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetStatus) return;
    await handleStatusChange(taskId, targetStatus);
  };

  // Assign to me
  const handleAssignToMe = async (taskId: string) => {
    if (!roomId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updated = { ...task, assigneeId: currentUserId };
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    await boardService.updateTask(roomId, taskId, { assigneeId: currentUserId });
    toast.success(`Assigned ${task.key} to you`);
  };

  // Toggle Block
  const handleToggleBlock = async (taskId: string) => {
    if (!roomId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const willBlock = !task.flagged;
    const updated = { ...task, flagged: willBlock, blockedReason: willBlock ? 'Blocked' : undefined };
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    await boardService.updateTask(
      roomId,
      taskId,
      { flagged: willBlock, blockedReason: willBlock ? 'Blocked' : undefined }
    );
    toast.success(willBlock ? `Flagged ${task.key} as blocked` : `Unblocked ${task.key}`);
  };

  // Inline Create
  const handleInlineCreate = async (status: TaskStatus, summary: string) => {
    if (!roomId) return;
    const currentPhase = phases[0]?.id || 'p-0';
    const newTask = await boardService.createTask(roomId, {
      summary,
      status,
      phaseId: currentPhase,
      assigneeId: currentUserId,
      reporterId: currentUserId,
    });
    setTasks(prev => [...prev, newTask]);
    toast.success(`Created ${newTask.key}`);
  };

  // Create Task via Modal
  const handleCreateTask = async (draft: Partial<Task>, createAnother: boolean) => {
    if (!roomId) return;
    const newTask = await boardService.createTask(roomId, draft);
    setTasks(prev => [...prev, newTask]);
    toast.success(`Created ${newTask.key}`);
    if (!createAnother) {
      setIsCreateModalOpen(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!roomId) return;
    await boardService.deleteTask(roomId, taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    handleCloseTaskModal();
    toast.success('Task deleted');
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Summary filter
      if (summaryFilter === 'open' && task.status === 'done') return false;
      if (summaryFilter === 'blocked' && !task.flagged && !task.blockedReason) return false;
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
      if (filterState.blocked && !task.flagged && !task.blockedReason) return false;

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
  }, [tasks, filterState, summaryFilter]);

  // Drag and drop state
  const [dropTargetCol, setDropTargetCol] = useState<TaskStatus | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragRef = useRef<{ task: Task; startX: number; startY: number } | null>(null);

  const handlePointerDownDrag = (e: React.PointerEvent, task: Task) => {
    dragRef.current = { task, startX: e.clientX, startY: e.clientY };

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (!dragRef.current) return;
      const dist = Math.hypot(moveEv.clientX - dragRef.current.startX, moveEv.clientY - dragRef.current.startY);
      if (dist > 5) {
        setDraggingTaskId(task.id);

        // Detect column under pointer
        const elem = document.elementFromPoint(moveEv.clientX, moveEv.clientY);
        const colElem = elem?.closest('[data-column-status]');
        if (colElem) {
          const colStatus = colElem.getAttribute('data-column-status') as TaskStatus;
          setDropTargetCol(colStatus);

          // Find insertion index
          const cards = Array.from(colElem.querySelectorAll('[data-task-id]'));
          let foundIdx = cards.length;
          for (let i = 0; i < cards.length; i++) {
            const rect = cards[i].getBoundingClientRect();
            if (moveEv.clientY < rect.top + rect.height / 2) {
              foundIdx = i;
              break;
            }
          }
          setDropIndex(foundIdx);
        } else {
          setDropTargetCol(null);
          setDropIndex(null);
        }
      }
    };

    const handlePointerUp = async () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      if (dragRef.current && dropTargetCol && roomId) {
        const draggedTask = dragRef.current.task;
        if (draggedTask.status !== dropTargetCol) {
          const isMovingForward =
            (draggedTask.status === 'todo' && (dropTargetCol === 'inprogress' || dropTargetCol === 'done')) ||
            (draggedTask.status === 'inprogress' && dropTargetCol === 'done');

          if (draggedTask.isBlocked && isMovingForward) {
            const unconfirmed = (draggedTask.prerequisites || [])
              .filter((p) => !p.confirmed)
              .map((p) => p.title || p.key);
            toast.error(
              `You can't start this task yet. Finish: ${unconfirmed.length > 0 ? unconfirmed.join(', ') : 'prerequisites'}.`
            );
            dragRef.current = null;
            setDraggingTaskId(null);
            setDropTargetCol(null);
            setDropIndex(null);
            return;
          }

          // If moving from TO DO to IN PROGRESS and unassigned, assign to current user
          let patch: Partial<Task> = { status: dropTargetCol };
          if (draggedTask.status === 'todo' && dropTargetCol === 'inprogress' && !draggedTask.assigneeId) {
            patch.assigneeId = currentUserId;
          }

          const prev = tasks.find(t => t.id === draggedTask.id);
          setTasks(ts => ts.map(t => t.id === draggedTask.id ? { ...t, ...patch } : t));

          try {
            await boardService.moveTask(
              roomId,
              draggedTask.id,
              dropTargetCol,
              dropIndex ?? 0,
              (draggedTask as any).version
            );
            toast.success(`Moved ${draggedTask.key} to ${dropTargetCol}`);
          } catch (err: any) {
            if (prev) {
              setTasks(ts => ts.map(t => t.id === draggedTask.id ? prev : t));
            }
            if (err?.code === 'TASK_BLOCKED' || err?.message?.includes('TASK_BLOCKED')) {
              toast.error(err.message || 'Cannot advance task: prerequisites are not finished.');
            } else if (err?.status === 409 || err?.message?.includes('TASK_CHANGED')) {
              toast.error('Task was updated by another team member. Reloading board...');
              loadData();
            } else if (err?.message?.includes('DEPENDENCY_CYCLE') || err?.code === 'DEPENDENCY_CYCLE') {
              toast.error('Cannot move task: circular dependency detected.');
            } else {
              toast.error(err?.message || 'Failed to move task');
            }
          }
        }
      }

      dragRef.current = null;
      setDraggingTaskId(null);
      setDropTargetCol(null);
      setDropIndex(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const todoTasks = useMemo(() => filteredTasks.filter(t => t.status === 'todo'), [filteredTasks]);
  const inProgressTasks = useMemo(() => filteredTasks.filter(t => t.status === 'inprogress'), [filteredTasks]);
  const doneTasks = useMemo(() => filteredTasks.filter(t => t.status === 'done'), [filteredTasks]);

  const currentMember = members.find((m) => m.id === currentUserId) || members[0] || null;
  const isLeader = currentMember?.role === 'leader';
  const needsConfirmationCount = useMemo(() => {
    return tasks.filter((t) => t.status === 'done' && t.reviewState === 'AWAITING').length;
  }, [tasks]);

  return (
    <div className="flex flex-col gap-4 p-5 max-w-full min-h-[calc(100vh-64px)]">
      {/* 1 & 2: Header & Summary chips */}
      <BoardHeader
        currentPhaseName={currentPhaseName || phases[0]?.name || 'Sprint'}
        timeLeftText={hoursLeft !== null ? `${hoursLeft}h left` : undefined}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateClick={() => setIsCreateModalOpen(true)}
        tasks={tasks}
        activeFilter={summaryFilter}
        onSelectSummaryFilter={setSummaryFilter}
      />

      {/* 3: Quick filter bar */}
      <BoardFilterBar
        members={members}
        currentUserId={currentUserId}
        isLeader={isLeader}
        needsConfirmationCount={needsConfirmationCount}
        filterState={filterState}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Main Board / List View Area */}
      {isLocked?.locked ? (
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
          headline="No tasks yet. Generate them from your plan."
          subtext="Kickstart your sprint by generating actionable engineering tasks from your validated plan."
          primaryAction={{
            label: 'Generate from Plan',
            onClick: () => navigate(`/app/room/${roomId}/plan`),
          }}
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
          onPointerDownDrag={handlePointerDownDrag}
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

          {/* 4: Three equal columns grid (NO horizontal scroll at 1100px+) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
            <div className={activeMobileColumn !== 'todo' ? 'hidden md:block' : 'block'}>
              <BoardColumn
                status="todo"
                title="TO DO"
                tasks={todoTasks}
                members={members}
                phases={phases}
                isDropTarget={dropTargetCol === 'todo'}
                dropIndex={dropTargetCol === 'todo' ? dropIndex : null}
                draggingTaskId={draggingTaskId}
                onOpenTask={handleOpenTask}
                onStatusChange={handleStatusChange}
                onAssignToMe={handleAssignToMe}
                onToggleBlock={handleToggleBlock}
                onInlineCreate={handleInlineCreate}
                onPointerDownDrag={handlePointerDownDrag}
                onDropTask={handleDropTask}
                onAdvanceTaskStatus={handleAdvanceStatus}
                onDragStartTask={setDraggingTaskId}
                onDragEndTask={() => setDraggingTaskId(null)}
              />
            </div>

            <div className={activeMobileColumn !== 'inprogress' ? 'hidden md:block' : 'block'}>
              <BoardColumn
                status="inprogress"
                title="IN PROGRESS"
                tasks={inProgressTasks}
                members={members}
                phases={phases}
                isDropTarget={dropTargetCol === 'inprogress'}
                dropIndex={dropTargetCol === 'inprogress' ? dropIndex : null}
                draggingTaskId={draggingTaskId}
                onOpenTask={handleOpenTask}
                onStatusChange={handleStatusChange}
                onAssignToMe={handleAssignToMe}
                onToggleBlock={handleToggleBlock}
                onInlineCreate={handleInlineCreate}
                onPointerDownDrag={handlePointerDownDrag}
                onDropTask={handleDropTask}
                onAdvanceTaskStatus={handleAdvanceStatus}
                onDragStartTask={setDraggingTaskId}
                onDragEndTask={() => setDraggingTaskId(null)}
              />
            </div>

            <div className={activeMobileColumn !== 'done' ? 'hidden md:block' : 'block'}>
              <BoardColumn
                status="done"
                title="DONE"
                tasks={doneTasks}
                members={members}
                phases={phases}
                isDropTarget={dropTargetCol === 'done'}
                dropIndex={dropTargetCol === 'done' ? dropIndex : null}
                draggingTaskId={draggingTaskId}
                onOpenTask={handleOpenTask}
                onStatusChange={handleStatusChange}
                onAssignToMe={handleAssignToMe}
                onToggleBlock={handleToggleBlock}
                onInlineCreate={handleInlineCreate}
                onPointerDownDrag={handlePointerDownDrag}
                onDropTask={handleDropTask}
                onAdvanceTaskStatus={handleAdvanceStatus}
                onDragStartTask={setDraggingTaskId}
                onDragEndTask={() => setDraggingTaskId(null)}
              />
            </div>
          </div>
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
          }}
          onDeleteTask={handleDeleteTask}
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
    </div>
  );
}
