import React, { useState } from 'react';
import { Check, Plus, Trash2, Search, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { boardService } from '@/services/boardService';
import type { Task, RoomMember } from '@/services/types';
import { StatusLozenge, IssueKey } from '@/features/build/ui';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';

interface TaskPrerequisitesSectionProps {
  task: Task;
  allTasks: Task[];
  members: RoomMember[];
  activeRoomId: string;
  onUpdateTask: (updated: Task) => void;
}

export function TaskPrerequisitesSection({
  task,
  allTasks,
  members,
  activeRoomId,
  onUpdateTask,
}: TaskPrerequisitesSectionProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const prerequisites = task.prerequisites || [];
  const currentPrereqIds = new Set(prerequisites.map((p) => p.id));

  // Available tasks to add (not this task, not already a prerequisite, max 8 total)
  const candidateTasks = allTasks.filter(
    (t) => t.id !== task.id && !currentPrereqIds.has(t.id) &&
      (searchQuery === '' ||
        t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Tasks waiting on this one (Unlocks)
  const unlocksTasks = allTasks.filter(
    (t) =>
      t.id !== task.id &&
      (t.dependsOn?.includes(task.key) ||
        t.dependsOn?.includes(task.id) ||
        t.prerequisites?.some((p) => p.id === task.id || p.key === task.key))
  );

  const handleAddPrerequisite = async (candidateId: string) => {
    if (prerequisites.length >= 8) {
      toast.error('Maximum 8 prerequisites per task');
      return;
    }
    const newIds = [...prerequisites.map((p) => p.id), candidateId];
    setIsUpdating(true);
    try {
      const updated = await boardService.updateDependencies(activeRoomId, task.id, newIds);
      onUpdateTask(updated);
      setShowPicker(false);
      setSearchQuery('');
      toast.success('Prerequisite added');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add prerequisite');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemovePrerequisite = async (prereqId: string) => {
    const newIds = prerequisites.map((p) => p.id).filter((id) => id !== prereqId);
    setIsUpdating(true);
    try {
      const updated = await boardService.updateDependencies(activeRoomId, task.id, newIds);
      onUpdateTask(updated);
      toast.success('Prerequisite removed');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove prerequisite');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pt-2 border-t border-border/50">
      {/* Prerequisites section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Lock className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Prerequisites ({prerequisites.length}/8)
            </span>
          </div>

          {prerequisites.length < 8 && (
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus className="size-3" /> Add prerequisite
            </button>
          )}
        </div>

        {/* Prerequisites rows */}
        {prerequisites.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {prerequisites.map((p) => {
              const fullTask = allTasks.find((t) => t.id === p.id || t.key === p.key);
              const assignee = fullTask
                ? members.find((m) => m.id === fullTask.assigneeId)
                : null;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/50 text-xs gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {p.confirmed ? (
                      <span className="size-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0" title="Done & Confirmed">
                        <Check className="size-3 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span className="size-4 rounded-full border border-muted-foreground/40 shrink-0" title="Not yet confirmed done" />
                    )}
                    <IssueKey issueKey={p.key} isDone={p.confirmed} className="font-mono text-xs font-semibold shrink-0" />
                    <span className={cn('truncate font-medium text-foreground', p.confirmed && 'text-muted-foreground line-through')}>
                      {p.title || fullTask?.summary || 'Untitled task'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {assignee && (
                      <div className="size-5 rounded-full overflow-hidden shrink-0 border border-border/40" title={assignee.name || assignee.displayName}>
                        <UserAvatar user={assignee} size={20} />
                      </div>
                    )}
                    <StatusLozenge
                      status={
                        (p.status?.toLowerCase() === 'done'
                          ? 'done'
                          : p.status?.toLowerCase() === 'inprogress' || p.status?.toLowerCase() === 'in_progress'
                          ? 'inprogress'
                          : 'todo')
                      }
                    />
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleRemovePrerequisite(p.id)}
                      className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                      title="Remove prerequisite"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic py-1">
            No prerequisites. This task can be started anytime.
          </p>
        )}

        {/* Add Prerequisite Picker */}
        {showPicker && (
          <div className="p-3 rounded-xl bg-card border border-border shadow-md flex flex-col gap-2 mt-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks to add as prerequisite..."
                autoFocus
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-muted border border-border text-foreground outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="max-h-40 overflow-y-auto flex flex-col gap-1">
              {candidateTasks.length > 0 ? (
                candidateTasks.map((cand) => (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => handleAddPrerequisite(cand.id)}
                    className="w-full text-left p-2 rounded-lg hover:bg-muted text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-semibold text-foreground shrink-0">{cand.key}</span>
                      <span className="truncate text-foreground">{cand.summary}</span>
                    </div>
                    <StatusLozenge status={cand.status} />
                  </button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground p-2 text-center">
                  No matching tasks available.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-1 border-t border-border/50">
              <Button size="sm" variant="ghost" onClick={() => setShowPicker(false)} className="h-6 text-xs px-2">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Unlocks section (tasks waiting on this one) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Unlock className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Unlocks ({unlocksTasks.length})
          </span>
        </div>

        {unlocksTasks.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {unlocksTasks.map((ut) => (
              <div
                key={ut.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-muted/20 border border-border/40 text-xs gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <IssueKey issueKey={ut.key} isDone={ut.status === 'done'} className="font-mono text-xs font-semibold shrink-0" />
                  <span className="truncate font-medium text-foreground">{ut.summary}</span>
                </div>
                <StatusLozenge status={ut.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic py-1">
            No tasks waiting on this one.
          </p>
        )}
      </div>
    </div>
  );
}
