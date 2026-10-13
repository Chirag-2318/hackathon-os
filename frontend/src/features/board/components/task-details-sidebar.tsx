import React, { useState } from 'react';
import { ChevronDown, User, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, RoomMember, BoardPhase, TaskStatus, TaskPriority } from '@/services/types';
import { StatusLozenge, PriorityIcon, PhaseChip, EstimateChip, DueChip } from '@/features/build/ui';
import { UserAvatar } from '@/components/ui/user-avatar';
import { UserName } from '@/components/ui/user-name';

export interface TaskDetailsSidebarProps {
  task: Task;
  members: RoomMember[];
  phases: BoardPhase[];
  currentUserId: string;
  onStatusChange: (status: TaskStatus) => Promise<void>;
  onAssigneeChange: (assigneeId?: string) => Promise<void>;
  onPriorityChange: (priority: TaskPriority) => Promise<void>;
  onPhaseChange: (phaseId: string) => Promise<void>;
}

export function TaskDetailsSidebar({
  task,
  members,
  phases,
  currentUserId,
  onStatusChange,
  onAssigneeChange,
  onPriorityChange,
  onPhaseChange,
}: TaskDetailsSidebarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showPhaseMenu, setShowPhaseMenu] = useState(false);

  const assignee = members.find(m => m.id === task.assigneeId);
  const reporter = members.find(m => m.id === task.reporterId) || members[0] || null;
  const currentPhase = phases.find(p => p.id === task.phaseId) || phases[0];

  const handleSelectStatus = async (status: TaskStatus) => {
    setShowStatusMenu(false);
    await onStatusChange(status);
  };

  const handleSelectAssignee = async (memberId?: string) => {
    setShowAssigneeMenu(false);
    await onAssigneeChange(memberId);
  };

  const handleSelectPriority = async (priority: TaskPriority) => {
    setShowPriorityMenu(false);
    await onPriorityChange(priority);
  };

  const handleSelectPhase = async (phaseId: string) => {
    setShowPhaseMenu(false);
    await onPhaseChange(phaseId);
  };

  return (
    <div className="w-full md:w-[280px] p-5 flex flex-col gap-4 bg-muted/20 border-t md:border-t-0 md:border-l border-border shrink-0 select-none">
      <div className="flex items-center justify-between pb-1 border-b border-border/50">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Details
        </span>
      </div>

      <div className="flex flex-col gap-3.5 text-xs">
        {/* Status */}
        <div className="flex items-center justify-between relative">
          <span className="text-muted-foreground font-medium">Status</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="focus:outline-none"
            >
              <StatusLozenge status={task.status} showChevron />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-7 z-50 p-1 rounded-xl bg-popover border border-border shadow-lg flex flex-col gap-1 w-44">
                {(['todo', 'inprogress', 'done'] as const).map((s) => {
                  const isForward =
                    (task.status === 'todo' && (s === 'inprogress' || s === 'done')) ||
                    (task.status === 'inprogress' && s === 'done');
                  const isDisabled = Boolean(task.isBlocked && isForward);

                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => !isDisabled && handleSelectStatus(s)}
                      title={isDisabled ? 'Task is blocked by unfinished prerequisites' : undefined}
                      className={cn(
                        'w-full text-left p-1.5 rounded-lg text-xs flex items-center justify-between',
                        isDisabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-muted cursor-pointer'
                      )}
                    >
                      <StatusLozenge status={s} />
                      {task.status === s && <Check className="size-3 text-muted-foreground ml-1" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Assignee */}
        <div className="flex items-start justify-between relative">
          <span className="text-muted-foreground font-medium pt-1">Assignee</span>
          <div className="flex flex-col items-end gap-1 relative">
            <button
              type="button"
              onClick={() => setShowAssigneeMenu(!showAssigneeMenu)}
              className="flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded-lg transition-colors border border-border/40 bg-card"
            >
              {assignee ? (
                <>
                  <div className="size-5 rounded-full overflow-hidden shrink-0">
                    <UserAvatar user={assignee} size={20} />
                  </div>
                  <span className="font-medium text-foreground max-w-[110px] truncate">
                    <UserName user={assignee} />
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground italic">Unassigned</span>
              )}
              <ChevronDown className="size-3 opacity-60" />
            </button>

            {task.assigneeId !== currentUserId && (
              <button
                type="button"
                onClick={() => onAssigneeChange(currentUserId)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Assign to me
              </button>
            )}

            {showAssigneeMenu && (
              <div className="absolute right-0 top-9 z-50 p-1.5 rounded-xl bg-popover border border-border shadow-lg flex flex-col gap-1 w-52 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => handleSelectAssignee(undefined)}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted text-xs text-muted-foreground italic"
                >
                  Unassigned
                </button>
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectAssignee(m.id)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted text-xs flex items-center gap-2"
                  >
                    <div className="size-5 rounded-full overflow-hidden shrink-0">
                      <UserAvatar user={m} size={20} />
                    </div>
                    <span className="truncate flex-1">
                      <UserName user={m} showDisplayName={true} />
                    </span>
                    {task.assigneeId === m.id && <Check className="size-3 text-muted-foreground shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reporter */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">Reporter</span>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg">
            {reporter ? (
              <>
                <div className="size-5 rounded-full overflow-hidden shrink-0">
                  <UserAvatar user={reporter} size={20} />
                </div>
                <span className="font-medium text-foreground max-w-[120px] truncate">
                  <UserName user={reporter} />
                </span>
              </>
            ) : (
              <span className="text-foreground font-medium">Team Member</span>
            )}
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center justify-between relative">
          <span className="text-muted-foreground font-medium">Priority</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              className="flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded-lg transition-colors border border-border/40 bg-card capitalize"
            >
              <PriorityIcon priority={task.priority} />
              <span className="font-medium text-foreground">{task.priority}</span>
              <ChevronDown className="size-3 opacity-60" />
            </button>

            {showPriorityMenu && (
              <div className="absolute right-0 top-7 z-50 p-1 rounded-xl bg-popover border border-border shadow-lg flex flex-col gap-1 w-36">
                {(['highest', 'high', 'medium', 'low', 'lowest'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPriority(p)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted text-xs flex items-center gap-2 capitalize"
                  >
                    <PriorityIcon priority={p} />
                    <span className="flex-1">{p}</span>
                    {task.priority === p && <Check className="size-3 text-muted-foreground" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Phase */}
        <div className="flex items-center justify-between relative">
          <span className="text-muted-foreground font-medium">Phase</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPhaseMenu(!showPhaseMenu)}
              className="hover:opacity-85 transition-opacity"
            >
              <PhaseChip name={currentPhase?.name || 'Sprint Phase'} />
            </button>

            {showPhaseMenu && (
              <div className="absolute right-0 top-7 z-50 p-1.5 rounded-xl bg-popover border border-border shadow-lg flex flex-col gap-1 w-48">
                {phases.map((ph, idx) => (
                  <button
                    key={ph.id}
                    type="button"
                    onClick={() => handleSelectPhase(ph.id)}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted text-xs flex items-center justify-between"
                  >
                    <PhaseChip name={ph.name} index={idx} />
                    {task.phaseId === ph.id && <Check className="size-3 text-muted-foreground ml-1" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Estimate / Due Date if specified */}
        {(task.estimateMin > 0 || task.dueAt) && (
          <div className="pt-2 border-t border-border/40 flex flex-col gap-2">
            {task.estimateMin > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Estimate</span>
                <EstimateChip estimateMin={task.estimateMin} />
              </div>
            )}
            {task.dueAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Due date</span>
                <DueChip dueAt={task.dueAt} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
