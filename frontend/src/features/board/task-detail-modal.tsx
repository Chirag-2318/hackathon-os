import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Flag, Copy, Trash2, Check, Plus, AlertTriangle, MessageSquare, Send, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { boardService } from '@/services/boardService';
import type { Task, RoomMember, BoardPhase, TaskStatus, TaskPriority } from '@/services/types';
import { IssueKey, IssueTypeIcon, StatusLozenge } from '@/features/build/ui';
import { MarkdownRenderer } from '@/utils/markdown';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { TaskDetailsSidebar } from './components/task-details-sidebar';
import { TaskActivitySection } from './components/task-activity-section';
import { TaskPrerequisitesSection } from './components/task-prerequisites-section';

export interface TaskDetailModalProps {
  task: Task;
  allTasks: Task[];
  members: RoomMember[];
  phases: BoardPhase[];
  onClose: () => void;
  onUpdateTask: (updated: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDeferTask?: (taskId: string) => void;
  onDropTask?: (taskId: string) => void;
  onOpenTaskByKey?: (key: string) => void;
}

export function TaskDetailModal({
  task,
  allTasks,
  members,
  phases,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onDeferTask,
  onDropTask,
}: TaskDetailModalProps) {
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id ? String(currentUser.id) : '';
  const currentMember = members.find((m) => m.id === currentUserId) || members[0] || null;
  const isLeader = currentMember?.role === 'leader';

  const { roomId: paramRoomId } = useParams<{ roomId?: string }>();
  const activeRoomId = task.roomId || paramRoomId || '';

  // Editable summary
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState(task.summary);

  // Editable description
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState(task.description);

  // Subtasks
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);

  // Leader review actions
  const [showRequestChangesNote, setShowRequestChangesNote] = useState(false);
  const [requestChangesNote, setRequestChangesNote] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Focus trap and restore refs
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Lock body scroll while open and restore on close
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    modalRef.current?.focus();
    return () => {
      previousActiveElementRef.current?.focus();
    };
  }, []);

  // Sync when task prop changes
  useEffect(() => {
    setSummaryText(task.summary);
    setDescText(task.description);
    setIsEditingSummary(false);
    setIsEditingDesc(false);
  }, [task.id, task.summary, task.description]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditingSummary) {
          setIsEditingSummary(false);
          setSummaryText(task.summary);
          return;
        }
        if (isEditingDesc) {
          setIsEditingDesc(false);
          setDescText(task.description);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingSummary, isEditingDesc, onClose, task.summary, task.description]);

  const handleSaveSummary = async () => {
    if (!summaryText.trim() || summaryText === task.summary) {
      setIsEditingSummary(false);
      return;
    }
    try {
      const updated = await boardService.updateTask(
        activeRoomId,
        task.id,
        { summary: summaryText.trim(), version: (task as any).version }
      );
      onUpdateTask(updated);
      setIsEditingSummary(false);
      toast.success('Task title updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update title');
    }
  };

  const handleSaveDesc = async () => {
    try {
      const updated = await boardService.updateTask(
        activeRoomId,
        task.id,
        { description: descText, version: (task as any).version }
      );
      onUpdateTask(updated);
      setIsEditingDesc(false);
      toast.success('Description saved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update description');
    }
  };

  const handleToggleFlag = async () => {
    try {
      const willFlag = !task.flagged;
      const updated = await boardService.flagTask(
        activeRoomId,
        task.id,
        willFlag,
        willFlag ? 'Blocked' : undefined
      );
      onUpdateTask(updated);
      toast.success(willFlag ? 'Flagged as blocked' : 'Unblocked task');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update flag');
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      const updated = await boardService.moveTask(
        activeRoomId,
        task.id,
        newStatus,
        0,
        (task as any).version
      );
      onUpdateTask(updated);
      toast.success(`Status updated to ${newStatus === 'todo' ? 'To Do' : newStatus === 'inprogress' ? 'In Progress' : 'Done'}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    }
  };

  const handleAssigneeChange = async (newAssigneeId?: string) => {
    try {
      const updated = await boardService.assignTask(activeRoomId, task.id, newAssigneeId || null);
      onUpdateTask(updated);
      const member = members.find((m) => m.id === newAssigneeId);
      toast.success(member ? `Assigned to ${member.displayName}` : 'Task unassigned');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign task');
    }
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    try {
      const updated = await boardService.updateTask(
        activeRoomId,
        task.id,
        { priority: newPriority, version: (task as any).version }
      );
      onUpdateTask(updated);
      toast.success(`Priority updated to ${newPriority}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update priority');
    }
  };

  const handlePhaseChange = async (newPhaseId: string) => {
    try {
      const updated = await boardService.updateTask(
        activeRoomId,
        task.id,
        { phaseId: newPhaseId, version: (task as any).version }
      );
      onUpdateTask(updated);
      toast.success('Phase updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update phase');
    }
  };

  const handleToggleSubtask = async (subtaskId: string, done: boolean) => {
    try {
      const updated = await boardService.toggleSubtask(activeRoomId, task.id, subtaskId, done);
      onUpdateTask(updated);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update checklist item');
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskText.trim()) return;
    try {
      const updated = await boardService.addSubtask(activeRoomId, task.id, newSubtaskText.trim());
      onUpdateTask(updated);
      setNewSubtaskText('');
      setShowAddSubtask(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add checklist item');
    }
  };

  const handleAddComment = async (text: string) => {
    const updated = await boardService.addComment(activeRoomId, task.id, text);
    onUpdateTask(updated);
  };

  const handleConfirmDone = async () => {
    setIsReviewing(true);
    try {
      const updated = await boardService.confirmTask(activeRoomId, task.id);
      onUpdateTask(updated);
      toast.success('Task confirmed done');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to confirm task');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!requestChangesNote.trim()) {
      toast.error('Please enter a note explaining what needs to be changed');
      return;
    }
    setIsReviewing(true);
    try {
      const updated = await boardService.requestChanges(activeRoomId, task.id, requestChangesNote.trim());
      onUpdateTask(updated);
      setShowRequestChangesNote(false);
      setRequestChangesNote('');
      toast.success('Changes requested. Task moved back to In Progress');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to request changes');
    } finally {
      setIsReviewing(false);
    }
  };

  const subtasks = task.subtasks || [];
  const phase = phases.find((p) => p.id === task.phaseId) || phases[0];

  // Blocked prerequisites calculation
  const prerequisites = task.prerequisites || [];
  const unconfirmedPrereqs = prerequisites.filter((p) => !p.confirmed);
  const unconfirmedTitles = unconfirmedPrereqs.map((p) => p.title || p.key);

  const handleKeyDownModal = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && modalRef.current) {
      const focusables = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        zIndex: 100,
      }}
      className="bg-black/35 animate-in fade-in duration-160 p-3 sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={modalRef}
        tabIndex={-1}
        onKeyDown={handleKeyDownModal}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="w-[min(920px,92vw)] max-h-[85vh] flex flex-col rounded-[20px] bg-card border border-border shadow-2xl overflow-hidden outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/70 bg-card">
          <div className="flex items-center gap-2 text-xs font-mono">
            <IssueTypeIcon type="task" isDone={task.status === 'done'} />
            <span className="text-muted-foreground">{phase?.name || 'Sprint'} /</span>
            <IssueKey issueKey={task.key} isDone={task.status === 'done'} className="font-bold text-foreground text-sm" />
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant={task.flagged ? 'destructive' : 'ghost'}
              size="sm"
              onClick={handleToggleFlag}
              className="h-8 px-2.5 text-xs gap-1.5"
              title={task.flagged ? 'Task is blocked' : 'Flag as blocked'}
            >
              <Flag className={cn('size-3.5', task.flagged && 'fill-current')} />
              <span>{task.flagged ? 'Blocked' : 'Flag'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Task link copied');
              }}
              className="h-8 size-8 p-0"
              title="Copy link"
            >
              <Copy className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteTask(task.id)}
              className="h-8 size-8 p-0 text-muted-foreground hover:text-destructive"
              title="Delete task"
            >
              <Trash2 className="size-3.5" />
            </Button>
            {isLeader && onDeferTask && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeferTask(task.id)}
                className="h-8 px-2 text-xs gap-1"
                title="Defer task to next phase"
              >
                <ArrowRight className="size-3.5" />
                <span>Defer</span>
              </Button>
            )}
            {isLeader && onDropTask && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDropTask(task.id)}
                className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-destructive"
                title="Drop task"
              >
                <Trash2 className="size-3.5" />
                <span>Drop</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 size-8 p-0 rounded-full"
              title="Close (Esc)"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Amber notice if blocked */}
        {task.isBlocked && unconfirmedTitles.length > 0 && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2 shrink-0">
            <AlertTriangle className="size-4 shrink-0" />
            <span className="font-medium">
              You can't start this task yet. Finish: {unconfirmedTitles.join(', ')}.
            </span>
          </div>
        )}

        {/* Leader Review Banner in Done status */}
        {task.status === 'done' && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-muted/40 border border-border flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs">
                {task.reviewState === 'CONFIRMED' ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <Check className="size-4" /> Confirmed done by leader
                  </span>
                ) : task.reviewState === 'CHANGES_REQUESTED' ? (
                  <span className="text-rose-600 font-semibold">
                    Changes requested: {task.reviewNote || 'Please revise task deliverable'}
                  </span>
                ) : (
                  <span className="text-muted-foreground font-medium">
                    Awaiting leader confirmation
                  </span>
                )}
              </div>

              {isLeader && task.reviewState !== 'CONFIRMED' && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleConfirmDone}
                    disabled={isReviewing}
                    className="h-7 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    Confirm done
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRequestChangesNote(!showRequestChangesNote)}
                    disabled={isReviewing}
                    className="h-7 text-xs px-3"
                  >
                    Request changes
                  </Button>
                </div>
              )}
            </div>

            {showRequestChangesNote && isLeader && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <input
                  type="text"
                  value={requestChangesNote}
                  onChange={(e) => setRequestChangesNote(e.target.value)}
                  placeholder="Explain what needs to be revised..."
                  className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-card border border-border text-foreground outline-none focus:ring-1 focus:ring-rose-500"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRequestChanges}
                  disabled={isReviewing || !requestChangesNote.trim()}
                  className="h-7 text-xs px-3"
                >
                  Send
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRequestChangesNote(false)}
                  className="h-7 text-xs px-2"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto min-h-0">
          {/* Main Left Content */}
          <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
            {/* Title / Summary */}
            <div>
              {isEditingSummary ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    onBlur={handleSaveSummary}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveSummary();
                      if (e.key === 'Escape') {
                        setIsEditingSummary(false);
                        setSummaryText(task.summary);
                      }
                    }}
                    autoFocus
                    className="w-full text-lg sm:text-xl font-bold bg-muted/40 text-foreground px-3 py-1.5 rounded-xl border border-border outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button size="sm" onClick={handleSaveSummary}>Save</Button>
                </div>
              ) : (
                <h2
                  onClick={() => setIsEditingSummary(true)}
                  className="text-lg sm:text-xl font-bold text-foreground hover:bg-muted/40 px-2 py-1 -ml-2 rounded-xl cursor-text transition-colors"
                >
                  {task.summary}
                </h2>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </span>
              {isEditingDesc ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    rows={4}
                    value={descText}
                    onChange={(e) => setDescText(e.target.value)}
                    placeholder="Add details, instructions, or notes..."
                    autoFocus
                    className="w-full text-xs text-foreground p-3 rounded-xl border border-border bg-muted/20 outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingDesc(false)} className="h-7 text-xs">Cancel</Button>
                    <Button size="sm" onClick={handleSaveDesc} className="h-7 text-xs">Save</Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="min-h-[50px] p-2.5 -ml-2.5 rounded-xl hover:bg-muted/40 cursor-text transition-colors text-xs text-foreground leading-relaxed"
                >
                  {task.description ? (
                    <MarkdownRenderer content={task.description} />
                  ) : (
                    <span className="text-muted-foreground italic">Add a description...</span>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks / Checklist */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Checklist ({subtasks.filter((s) => s.done).length}/{subtasks.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddSubtask(!showAddSubtask)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus className="size-3" /> Add item
                </button>
              </div>

              {subtasks.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {subtasks.map((st) => (
                    <label
                      key={st.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={st.done}
                        onChange={(e) => handleToggleSubtask(st.id, e.target.checked)}
                        className="size-4 rounded border-border accent-blue-600 cursor-pointer"
                      />
                      <span className={cn('text-xs flex-1', st.done && 'line-through text-muted-foreground')}>
                        {st.text}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {showAddSubtask && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="New checklist item..."
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(); }}
                    autoFocus
                    className="flex-1 text-xs px-3 py-1.5 rounded-xl bg-muted/40 border border-border text-foreground outline-none"
                  />
                  <Button size="sm" onClick={handleAddSubtask} className="h-7 text-xs">Add</Button>
                </div>
              )}
            </div>

            {/* Prerequisites & Unlocks Section */}
            <TaskPrerequisitesSection
              task={task}
              allTasks={allTasks}
              members={members}
              activeRoomId={activeRoomId}
              onUpdateTask={onUpdateTask}
            />

            {/* Activity Stream */}
            <TaskActivitySection
              task={task}
              members={members}
              currentMember={currentMember}
              onAddComment={handleAddComment}
            />
          </div>

          {/* Right Details Panel */}
          <TaskDetailsSidebar
            task={task}
            members={members}
            phases={phases}
            currentUserId={currentUserId}
            onStatusChange={handleStatusChange}
            onAssigneeChange={handleAssigneeChange}
            onPriorityChange={handlePriorityChange}
            onPhaseChange={handlePhaseChange}
          />
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
