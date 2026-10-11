import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Task, RoomMember, BoardPhase, TaskStatus, TaskPriority } from '@/services/types';
import {
  IssueKey, IssueTypeIcon, PriorityIcon, StatusLozenge, PhaseChip, DueChip
} from '@/features/build/ui';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type SortField = 'key' | 'priority' | 'due' | 'status';

export interface BoardListViewProps {
  tasks: Task[];
  members: RoomMember[];
  phases: BoardPhase[];
  onOpenTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  highest: 5,
  high: 4,
  medium: 3,
  low: 2,
  lowest: 1,
};

export function BoardListView({
  tasks,
  members,
  phases,
  onOpenTask,
  onStatusChange,
}: BoardListViewProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (status: string) => {
    setCollapsedGroups(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const handleHeaderSort = (field: SortField) => {
    if (sortField === field) {
      if (sortAsc) {
        setSortAsc(false);
      } else {
        setSortField(null);
        setSortAsc(true);
      }
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortTasks = (items: Task[]) => {
    if (!sortField) return items;
    return [...items].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'key') {
        comparison = a.key.localeCompare(b.key);
      } else if (sortField === 'priority') {
        comparison = (PRIORITY_ORDER[a.priority] || 0) - (PRIORITY_ORDER[b.priority] || 0);
      } else if (sortField === 'due') {
        const aTime = a.dueAt ? new Date(a.dueAt).getTime() : 0;
        const bTime = b.dueAt ? new Date(b.dueAt).getTime() : 0;
        comparison = aTime - bTime;
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortAsc ? comparison : -comparison;
    });
  };

  const groups: { status: TaskStatus; label: string }[] = [
    { status: 'todo', label: 'TO DO' },
    { status: 'inprogress', label: 'IN PROGRESS' },
    { status: 'done', label: 'DONE' },
  ];

  return (
    <div className="bg-card rounded-[24px] border border-border overflow-hidden shadow-xs">
      {/* Table Header Row */}
      <div className="flex items-center px-4 py-2.5 bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground select-none">
        <div className="w-10 shrink-0">Type</div>
        <button
          onClick={() => handleHeaderSort('key')}
          className="w-24 shrink-0 flex items-center gap-1 hover:text-foreground text-left"
        >
          <span>Key</span>
          {sortField === 'key' ? (
            sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
          ) : (
            <ArrowUpDown className="size-3 opacity-40" />
          )}
        </button>
        <div className="flex-1 min-w-[200px]">Summary</div>
        <div className="w-28 shrink-0">Phase</div>
        <div className="w-16 shrink-0 text-center">Assignee</div>
        <button
          onClick={() => handleHeaderSort('priority')}
          className="w-20 shrink-0 flex items-center justify-center gap-1 hover:text-foreground"
        >
          <span>Priority</span>
          {sortField === 'priority' ? (
            sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
          ) : (
            <ArrowUpDown className="size-3 opacity-40" />
          )}
        </button>
        <button
          onClick={() => handleHeaderSort('due')}
          className="w-24 shrink-0 flex items-center gap-1 hover:text-foreground"
        >
          <span>Due</span>
          {sortField === 'due' ? (
            sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
          ) : (
            <ArrowUpDown className="size-3 opacity-40" />
          )}
        </button>
        <button
          onClick={() => handleHeaderSort('status')}
          className="w-32 shrink-0 flex items-center gap-1 hover:text-foreground"
        >
          <span>Status</span>
          {sortField === 'status' ? (
            sortAsc ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
          ) : (
            <ArrowUpDown className="size-3 opacity-40" />
          )}
        </button>
      </div>

      {/* Grouped Sections */}
      {groups.map(grp => {
        const groupTasks = sortTasks(tasks.filter(t => t.status === grp.status));
        const isCollapsed = Boolean(collapsedGroups[grp.status]);

        return (
          <div key={grp.status} className="border-b border-border/60 last:border-b-0">
            {/* Section Header */}
            <button
              onClick={() => toggleGroup(grp.status)}
              className="w-full h-9 px-4 flex items-center gap-2 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
            >
              {isCollapsed ? (
                <ChevronRight className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {grp.label} ({groupTasks.length})
              </span>
            </button>

            {/* Rows (40px) */}
            {!isCollapsed && (
              <div className="divide-y divide-border/40">
                {groupTasks.map(task => {
                  const assignee = members.find(m => m.id === task.assigneeId);
                  const phaseIndex = phases.findIndex(p => p.id === task.phaseId);
                  const phase = phases[phaseIndex] || { name: 'Sprint' };
                  const isDone = task.status === 'done';

                  return (
                    <div
                      key={task.id}
                      onClick={() => onOpenTask(task)}
                      className="flex items-center px-4 h-10 hover:bg-muted/30 cursor-pointer transition-colors text-xs select-none"
                    >
                      <div className="w-10 shrink-0 flex items-center">
                        <IssueTypeIcon type="task" isDone={isDone} />
                      </div>
                      <div className="w-24 shrink-0 font-mono">
                        <IssueKey issueKey={task.key} isDone={isDone} />
                      </div>
                      <div className={cn('flex-1 min-w-[200px] truncate font-medium text-foreground pr-4', isDone && 'line-through text-muted-foreground')}>
                        {task.summary}
                      </div>
                      <div className="w-28 shrink-0 truncate">
                        <PhaseChip name={phase.name} index={phaseIndex >= 0 ? phaseIndex : 0} />
                      </div>
                      <div className="w-16 shrink-0 flex items-center justify-center">
                        {assignee ? (
                          <div
                            className="size-6 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center"
                            title={assignee.name || 'Assignee'}
                          >
                            {(assignee.name || 'TM').slice(0, 2).toUpperCase()}
                          </div>
                        ) : (
                          <div className="size-6 rounded-full border border-dashed border-muted-foreground/60 flex items-center justify-center text-muted-foreground/60 text-[10px]">
                            ?
                          </div>
                        )}
                      </div>
                      <div className="w-20 shrink-0 flex items-center justify-center">
                        <PriorityIcon priority={task.priority} />
                      </div>
                      <div className="w-24 shrink-0">
                        <DueChip dueAt={task.dueAt} />
                      </div>
                      <div className="w-32 shrink-0" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div>
                              <StatusLozenge status={task.status} showChevron />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 text-xs">
                            <DropdownMenuItem onClick={() => onStatusChange(task.id, 'todo')}>
                              TO DO
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(task.id, 'inprogress')}>
                              IN PROGRESS
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(task.id, 'done')}>
                              DONE
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}

                {groupTasks.length === 0 && (
                  <div className="h-10 px-4 flex items-center text-xs text-muted-foreground italic">
                    No tasks in this section
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
