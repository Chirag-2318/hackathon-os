import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Flag, Copy, MoreHorizontal, Trash2, Check, Plus, Bold, Italic, List, Link2,
  Calendar, User, Clock, AlertTriangle, ShieldAlert, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { boardService } from '@/services/boardService';
import { getCurrentRole, CURRENT_USER_ID } from '@/services/mockStore';
import type { Task, RoomMember, BoardPhase, TaskStatus, TaskPriority } from '@/services/types';
import {
  IssueKey, IssueTypeIcon, PriorityIcon, StatusLozenge, PhaseChip,
  DueChip, EstimateChip, SubtaskProgress
} from '@/features/build/ui';
import { MarkdownRenderer } from '@/utils/markdown';
import { Button } from '@/components/ui/button';

export interface TaskDetailModalProps {
  task: Task;
  allTasks: Task[];
  members: RoomMember[];
  phases: BoardPhase[];
  onClose: () => void;
  onUpdateTask: (updated: Task) => void;
  onDeleteTask: (taskId: string) => void;
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
  onOpenTaskByKey,
}: TaskDetailModalProps) {
  const isLeader = getCurrentRole() === 'leader';
  const currentMember = members.find(m => m.id === CURRENT_USER_ID);

  // Editable summary
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState(task.summary);

  // Editable description
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState(task.description);

  // Flag / Block popover
  const [showFlagPopover, setShowFlagPopover] = useState(false);
  const [blockReasonInput, setBlockReasonInput] = useState(task.blockedReason || '');

  // Add acceptance & subtask inputs
  const [newAcceptanceText, setNewAcceptanceText] = useState('');
  const [showAddAcceptance, setShowAddAcceptance] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);

  // Activity tabs: 'all' | 'comments' | 'history'
  const [activityTab, setActivityTab] = useState<'all' | 'comments' | 'history'>('all');
  const [commentText, setCommentText] = useState('');
  const [isFocusedComment, setIsFocusedComment] = useState(false);

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Dropdown menus
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showPhaseMenu, setShowPhaseMenu] = useState(false);

  // Sync internal state when task changes (e.g. following deep link or related task)
  useEffect(() => {
    setSummaryText(task.summary);
    setDescText(task.description);
    setBlockReasonInput(task.blockedReason || '');
    setIsEditingSummary(false);
    setIsEditingDesc(false);
  }, [task.id]);

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
        if (showFlagPopover || showStatusMenu || showAssigneeMenu || showPriorityMenu || showPhaseMenu) {
          setShowFlagPopover(false);
          setShowStatusMenu(false);
          setShowAssigneeMenu(false);
          setShowPriorityMenu(false);
          setShowPhaseMenu(false);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingSummary, isEditingDesc, showFlagPopover, showStatusMenu, showAssigneeMenu, showPriorityMenu, showPhaseMenu, task.summary, task.description, onClose]);

  const assignee = members.find(m => m.id === task.assigneeId);
  const reporter = members.find(m => m.id === task.reporterId) || currentMember;
  const currentPhase = phases.find(p => p.id === task.phaseId);

  // Reverse dependencies: tasks that depend on this task
  const blockedTasks = allTasks.filter(t => (t.dependsOn || []).includes(task.id) || (t.dependsOn || []).includes(task.key));
  const dependsOnTasks = allTasks.filter(t => (task.dependsOn || []).includes(t.id) || (task.dependsOn || []).includes(t.key));

  const handleSaveSummary = async () => {
    if (!summaryText.trim() || summaryText === task.summary) {
      setIsEditingSummary(false);
      return;
    }
    const updated = await boardService.updateTask(task.roomId, task.id, { summary: summaryText.trim() }, 'Summary updated');
    onUpdateTask(updated);
    setIsEditingSummary(false);
  };

  const handleSaveDesc = async () => {
    const updated = await boardService.updateTask(task.roomId, task.id, { description: descText }, 'Description updated');
    onUpdateTask(updated);
    setIsEditingDesc(false);
  };

  const handleToggleFlag = async () => {
    if (!task.flagged) {
      setShowFlagPopover(true);
    } else {
      const updated = await boardService.updateTask(task.roomId, task.id, { flagged: false, blockedReason: undefined }, 'Unflagged task');
      onUpdateTask(updated);
      toast.success('Task unflagged');
    }
  };

  const handleConfirmFlag = async () => {
    const updated = await boardService.updateTask(
      task.roomId,
      task.id,
      { flagged: true, blockedReason: blockReasonInput.trim() || 'Blocked by team dependency' },
      `Flagged as blocked: ${blockReasonInput.trim() || 'Blocked'}`
    );
    onUpdateTask(updated);
    setShowFlagPopover(false);
    toast.error('Task flagged as blocked');
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setShowStatusMenu(false);
    const updated = await boardService.updateTaskStatus(task.roomId, task.id, newStatus, currentMember?.displayName || 'Aarav');
    onUpdateTask(updated);
  };

  const handleAssigneeChange = async (newAssigneeId?: string) => {
    setShowAssigneeMenu(false);
    const targetMember = members.find(m => m.id === newAssigneeId);
    const text = newAssigneeId ? `${targetMember?.displayName || 'Teammate'} was assigned` : 'Unassigned';
    const updated = await boardService.updateTask(task.roomId, task.id, { assigneeId: newAssigneeId }, text);
    onUpdateTask(updated);
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    setShowPriorityMenu(false);
    const updated = await boardService.updateTask(task.roomId, task.id, { priority: newPriority }, `Priority changed to ${newPriority}`);
    onUpdateTask(updated);
  };

  const handlePhaseChange = async (newPhaseId: string) => {
    setShowPhaseMenu(false);
    const targetPhase = phases.find(p => p.id === newPhaseId);
    const updated = await boardService.updateTask(task.roomId, task.id, { phaseId: newPhaseId }, `Moved to ${targetPhase?.name || 'Phase'}`);
    onUpdateTask(updated);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?task=${task.key}`;
    navigator.clipboard.writeText(url);
    toast.success('Task link copied to clipboard');
  };

  const handleAddAcceptanceItem = async () => {
    if (!newAcceptanceText.trim()) return;
    const acceptance = [...(task.acceptance || []), newAcceptanceText.trim()];
    const updated = await boardService.updateTask(task.roomId, task.id, { acceptance });
    onUpdateTask(updated);
    setNewAcceptanceText('');
    setShowAddAcceptance(false);
  };

  const handleAddSubtaskItem = async () => {
    if (!newSubtaskText.trim()) return;
    const updated = await boardService.addSubtask(task.roomId, task.id, newSubtaskText.trim());
    onUpdateTask(updated);
    setNewSubtaskText('');
    setShowAddSubtask(false);
  };

  const handleToggleSubtask = async (subtaskId: string, done: boolean) => {
    const updated = await boardService.toggleSubtask(task.roomId, task.id, subtaskId, done);
    onUpdateTask(updated);
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    const updated = await boardService.addComment(task.roomId, task.id, commentText.trim(), CURRENT_USER_ID);
    onUpdateTask(updated);
    setCommentText('');
    setIsFocusedComment(false);
    toast.success('Comment posted');
  };

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.done).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-[920px] max-h-[86vh] rounded-[24px] bg-card border border-border shadow-2xl flex flex-col overflow-hidden font-sans"
      >
        {/* ── Modal Header (56px) ── */}
        <div className="h-14 px-6 border-b border-border/70 flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center gap-2.5">
            <IssueTypeIcon isDone={task.status === 'done'} />
            <span className="text-xs text-muted-foreground font-medium">
              {currentPhase?.name.replace(/^Phase\s*\d+:\s*/i, '') || 'Sprint'} /
            </span>
            <IssueKey issueKey={task.key} isDone={task.status === 'done'} className="text-xs font-bold" />

            {task.flagged && (
              <span className="h-5 px-2 rounded-[6px] bg-rose-500/10 text-rose-600 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                <AlertTriangle className="size-3" /> BLOCKED
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 relative">
            {/* Flag / Block Button */}
            <button
              type="button"
              onClick={handleToggleFlag}
              title={task.flagged ? 'Clear blocked flag' : 'Flag as blocked'}
              className={cn(
                'size-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
                task.flagged ? 'bg-rose-500/10 text-rose-600' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Flag className="size-4" />
            </button>

            {/* Flag Popover */}
            {showFlagPopover && (
              <div className="absolute right-16 top-10 z-50 p-4 rounded-xl bg-card border border-border shadow-xl flex flex-col gap-3 w-80">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                  <ShieldAlert className="size-4" /> Flag as blocked
                </div>
                <input
                  type="text"
                  placeholder="What is blocking this task?"
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmFlag(); }}
                  autoFocus
                  className="w-full text-xs px-3 py-2 rounded-lg bg-muted text-foreground outline-none"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowFlagPopover(false)} className="h-7 text-xs">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleConfirmFlag} className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white">
                    Flag task
                  </Button>
                </div>
              </div>
            )}

            {/* Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy task link"
              className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <Copy className="size-4" />
            </button>

            {/* Leader Delete Menu */}
            {isLeader && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  title="More actions"
                  className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="size-4" />
                </button>

                {showDeleteConfirm && (
                  <div className="absolute right-0 top-10 z-50 p-3 rounded-xl bg-card border border-border shadow-xl flex flex-col gap-2 w-48">
                    <p className="text-xs text-muted-foreground">Delete this task?</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        onDeleteTask(task.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 text-center cursor-pointer"
                    >
                      Delete task
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Close modal (Esc)"
              className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer ml-1"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* ── Modal Body (Two columns with hairline divider) ── */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0">
          {/* ── LEFT COLUMN (62%) ── */}
          <div className="flex-1 md:w-[62%] p-6 md:p-8 flex flex-col gap-7 md:border-r border-border/60">
            {/* Summary */}
            <div>
              {isEditingSummary ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    rows={2}
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveSummary();
                      }
                    }}
                    autoFocus
                    className="w-full text-lg font-semibold text-foreground p-2 rounded-xl border border-blue-500 bg-muted/30 outline-none resize-none leading-snug"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingSummary(false)} className="h-7 text-xs">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveSummary} className="h-7 text-xs">
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <h2
                  onClick={() => setIsEditingSummary(true)}
                  className="text-xl font-semibold text-foreground leading-snug hover:bg-muted/40 p-1.5 -ml-1.5 rounded-xl cursor-text transition-colors group"
                >
                  {task.summary}
                </h2>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </span>
              {isEditingDesc ? (
                <div className="flex flex-col gap-2">
                  {/* Markdown Toolbar */}
                  <div className="flex items-center gap-1 p-1 bg-muted rounded-t-xl border border-b-0 border-border text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => setDescText(descText + '**bold**')}
                      className="size-7 rounded hover:bg-card flex items-center justify-center cursor-pointer"
                    >
                      <Bold className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescText(descText + '*italic*')}
                      className="size-7 rounded hover:bg-card flex items-center justify-center cursor-pointer"
                    >
                      <Italic className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescText(descText + '\n- list item')}
                      className="size-7 rounded hover:bg-card flex items-center justify-center cursor-pointer"
                    >
                      <List className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescText(descText + '[link](https://)')}
                      className="size-7 rounded hover:bg-card flex items-center justify-center cursor-pointer"
                    >
                      <Link2 className="size-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={descText}
                    onChange={(e) => setDescText(e.target.value)}
                    autoFocus
                    className="w-full text-sm text-foreground p-3 rounded-b-xl border border-border bg-muted/30 outline-none resize-y leading-relaxed font-mono"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingDesc(false)} className="h-7 text-xs">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveDesc} className="h-7 text-xs">
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="min-h-[60px] p-3 -ml-3 rounded-xl hover:bg-muted/40 cursor-text transition-colors"
                >
                  {task.description ? (
                    <MarkdownRenderer content={task.description} />
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Add a description...</span>
                  )}
                </div>
              )}
            </div>

            {/* Acceptance Criteria */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Acceptance Criteria ({task.acceptance?.length || 0})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddAcceptance(!showAddAcceptance)}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  + Add item
                </button>
              </div>

              {task.acceptance && task.acceptance.length > 0 && (
                <div className="flex flex-col gap-2">
                  {task.acceptance.map((crit, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-foreground">
                      <div className="size-4 rounded-[4px] border border-border bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="size-2.5 text-muted-foreground" />
                      </div>
                      <span className="leading-snug">{crit}</span>
                    </div>
                  ))}
                </div>
              )}

              {showAddAcceptance && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Enter acceptance criterion..."
                    value={newAcceptanceText}
                    onChange={(e) => setNewAcceptanceText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddAcceptanceItem(); }}
                    autoFocus
                    className="flex-1 text-xs px-3 py-2 rounded-xl bg-muted text-foreground outline-none"
                  />
                  <Button size="sm" onClick={handleAddAcceptanceItem} className="h-8 text-xs">
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Subtasks
                  </span>
                  <SubtaskProgress done={completedSubtasks} total={subtasks.length} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSubtask(!showAddSubtask)}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  + Add subtask
                </button>
              </div>

              {subtasks.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/40 transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={st.done}
                        onChange={(e) => handleToggleSubtask(st.id, e.target.checked)}
                        className="size-4 rounded border-border text-foreground accent-neutral-900 cursor-pointer"
                      />
                      <span className={cn('text-sm flex-1 leading-tight', st.done && 'line-through text-muted-foreground')}>
                        {st.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {showAddSubtask && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="What needs to be done?"
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtaskItem(); }}
                    autoFocus
                    className="flex-1 text-xs px-3 py-2 rounded-xl bg-muted text-foreground outline-none"
                  />
                  <Button size="sm" onClick={handleAddSubtaskItem} className="h-8 text-xs">
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Activity Stream */}
            <div className="flex flex-col gap-4 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Activity
                </span>
                <div className="inline-flex h-7 items-center rounded-lg bg-muted p-0.5 text-xs text-muted-foreground">
                  {(['all', 'comments', 'history'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActivityTab(tab)}
                      className={cn(
                        'px-2 py-0.5 rounded-md capitalize font-medium transition-all cursor-pointer',
                        activityTab === tab ? 'bg-card text-foreground font-semibold shadow-xs' : 'hover:text-foreground'
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Composer */}
              <div className="flex items-start gap-3">
                <div
                  className="size-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-1"
                  style={{ backgroundColor: currentMember?.avatarColor || '#6366F1' }}
                >
                  {currentMember?.initials || 'AM'}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <textarea
                    rows={isFocusedComment ? 3 : 1}
                    placeholder="Add a comment..."
                    value={commentText}
                    onFocus={() => setIsFocusedComment(true)}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full text-xs text-foreground p-2.5 rounded-xl border border-border bg-muted/30 outline-none resize-none leading-relaxed"
                  />
                  {isFocusedComment && (
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsFocusedComment(false);
                          setCommentText('');
                        }}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handlePostComment} className="h-7 text-xs">
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments & History List */}
              <div className="flex flex-col gap-3 pt-2">
                {/* Comments (Oldest first) */}
                {(activityTab === 'all' || activityTab === 'comments') &&
                  task.comments?.map((c) => {
                    const cAuthor = members.find(m => m.id === c.authorId);
                    return (
                      <div key={c.id} className="flex items-start gap-3 text-xs">
                        <div
                          className="size-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: cAuthor?.avatarColor || '#6366F1' }}
                        >
                          {cAuthor?.initials || 'AM'}
                        </div>
                        <div className="flex-1 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-foreground">{cAuthor?.displayName || 'Teammate'}</span>
                            <span className="text-muted-foreground text-[11px]">
                              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-foreground leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    );
                  })}

                {/* History (Newest first) */}
                {(activityTab === 'all' || activityTab === 'history') &&
                  task.history?.map((h) => {
                    const hActor = members.find(m => m.id === h.actorId);
                    return (
                      <div key={h.id} className="flex items-center gap-2.5 text-xs text-muted-foreground pl-2 py-0.5">
                        <span className="size-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                        <span className="font-medium text-foreground">{hActor?.displayName || 'Team'}:</span>
                        <span>{h.text}</span>
                        <span className="text-[11px] ml-auto">
                          {formatDistanceToNow(new Date(h.at), { addSuffix: true })}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: DETAILS PANEL (38%) ── */}
          <div className="md:w-[38%] p-6 flex flex-col gap-4 bg-muted/10 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-1">
              Details
            </span>

            <div className="flex flex-col gap-3 text-xs">
              {/* Status */}
              <div className="flex items-center justify-between relative py-1">
                <span className="text-muted-foreground w-24 shrink-0">Status</span>
                <div className="flex-1">
                  <StatusLozenge
                    status={task.status}
                    showChevron
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                  />
                  {showStatusMenu && (
                    <div className="absolute right-0 top-8 z-50 p-1 rounded-xl bg-card border border-border shadow-lg flex flex-col gap-1 w-36">
                      {(['todo', 'inprogress', 'done'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleStatusChange(s)}
                          className="w-full text-left p-1.5 rounded-lg hover:bg-muted text-xs cursor-pointer"
                        >
                          <StatusLozenge status={s} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Assignee */}
              <div className="flex items-center justify-between relative py-1">
                <span className="text-muted-foreground w-24 shrink-0">Assignee</span>
                <div className="flex-1 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => setShowAssigneeMenu(!showAssigneeMenu)}
                    className="flex items-center gap-2 hover:bg-muted px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {assignee ? (
                      <>
                        <div
                          className="size-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
                          style={{ backgroundColor: assignee.avatarColor }}
                        >
                          {assignee.initials}
                        </div>
                        <span className="font-medium text-foreground">{assignee.displayName}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </button>

                  {task.assigneeId !== CURRENT_USER_ID && (
                    <button
                      type="button"
                      onClick={() => handleAssigneeChange(CURRENT_USER_ID)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Assign to me
                    </button>
                  )}

                  {showAssigneeMenu && (
                    <div className="absolute right-0 top-8 z-50 p-1.5 rounded-xl bg-card border border-border shadow-lg flex flex-col gap-1 w-48">
                      <button
                        type="button"
                        onClick={() => handleAssigneeChange(undefined)}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted text-xs text-muted-foreground italic cursor-pointer"
                      >
                        Unassigned
                      </button>
                      {members.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleAssigneeChange(m.id)}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted text-xs flex items-center gap-2 cursor-pointer"
                        >
                          <div
                            className="size-4 rounded-full text-white text-[8px] font-bold flex items-center justify-center shrink-0"
                            style={{ backgroundColor: m.avatarColor }}
                          >
                            {m.initials}
                          </div>
                          <span>{m.displayName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reporter */}
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground w-24 shrink-0">Reporter</span>
                <span className="flex-1 font-medium text-foreground px-2">
                  {reporter?.displayName || 'Aarav Mehta'}
                </span>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between relative py-1">
                <span className="text-muted-foreground w-24 shrink-0">Priority</span>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                    className="flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <PriorityIcon priority={task.priority} />
                    <span className="capitalize font-medium text-foreground">{task.priority}</span>
                  </button>

                  {showPriorityMenu && (
                    <div className="absolute right-0 top-8 z-50 p-1 rounded-xl bg-card border border-border shadow-lg flex flex-col gap-1 w-36">
                      {(['highest', 'high', 'medium', 'low', 'lowest'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePriorityChange(p)}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted text-xs flex items-center gap-2 capitalize cursor-pointer"
                        >
                          <PriorityIcon priority={p} />
                          <span>{p}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Phase */}
              <div className="flex items-center justify-between relative py-1">
                <span className="text-muted-foreground w-24 shrink-0">Phase</span>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => setShowPhaseMenu(!showPhaseMenu)}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <PhaseChip name={currentPhase?.name || 'Sprint Phase'} />
                  </button>

                  {showPhaseMenu && (
                    <div className="absolute right-0 top-8 z-50 p-1.5 rounded-xl bg-card border border-border shadow-lg flex flex-col gap-1 w-48">
                      {phases.map((ph, idx) => (
                        <button
                          key={ph.id}
                          type="button"
                          onClick={() => handlePhaseChange(ph.id)}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted text-xs cursor-pointer"
                        >
                          <PhaseChip name={ph.name} index={idx} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground w-24 shrink-0">Role</span>
                <span className="px-2.5 py-0.5 rounded-md bg-muted text-[11px] font-semibold text-foreground">
                  {task.role}
                </span>
              </div>

              {/* Estimate */}
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground w-24 shrink-0">Estimate</span>
                <EstimateChip estimateMin={task.estimateMin} />
              </div>

              {/* Due date */}
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground w-24 shrink-0">Due date</span>
                <DueChip dueAt={task.dueAt} />
              </div>

              {/* Blocked by (dependsOn) */}
              <div className="flex flex-col gap-1 pt-2 border-t border-border/40">
                <span className="text-muted-foreground">Blocked by:</span>
                {dependsOnTasks.length === 0 ? (
                  <span className="text-muted-foreground italic">None</span>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {dependsOnTasks.map((t) => (
                      <span
                        key={t.id}
                        onClick={() => onOpenTaskByKey?.(t.key)}
                        className="px-2 py-0.5 rounded-md bg-muted text-blue-600 font-mono text-[11px] hover:underline cursor-pointer"
                      >
                        {t.key}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Blocks */}
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-muted-foreground">Blocks:</span>
                {blockedTasks.length === 0 ? (
                  <span className="text-muted-foreground italic">None</span>
                ) : (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {blockedTasks.map((t) => (
                      <span
                        key={t.id}
                        onClick={() => onOpenTaskByKey?.(t.key)}
                        className="px-2 py-0.5 rounded-md bg-muted text-blue-600 font-mono text-[11px] hover:underline cursor-pointer"
                      >
                        {t.key}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="mt-auto pt-4 border-t border-border/50 text-[11px] text-muted-foreground flex flex-col gap-0.5">
              <span>Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
              <span>Updated {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
