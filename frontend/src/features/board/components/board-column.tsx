import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import type { Task, RoomMember, BoardPhase, TaskStatus } from '@/services/types';
import { JiraCard } from './jira-card';

export interface BoardColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  members: RoomMember[];
  phases: BoardPhase[];
  isDropTarget?: boolean;
  dropIndex?: number | null;
  draggingTaskId?: string | null;
  isLeader?: boolean;
  onOpenTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onAssignToMe: (taskId: string) => void;
  onToggleBlock: (taskId: string) => void;
  onDeferTask?: (taskId: string) => void;
  onDropTaskLeader?: (taskId: string) => void;
  onInlineCreate: (status: TaskStatus, summary: string) => Promise<void>;
  onPointerDownDrag?: (e: React.PointerEvent, task: Task) => void;
  onDropTask?: (taskId: string, targetStatus: TaskStatus) => void;
  onAdvanceTaskStatus?: (taskId: string) => void;
  onDragStartTask?: (taskId: string) => void;
  onDragEndTask?: () => void;
}

export function BoardColumn({
  status,
  title,
  tasks,
  members,
  phases,
  isDropTarget = false,
  dropIndex = null,
  draggingTaskId = null,
  isLeader = false,
  onOpenTask,
  onStatusChange,
  onAssignToMe,
  onToggleBlock,
  onDeferTask,
  onDropTaskLeader,
  onInlineCreate,
  onPointerDownDrag,
  onDropTask,
  onAdvanceTaskStatus,
  onDragStartTask,
  onDragEndTask,
}: BoardColumnProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newSummary, setNewSummary] = useState('');
  const [isNativeDragOver, setIsNativeDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isCreating) {
      textareaRef.current?.focus();
    }
  }, [isCreating]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!newSummary.trim()) return;
      await onInlineCreate(status, newSummary.trim());
      setNewSummary('');
      setIsCreating(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsCreating(false);
      setNewSummary('');
    }
  };

  const activeDrop = isDropTarget || isNativeDragOver;

  return (
    <div
      data-column-status={status}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsNativeDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsNativeDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsNativeDragOver(false);
        const droppedId = e.dataTransfer.getData('text/plain') || draggingTaskId;
        if (droppedId) {
          onDropTask?.(droppedId, status);
        }
      }}
      className={cn(
        'flex flex-col rounded-[16px] p-2 bg-[#F3F3F4] dark:bg-muted/30 min-h-[480px] transition-all duration-150 border-2 border-transparent',
        activeDrop && 'bg-[#F0F7FF] dark:bg-blue-950/20 border-dashed border-blue-500 shadow-sm'
      )}
    >
      {/* Column Header (Sticky inside column) */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-2 py-1.5 mb-2 bg-[#F3F3F4]/90 dark:bg-muted/80 backdrop-blur-xs rounded-lg select-none">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-200/80 dark:bg-muted text-foreground">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Cards stack with 8px gaps */}
      <div className="flex-1 flex flex-col gap-2 relative">
        {tasks.map((task, idx) => {
          const isDragging = task.id === draggingTaskId;
          const showDropLineBefore = isDropTarget && dropIndex === idx;

          return (
            <React.Fragment key={task.id}>
              {/* Insertion Drop Line (2px blue) */}
              {showDropLineBefore && (
                <div className="h-0.5 bg-blue-600 rounded-full my-[-2px] z-20 shadow-xs" />
              )}
              <JiraCard
                task={task}
                members={members}
                phases={phases}
                isDragging={isDragging}
                isLeader={isLeader}
                onOpen={onOpenTask}
                onStatusChange={onStatusChange}
                onAssignToMe={onAssignToMe}
                onToggleBlock={onToggleBlock}
                onDeferTask={onDeferTask}
                onDropTask={onDropTaskLeader}
                onPointerDownDrag={onPointerDownDrag}
                onDragStartTask={onDragStartTask}
                onDragEndTask={onDragEndTask}
                onAdvanceTaskStatus={onAdvanceTaskStatus}
              />
            </React.Fragment>
          );
        })}

        {/* Insertion Drop Line at the bottom of the list */}
        {isDropTarget && dropIndex === tasks.length && (
          <div className="h-0.5 bg-blue-600 rounded-full my-[-2px] z-20 shadow-xs" />
        )}

        {/* Empty column state */}
        {tasks.length === 0 && !isCreating && (
          <div className="flex-1 min-h-[140px] rounded-xl border border-dashed border-border/80 flex items-center justify-center text-xs text-muted-foreground select-none">
            Drop tasks here
          </div>
        )}

        {/* Inline Create Card */}
        {isCreating && (
          <div className="bg-white dark:bg-card rounded-[12px] p-2.5 border border-border shadow-xs flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              rows={2}
              className="w-full text-xs bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <span>Press Enter to save, Esc to cancel</span>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewSummary('');
                }}
                className="hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inline Create Button (+ Create task) */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="mt-2 h-8 px-2.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-neutral-200/60 dark:hover:bg-muted flex items-center gap-1.5 transition-colors select-none"
        >
          <Plus className="size-3.5" />
          <span>Create task</span>
        </button>
      )}
    </div>
  );
}
