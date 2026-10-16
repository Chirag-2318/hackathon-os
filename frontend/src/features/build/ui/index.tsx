import React from 'react';
import { cn } from '@/lib/utils';
import {
  Check, CheckSquare, Layers, ChevronsUp, ChevronUp, Equal, ChevronDown,
  ChevronsDown, Clock, AlertTriangle, MessageSquare, User
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { TaskStatus, TaskPriority } from '@/services/types';

// ── IssueKey ─────────────────────────────────────────────────────────────────
export interface IssueKeyProps {
  issueKey: string;
  isDone?: boolean;
  className?: string;
  onClick?: () => void;
}

export function IssueKey({ issueKey, isDone, className, onClick }: IssueKeyProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'text-[12px] font-medium tracking-tight text-muted-foreground select-none font-mono',
        isDone && 'line-through text-muted-foreground/60',
        onClick && 'hover:text-blue-600 hover:underline cursor-pointer',
        className
      )}
    >
      {issueKey}
    </span>
  );
}

// ── IssueTypeIcon ────────────────────────────────────────────────────────────
export function IssueTypeIcon({ type = 'task', isDone = false, className }: { type?: 'task' | 'subtask'; isDone?: boolean; className?: string }) {
  if (isDone) {
    return (
      <div
        title="Completed Task"
        className={cn('size-4 rounded-[4px] bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs', className)}
      >
        <Check className="size-3 stroke-[3]" />
      </div>
    );
  }

  if (type === 'subtask') {
    return (
      <div
        title="Subtask"
        className={cn('size-4 rounded-[4px] bg-[#7E57C2] text-white flex items-center justify-center shrink-0 shadow-2xs', className)}
      >
        <Layers className="size-2.5 stroke-[2.5]" />
      </div>
    );
  }

  return (
    <div
      title="Task"
      className={cn('size-4 rounded-[4px] bg-[#2F9BEA] text-white flex items-center justify-center shrink-0 shadow-2xs', className)}
    >
      <Check className="size-3 stroke-[3]" />
    </div>
  );
}

// ── PriorityIcon ─────────────────────────────────────────────────────────────
const PRIORITY_META: Record<TaskPriority, { label: string; color: string; icon: React.ReactNode }> = {
  highest: {
    label: 'Highest',
    color: '#E53935',
    icon: <ChevronsUp className="size-3.5 stroke-[2.5]" />,
  },
  high: {
    label: 'High',
    color: '#FB8C00',
    icon: <ChevronUp className="size-3.5 stroke-[2.5]" />,
  },
  medium: {
    label: 'Medium',
    color: '#FFB300',
    icon: <Equal className="size-3.5 stroke-[3]" />,
  },
  low: {
    label: 'Low',
    color: '#1E88E5',
    icon: <ChevronDown className="size-3.5 stroke-[2.5]" />,
  },
  lowest: {
    label: 'Lowest',
    color: '#78909C',
    icon: <ChevronsDown className="size-3.5 stroke-[2.5]" />,
  },
};

export function PriorityIcon({ priority = 'medium', className }: { priority?: TaskPriority; className?: string }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.medium;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn('inline-flex items-center justify-center shrink-0', className)}
          style={{ color: meta.color }}
        >
          {meta.icon}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {meta.label} Priority
      </TooltipContent>
    </Tooltip>
  );
}

// ── StatusLozenge ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  todo: { bg: '#E9E9EB', text: '#5C5C61', label: 'TO DO' },
  inprogress: { bg: '#E3F1FF', text: '#1D7FD1', label: 'IN PROGRESS' },
  done: { bg: '#E4F7E9', text: '#2E9E55', label: 'DONE' },
  blocked: { bg: '#FDE6E6', text: '#C73E41', label: 'BLOCKED' },
};

export interface StatusLozengeProps {
  status: TaskStatus | 'blocked';
  onClick?: () => void;
  showChevron?: boolean;
  className?: string;
}

export function StatusLozenge({ status, onClick, showChevron = false, className }: StatusLozengeProps) {
  const meta = STATUS_STYLES[status] || STATUS_STYLES.todo;

  return (
    <span
      onClick={onClick}
      style={{ backgroundColor: meta.bg, color: meta.text }}
      className={cn(
        'h-5 px-2 rounded-[6px] text-[11px] font-mono font-bold tracking-[0.03em] uppercase inline-flex items-center gap-1 select-none whitespace-nowrap transition-transform duration-100',
        onClick && 'hover:scale-[1.02] cursor-pointer active:scale-95',
        className
      )}
    >
      <span>{meta.label}</span>
      {showChevron && <ChevronDown className="size-3 opacity-60" />}
    </span>
  );
}

// ── PhaseChip ────────────────────────────────────────────────────────────────
const PHASE_TINTS = [
  'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
];

export function PhaseChip({ name, index = 0, className }: { name: string; index?: number; className?: string }) {
  const tint = PHASE_TINTS[index % PHASE_TINTS.length];

  return (
    <span
      className={cn(
        'h-6 px-2.5 rounded-full text-[11px] font-semibold border inline-flex items-center truncate max-w-[140px]',
        tint,
        className
      )}
      title={name}
    >
      {name.replace(/^Phase\s*\d+:\s*/i, '')}
    </span>
  );
}

// ── DueChip ──────────────────────────────────────────────────────────────────
export function DueChip({ dueAt, className }: { dueAt?: string; className?: string }) {
  if (!dueAt) return null;

  const dueMs = new Date(dueAt).getTime();
  const now = Date.now();
  const diffHours = (dueMs - now) / (1000 * 3600);
  const isOverdue = diffHours < 0;
  const isSoon = diffHours >= 0 && diffHours <= 6;

  let label = 'Due soon';
  if (isOverdue) {
    label = 'Overdue';
  } else if (diffHours < 24) {
    label = `${Math.ceil(diffHours)}h left`;
  } else {
    label = `${Math.ceil(diffHours / 24)}d left`;
  }

  return (
    <span
      className={cn(
        'h-5 px-1.5 rounded-full text-[10px] font-mono font-semibold inline-flex items-center gap-1 shrink-0',
        isOverdue
          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          : isSoon
          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          : 'bg-muted text-muted-foreground',
        className
      )}
    >
      <Clock className="size-2.5" />
      <span>{label}</span>
    </span>
  );
}

// ── EstimateChip ─────────────────────────────────────────────────────────────
export function EstimateChip({ estimateMin, className }: { estimateMin?: number; className?: string }) {
  if (!estimateMin || estimateMin <= 0) return null;

  const text = estimateMin >= 60
    ? `${(estimateMin / 60).toFixed(estimateMin % 60 === 0 ? 0 : 1)}h`
    : `${estimateMin}m`;

  return (
    <span
      className={cn(
        'h-5 px-1.5 rounded-[6px] bg-muted text-[10px] font-medium text-muted-foreground font-mono inline-flex items-center shrink-0',
        className
      )}
    >
      {text}
    </span>
  );
}

// ── SubtaskProgress ──────────────────────────────────────────────────────────
export function SubtaskProgress({ done, total, className }: { done: number; total: number; className?: string }) {
  if (!total || total === 0) return null;

  const radius = 6;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(done / total, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      title={`${done} of ${total} subtasks completed`}
      className={cn('inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground shrink-0', className)}
    >
      <div className="relative size-4">
        <svg className="size-4 -rotate-90" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r={radius} stroke="#E5E7EB" strokeWidth="2" fill="none" />
          <circle
            cx="8" cy="8" r={radius}
            stroke="#10B981"
            strokeWidth="2"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span>{done}/{total}</span>
    </div>
  );
}

// ── CommentCount ─────────────────────────────────────────────────────────────
export function CommentCount({ count, className }: { count?: number; className?: string }) {
  if (!count || count <= 0) return null;

  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground shrink-0', className)}>
      <MessageSquare className="size-3" />
      <span>{count}</span>
    </span>
  );
}
