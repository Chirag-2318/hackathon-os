import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Flag, MoreHorizontal, Check, UserCheck, ShieldAlert, ArrowRight, CornerDownRight, GitBranch
} from 'lucide-react';
import type { Task, RoomMember, BoardPhase, TaskStatus } from '@/services/types';
import {
  IssueKey, IssueTypeIcon, PriorityIcon, StatusLozenge, PhaseChip,
  DueChip, EstimateChip, SubtaskProgress, CommentCount
} from '@/features/build/ui';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export interface JiraCardProps {
  task: Task;
  members: RoomMember[];
  phases: BoardPhase[];
  isDragging?: boolean;
  onOpen: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onAssignToMe: (taskId: string) => void;
  onToggleBlock: (taskId: string) => void;
  // Drag-and-drop pointer handlers
  onPointerDownDrag?: (e: React.PointerEvent, task: Task) => void;
  onDragStartTask?: (taskId: string) => void;
  onDragEndTask?: () => void;
  onAdvanceTaskStatus?: (taskId: string) => void;
}

export function JiraCard({
  task,
  members,
  phases,
  isDragging = false,
  onOpen,
  onStatusChange,
  onAssignToMe,
  onToggleBlock,
  onPointerDownDrag,
  onDragStartTask,
  onDragEndTask,
  onAdvanceTaskStatus,
}: JiraCardProps) {
  const isDone = task.status === 'done';
  const isBlocked = task.flagged || Boolean(task.blockedReason);
  const assignee = members.find(m => m.id === task.assigneeId);
  const phaseIndex = phases.findIndex(p => p.id === task.phaseId);
  const phase = phases[phaseIndex] || { name: 'Sprint' };
  const [justDragged, setJustDragged] = useState(false);

  // Subtask progress
  const totalSubtasks = (task.subtasks || []).length;
  const doneSubtasks = (task.subtasks || []).filter(s => s.done).length;

  return (
    <div
      role="button"
      tabIndex={0}
      data-task-id={task.id}
      data-task-key={task.key}
      draggable={true}
      onDragStart={(e) => {
        if ((e.target as HTMLElement).closest('button, [role="menuitem"], a, input')) {
          e.preventDefault();
          return;
        }
        setJustDragged(true);
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStartTask?.(task.id);
      }}
      onDragEnd={() => {
        setTimeout(() => setJustDragged(false), 100);
        onDragEndTask?.();
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('button, [role="menuitem"], a, input')) return;
        onPointerDownDrag?.(e, task);
      }}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest('button, [role="menuitem"], a, input')) return;
        e.preventDefault();
        e.stopPropagation();
        onAdvanceTaskStatus?.(task.id);
      }}
      onClick={(e) => {
        if (justDragged) return;
        onOpen(task);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onOpen(task);
        }
      }}
      className={cn(
        'group relative bg-white dark:bg-card rounded-[12px] p-3 text-left border border-[#E7E7E9] dark:border-border select-none cursor-grab active:cursor-grabbing',
        'shadow-[0_1px_2px_rgba(16,16,20,0.06)] transition-all duration-150',
        'hover:shadow-md hover:border-[#D6D6DA] dark:hover:border-border/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        isBlocked && 'border-l-[3px] border-l-rose-500 dark:border-l-rose-500',
        (isDragging || justDragged) && 'opacity-60 shadow-[0_12px_28px_rgba(16,16,20,0.18)] scale-[1.01]'
      )}
    >
      {/* Top row: Flag + BLOCKED Lozenge (only when relevant) */}
      {isBlocked && (
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5">
            <Flag className="size-3.5 text-rose-600 fill-rose-600 shrink-0" />
            <StatusLozenge status="blocked" />
          </div>
          {task.blockedReason && (
            <span className="text-[11px] text-rose-600 font-medium truncate max-w-[150px]" title={task.blockedReason}>
              {task.blockedReason}
            </span>
          )}
        </div>
      )}

      {/* Summary (max 2 lines with ellipsis) */}
      <div className="flex items-start justify-between gap-2">
        <h4
          className={cn(
            'text-[14px] font-medium leading-snug line-clamp-2 text-foreground',
            isDone && 'text-muted-foreground line-through'
          )}
        >
          {task.summary}
        </h4>

        {/* Action Menu (Hover & Focus) */}
        <div
          className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shrink-0 -mr-1 -mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Task options"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuItem onClick={() => onOpen(task)}>
                Open details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {task.status !== 'todo' && (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, 'todo')}>
                  Move to To do
                </DropdownMenuItem>
              )}
              {task.status !== 'inprogress' && (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, 'inprogress')}>
                  Move to In progress
                </DropdownMenuItem>
              )}
              {task.status !== 'done' && (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, 'done')}>
                  Move to Done
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAssignToMe(task.id)}>
                <UserCheck className="size-3.5 mr-2" />
                Assign to me
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleBlock(task.id)}>
                <Flag className="size-3.5 mr-2 text-rose-500" />
                {isBlocked ? 'Clear blocked flag' : 'Flag as blocked'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Labels Row: Role chip & PhaseChip */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {task.role && (
          <span className="h-5 px-2 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border/40 inline-flex items-center">
            {task.role}
          </span>
        )}
        <PhaseChip name={phase.name} index={phaseIndex >= 0 ? phaseIndex : 0} />
      </div>

      {/* Footer Row (Edge Aligned) */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border/40">
        {/* Left: IssueTypeIcon + IssueKey + PriorityIcon + Branch icon */}
        <div className="flex items-center gap-1.5 shrink-0">
          <IssueTypeIcon type="task" isDone={isDone} />
          <IssueKey issueKey={task.key} isDone={isDone} />
          <PriorityIcon priority={task.priority} />

        </div>

        {/* Right: Estimate, Due, Subtasks, Comments, Assignee */}
        <div className="flex items-center gap-2 shrink-0">
          <EstimateChip estimateMin={task.estimateMin} />
          <DueChip dueAt={task.dueAt} />
          {totalSubtasks > 0 && (
            <SubtaskProgress done={doneSubtasks} total={totalSubtasks} />
          )}
          <CommentCount count={(task.comments || []).length} />

          {/* Assignee Avatar (24px) */}
          {assignee ? (
            <div
              className="size-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 flex items-center justify-center text-[10px] font-bold shrink-0 border border-border/40"
              title={assignee.name}
            >
              {assignee.avatar ? (
                <img src={assignee.avatar} alt={assignee.name || 'Assignee'} className="size-full rounded-full object-cover" />
              ) : (
                (assignee.name || 'TM').slice(0, 2).toUpperCase()
              )}
            </div>
          ) : (
            <div
              className="size-6 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground/60 shrink-0"
              title="Unassigned"
            >
              <span className="text-[10px]">?</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
