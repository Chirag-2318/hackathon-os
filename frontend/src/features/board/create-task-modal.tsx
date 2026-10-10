import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RoomMember, BoardPhase, TaskStatus, TaskPriority, Task } from '@/services/types';
import { PriorityIcon, StatusLozenge, PhaseChip } from '@/features/build/ui';

export interface CreateTaskModalProps {
  roomId: string;
  phases: BoardPhase[];
  members: RoomMember[];
  initialStatus?: TaskStatus;
  initialPhaseId?: string;
  onClose: () => void;
  onCreate: (taskDraft: Partial<Task>, createAnother: boolean) => Promise<void>;
}

export function CreateTaskModal({
  roomId,
  phases,
  members,
  initialStatus = 'todo',
  initialPhaseId,
  onClose,
  onCreate,
}: CreateTaskModalProps) {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [phaseId, setPhaseId] = useState<string>(initialPhaseId || phases[0]?.id || 'p-0');
  const [role, setRole] = useState('Frontend');
  const [estimateStr, setEstimateStr] = useState('45m');
  const [createAnother, setCreateAnother] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!summary.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Parse estimate
      let estimateMin = 45;
      const match = estimateStr.match(/(\d+)\s*(h|m|min|hours?)?/i);
      if (match) {
        const val = parseInt(match[1], 10);
        const unit = (match[2] || '').toLowerCase();
        estimateMin = unit.startsWith('h') ? val * 60 : val;
      }

      await onCreate(
        {
          summary: summary.trim(),
          description: description.trim(),
          status,
          assigneeId,
          priority,
          phaseId,
          role,
          labels: [role],
          estimateMin,
        },
        createAnother
      );

      if (createAnother) {
        setSummary('');
        setDescription('');
      } else {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-[620px] rounded-[24px] bg-card border border-border shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="h-14 px-6 border-b border-border/70 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-foreground">Create task</h2>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[72vh]">
          {/* Summary */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Summary <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              autoFocus
              required
              className="w-full h-10 px-3.5 rounded-xl border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Description</label>
            <textarea
              rows={3}
              placeholder="Add details, links, or acceptance notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-muted/30 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed font-mono"
            />
          </div>

          {/* Grid row: Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="h-9 px-3 rounded-xl border border-border bg-card text-xs text-foreground outline-none cursor-pointer"
              >
                <option value="todo">TO DO</option>
                <option value="inprogress">IN PROGRESS</option>
                <option value="done">DONE</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="h-9 px-3 rounded-xl border border-border bg-card text-xs text-foreground outline-none cursor-pointer capitalize"
              >
                <option value="highest">Highest</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="lowest">Lowest</option>
              </select>
            </div>
          </div>

          {/* Grid row: Assignee & Phase */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Assignee</label>
              <select
                value={assigneeId || ''}
                onChange={(e) => setAssigneeId(e.target.value || undefined)}
                className="h-9 px-3 rounded-xl border border-border bg-card text-xs text-foreground outline-none cursor-pointer"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Phase</label>
              <select
                value={phaseId}
                onChange={(e) => setPhaseId(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-card text-xs text-foreground outline-none cursor-pointer"
              >
                {phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid row: Role & Estimate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Role Label</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-card text-xs text-foreground outline-none cursor-pointer"
              >
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Design">Design</option>
                <option value="ML/AI">ML/AI</option>
                <option value="Presenter">Presenter</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">Estimate</label>
              <input
                type="text"
                placeholder="e.g. 45m or 2h"
                value={estimateStr}
                onChange={(e) => setEstimateStr(e.target.value)}
                className="h-9 px-3 rounded-xl border border-border bg-card text-xs text-foreground outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border/70 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createAnother}
                onChange={(e) => setCreateAnother(e.target.checked)}
                className="size-4 rounded border-border accent-neutral-900"
              />
              <span>Create another</span>
            </label>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-9 text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!summary.trim() || isSubmitting}
                className="h-9 px-5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
