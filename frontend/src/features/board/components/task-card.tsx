import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Paperclip, MessageSquare, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/api/client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  overlay?: boolean;
}

export function TaskCard({ task, onClick, overlay }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'frontend':
        return 'bg-blue-100 text-blue-900';
      case 'backend':
        return 'bg-lime-100 text-lime-900';
      case 'design':
        return 'bg-peach-100 text-peach-900';
      case 'pitch':
        return 'bg-lav-100 text-lav-900';
      case 'must-have':
        return 'bg-amber-100 text-amber-900';
      case 'blocked':
        return 'bg-coral-100 text-coral-900';
      default:
        return 'bg-surface-sunken text-ink';
    }
  };

  const isDone = task.status === 'Done';
  const isBlocked = task.tags.includes('Blocked') || task.status === 'Blocked';

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'relative flex flex-col p-4 r-card gap-3 cursor-grab active:cursor-grabbing hover:bg-lav-50 group',
        isDragging && 'opacity-50',
        overlay && 'shadow-e2 rotate-2 scale-105 cursor-grabbing',
        isBlocked && 'border-coral-300 bg-coral-50',
        isDone && 'opacity-70 bg-surface-sunken'
      )}
    >
      {/* Top Row */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {task.tags.map((tag: any) => (
            <Badge
              key={tag}
              variant="secondary"
              className={cn(
                'r-chip px-2 py-0.5 text-xs font-semibold',
                getTagColor(tag),
                isBlocked && tag.toLowerCase() === 'blocked' && 'bg-coral-600 text-white'
              )}
            >
              {tag}
            </Badge>
          ))}
          {isDone && (
            <Badge variant="secondary" className="r-chip px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-900">
              Done
            </Badge>
          )}
        </div>
        <button
          className="text-ink-muted hover:text-ink shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
          aria-label="Task options"
          onClick={(e) => {
            e.stopPropagation();
            // Open kebab menu
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Title & Description */}
      <div className="space-y-1">
        <h3 className={cn('text-sm font-semibold line-clamp-2', isDone && 'line-through text-ink-muted')}>
          {task.title}
        </h3>
        <p className="text-xs text-ink-muted line-clamp-2">{task.description}</p>
      </div>

      {/* Owner Row */}
      <div className="flex items-center gap-2 mt-auto">
        {task.assigneeId ? (
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">
              {task.assigneeId.replace('m-', 'U')}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-6 w-6 rounded-full border border-dashed border-border flex items-center justify-center text-ink-muted">
            ?
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-xs font-semibold leading-none">{task.assigneeId ? 'Owner' : 'Unassigned'}</span>
          <span className="text-[10px] text-ink-muted leading-none mt-0.5">{task.role}</span>
        </div>
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between mt-2 text-ink-muted">
        <div className="flex gap-3">
          {task.due && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="text-[10px]">{task.due}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {task.linkedPrs.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span className="text-[10px]">{task.linkedPrs.length}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            <span className="text-[10px]">0</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
