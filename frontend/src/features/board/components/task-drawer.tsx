import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { type Task } from '@/api/client';
import { Clock, Calendar, Paperclip, MessageSquare, AlertCircle } from 'lucide-react';
import { ProgressPill } from '@/components/primitives/progress-pill';

interface TaskDrawerProps {
  task: Task | null;
  onClose: () => void;
  onToggleChecklist: (taskId: string, itemId: string, isDone: boolean) => void;
  onMarkDone: (taskId: string) => void;
}

export function TaskDrawer({ task, onClose, onToggleChecklist, onMarkDone }: TaskDrawerProps) {
  if (!task) return null;

  const totalChecks = task.checklist.length;
  const completedChecks = task.checklist.filter((c: any) => c.isDone).length;
  const progressPercent = totalChecks === 0 ? 0 : (completedChecks / totalChecks) * 100;

  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[520px] sm:w-[520px] overflow-y-auto bg-surface">
        <SheetHeader className="mb-6">
          <div className="flex gap-2 mb-2">
            {task.tags.map((tag: any) => (
              <Badge key={tag} variant="secondary" className="r-chip text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <SheetTitle className="text-xl font-bold">{task.title}</SheetTitle>
          <SheetDescription className="text-sm text-ink-muted mt-2">
            {task.description}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-ink-muted">Assignee</span>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px]">
                    {task.assigneeId ? task.assigneeId.replace('m-', 'U') : '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold">{task.assigneeId ? 'Assigned' : 'Unassigned'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-ink-muted">Role</span>
              <span className="text-sm font-semibold">{task.role}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-ink-muted">Phase</span>
              <span className="text-sm font-semibold">{task.phase}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-ink-muted">Estimate</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-ink-muted" />
                <span className="text-sm font-semibold">{task.estimate || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Linked PRs */}
          {task.linkedPrs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Linked PRs / Branches</h4>
              <div className="flex gap-2 flex-wrap">
                {task.linkedPrs.map((pr: any) => (
                  <Badge key={pr} variant="outline" className="r-chip bg-surface-sunken">
                    <Paperclip className="h-3 w-3 mr-1" /> {pr}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Checklist */}
          {totalChecks > 0 && (
            <div className="space-y-3 p-4 r-card bg-lav-50/50 border border-lav-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-lav-900">Checklist</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-lav-800">
                    {completedChecks} / {totalChecks}
                  </span>
                  {/* M07 Progress bar grows to full when checklist done */}
                  <ProgressPill value={progressPercent} barWidth="w-16" />
                </div>
              </div>
              <div className="space-y-2">
                {task.checklist.map((item: any) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 p-2 rounded hover:bg-white/50 cursor-pointer transition-colors group"
                  >
                    <Checkbox
                      checked={item.isDone}
                      onCheckedChange={(checked) => onToggleChecklist(task.id, item.id, !!checked)}
                      className="mt-0.5 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 transition-colors"
                    />
                    <span
                      className={cn(
                        'text-sm transition-all duration-200',
                        item.isDone ? 'text-ink-muted line-through' : 'text-ink group-hover:text-lav-900'
                      )}
                    >
                      {item.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Blocked state */}
          {task.tags.includes('Blocked') && (
            <div className="p-3 r-card bg-coral-50 border border-coral-200 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-coral-600 shrink-0" />
              <div>
                <h5 className="text-sm font-bold text-coral-900">Task is blocked</h5>
                <p className="text-xs text-coral-700 mt-1">
                  This task cannot proceed. Assign an owner or resolve the blocker.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between sticky bottom-0 bg-surface pb-6">
          <Button variant="outline" className="text-coral-600 border-coral-200 hover:bg-coral-50 rounded-full h-10 px-4">
            I'm blocked
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full h-10 px-4">
              Move
            </Button>
            <Button
              className="rounded-full h-10 px-6 bg-lav-600 hover:bg-lav-700 text-white"
              onClick={() => onMarkDone(task.id)}
            >
              Mark done
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
