import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, User } from 'lucide-react';
import type { Task, RoomMember, BoardPhase, TaskStatus } from '@/services/types';
import { PhaseChip } from '@/features/build/ui';
import { JiraCard } from './jira-card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { UserName } from '@/components/ui/user-name';

export interface SwimlaneGroup {
  id: string;
  title: string;
  type: 'assignee' | 'phase' | 'unassigned';
  avatar?: string;
  phaseIndex?: number;
  tasks: Task[];
}

export interface BoardSwimlanesProps {
  groupBy: 'assignee' | 'phase';
  tasks: Task[];
  members: RoomMember[];
  phases: BoardPhase[];
  onOpenTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onAssignToMe: (taskId: string) => void;
  onToggleBlock: (taskId: string) => void;
  onPointerDownDrag?: (e: React.PointerEvent, task: Task) => void;
}

export function BoardSwimlanes({
  groupBy,
  tasks,
  members,
  phases,
  onOpenTask,
  onStatusChange,
  onAssignToMe,
  onToggleBlock,
  onPointerDownDrag,
}: BoardSwimlanesProps) {
  const [collapsedLanes, setCollapsedLanes] = useState<Record<string, boolean>>({});

  const toggleLane = (id: string) => {
    setCollapsedLanes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Build groups
  const groups: SwimlaneGroup[] = [];

  if (groupBy === 'assignee') {
    members.forEach(m => {
      const memberTasks = tasks.filter(t => t.assigneeId === m.id);
      groups.push({
        id: m.id,
        title: m.name || 'Member',
        type: 'assignee',
        avatar: m.avatar,
        tasks: memberTasks,
      });
    });

    const unassignedTasks = tasks.filter(t => !t.assigneeId);
    if (unassignedTasks.length > 0) {
      groups.push({
        id: 'unassigned',
        title: 'Unassigned',
        type: 'unassigned',
        tasks: unassignedTasks,
      });
    }
  } else {
    phases.forEach((p, idx) => {
      const phaseTasks = tasks.filter(t => t.phaseId === p.id);
      groups.push({
        id: p.id,
        title: p.name,
        type: 'phase',
        phaseIndex: idx,
        tasks: phaseTasks,
      });
    });

    // Orphan tasks (not matching any phase)
    const phaseIds = new Set(phases.map(p => p.id));
    const otherTasks = tasks.filter(t => !phaseIds.has(t.phaseId));
    if (otherTasks.length > 0) {
      groups.push({
        id: 'other',
        title: 'Other',
        type: 'phase',
        phaseIndex: 0,
        tasks: otherTasks,
      });
    }
  }

  const columns: { status: TaskStatus; label: string }[] = [
    { status: 'todo', label: 'TO DO' },
    { status: 'inprogress', label: 'IN PROGRESS' },
    { status: 'done', label: 'DONE' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Sticky Top Column Headers once */}
      <div className="sticky top-0 z-20 grid grid-cols-3 gap-4 px-2 py-2 bg-background/95 backdrop-blur-xs border-b border-border">
        {columns.map(col => {
          const count = tasks.filter(t => t.status === col.status).length;
          return (
            <div key={col.status} className="flex items-center gap-2">
              <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                {col.label}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-muted text-foreground">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Lanes */}
      {groups.map(group => {
        const isCollapsed = Boolean(collapsedLanes[group.id]);

        return (
          <div key={group.id} className="flex flex-col rounded-[16px] border border-border/80 overflow-hidden bg-card">
            {/* Lane Header Row (36px high) */}
            <button
              onClick={() => toggleLane(group.id)}
              className="h-9 px-3 flex items-center justify-between bg-muted/40 hover:bg-muted/70 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                {isCollapsed ? (
                  <ChevronRight className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}

                {group.type === 'assignee' && (() => {
                  const m = members.find((x) => x.id === group.id);
                  return (
                    <div className="size-5 rounded-full overflow-hidden shrink-0">
                      <UserAvatar
                        user={m || { displayName: group.title, avatarUrl: group.avatar }}
                        size={20}
                      />
                    </div>
                  );
                })()}
                {group.type === 'unassigned' && (
                  <div className="size-5 rounded-full border border-dashed border-muted-foreground flex items-center justify-center text-muted-foreground">
                    <User className="size-2.5" />
                  </div>
                )}
                {group.type === 'phase' && (
                  <PhaseChip name={group.title} index={group.phaseIndex} />
                )}

                <span className="text-xs font-semibold text-foreground">
                  {group.title}
                </span>

                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-neutral-200/80 dark:bg-muted text-muted-foreground">
                  {group.tasks.length}
                </span>
              </div>
            </button>

            {/* Lane Body: 3-column grid */}
            {!isCollapsed && (
              <div className="grid grid-cols-3 gap-4 p-3 bg-muted/10 min-h-[100px]">
                {columns.map(col => {
                  const colTasks = group.tasks.filter(t => t.status === col.status);

                  return (
                    <div key={col.status} className="flex flex-col gap-2 min-h-[40px]">
                      {colTasks.map(task => (
                        <JiraCard
                          key={task.id}
                          task={task}
                          members={members}
                          phases={phases}
                          onOpen={onOpenTask}
                          onStatusChange={onStatusChange}
                          onAssignToMe={onAssignToMe}
                          onToggleBlock={onToggleBlock}
                          onPointerDownDrag={onPointerDownDrag}
                        />
                      ))}
                      {colTasks.length === 0 && (
                        <div className="h-10 rounded-lg border border-dashed border-border/40 flex items-center justify-center text-[11px] text-muted-foreground/60 select-none">
                          No tasks
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
