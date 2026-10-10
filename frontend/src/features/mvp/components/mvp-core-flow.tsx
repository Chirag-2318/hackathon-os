import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, X, ArrowRight, Link2, Check } from 'lucide-react';
import type { CoreFlowStep, Task } from '@/services/types';
import { IssueKey } from '@/features/build/ui';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export interface MvpCoreFlowProps {
  steps: CoreFlowStep[];
  allTasks: Task[];
  onUpdateSteps: (newSteps: CoreFlowStep[]) => void;
  onOpenTaskByKey?: (key: string) => void;
}

export function MvpCoreFlow({
  steps,
  allTasks,
  onUpdateSteps,
  onOpenTaskByKey,
}: MvpCoreFlowProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const workingCount = steps.filter(s => s.status === 'working').length;

  const cycleStatus = (id: string) => {
    const nextSteps = steps.map(s => {
      if (s.id !== id) return s;
      let nextStatus: CoreFlowStep['status'] = 'working';
      if (s.status === 'working') nextStatus = 'mocked';
      else if (s.status === 'mocked') nextStatus = 'notyet';
      else nextStatus = 'working';
      return { ...s, status: nextStatus };
    });
    onUpdateSteps(nextSteps);
  };

  const startEdit = (step: CoreFlowStep) => {
    setEditingId(step.id);
    setEditText(step.title);
  };

  const saveEdit = (id: string) => {
    setEditingId(null);
    if (!editText.trim()) return;
    onUpdateSteps(steps.map(s => s.id === id ? { ...s, title: editText.trim() } : s));
  };

  const addStep = () => {
    if (steps.length >= 5) return;
    const newStep: CoreFlowStep = {
      id: `cf-${Date.now()}`,
      title: `Step ${steps.length + 1}`,
      status: 'notyet',
    };
    onUpdateSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    if (steps.length <= 3) return;
    onUpdateSteps(steps.filter(s => s.id !== id));
  };

  const linkTask = (stepId: string, taskKey: string) => {
    onUpdateSteps(steps.map(s => s.id === stepId ? { ...s, taskKey } : s));
  };

  const unlinkTask = (stepId: string) => {
    onUpdateSteps(steps.map(s => s.id === stepId ? { ...s, taskKey: undefined } : s));
  };

  return (
    <div className="bg-card rounded-[24px] border border-border p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">
            Core flow
          </h3>
          <span className="h-6 px-2.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border/40 inline-flex items-center">
            {workingCount} of {steps.length} working
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Double-click to edit step title
        </span>
      </div>

      {/* Horizontal Path of Step Nodes */}
      <div className="flex items-center gap-3 flex-wrap">
        {steps.map((step, idx) => {
          const isWorking = step.status === 'working';
          const isMocked = step.status === 'mocked';

          // Connector to next step
          const nextStep = steps[idx + 1];
          const isConnectorActive = isWorking && nextStep?.status === 'working';

          return (
            <React.Fragment key={step.id}>
              {/* Node Card */}
              <div
                className={cn(
                  'group relative bg-white dark:bg-card rounded-[16px] border border-[#E7E7E9] dark:border-border p-3 flex-1 min-w-[170px] max-w-[240px] flex flex-col gap-2.5 shadow-xs transition-all duration-150',
                  'hover:shadow-md hover:border-[#D6D6DA]'
                )}
              >
                {/* Remove button (hover, min 3 steps) */}
                {steps.length > 3 && (
                  <button
                    onClick={() => removeStep(step.id)}
                    className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-neutral-200 dark:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-xs"
                    title="Remove step"
                  >
                    <X className="size-3" />
                  </button>
                )}

                {/* Top row: Number circle & Status Toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div className="size-6 rounded-full bg-neutral-100 dark:bg-muted text-foreground font-semibold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>

                  {/* StatusLozenge toggle (WORKING green, NOT YET gray, MOCKED amber) */}
                  <button
                    onClick={() => cycleStatus(step.id)}
                    className={cn(
                      'h-5 px-2 rounded-[6px] text-[10px] font-bold tracking-[0.03em] uppercase transition-colors duration-150 select-none',
                      isWorking && 'bg-[#E4F7E9] text-[#2E9E55]',
                      isMocked && 'bg-[#FEF3C7] text-[#D97706]',
                      !isWorking && !isMocked && 'bg-[#E9E9EB] text-[#5C5C61]'
                    )}
                    title="Click to cycle status"
                  >
                    {isWorking ? 'WORKING' : isMocked ? 'MOCKED' : 'NOT YET'}
                  </button>
                </div>

                {/* Step Title (editable on double click) */}
                {editingId === step.id ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(step.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => saveEdit(step.id)}
                    className="w-full text-xs font-medium bg-muted p-1 rounded border border-blue-500 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <h4
                    onDoubleClick={() => startEdit(step)}
                    className="text-xs font-medium text-foreground line-clamp-2 h-8 leading-snug cursor-text"
                    title={step.title}
                  >
                    {step.title}
                  </h4>
                )}

                {/* Linked Task Chip */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                  {step.taskKey ? (
                    <div className="flex items-center gap-1.5">
                      <IssueKey
                        issueKey={step.taskKey}
                        onClick={() => onOpenTaskByKey?.(step.taskKey!)}
                      />
                      <button
                        onClick={() => unlinkTask(step.id)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Unlink task"
                      >
                        <X className="size-2.5" />
                      </button>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                          <Link2 className="size-2.5" />
                          <span>Link task</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48 max-h-48 overflow-y-auto text-xs">
                        {allTasks.slice(0, 10).map(t => (
                          <DropdownMenuItem key={t.id} onClick={() => linkTask(step.id, t.key)}>
                            <span className="font-mono mr-1.5 text-muted-foreground">{t.key}</span>
                            <span className="truncate">{t.summary}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Animated Connector Arrow to next step */}
              {idx < steps.length - 1 && (
                <div className="flex items-center justify-center shrink-0 w-6">
                  <div
                    className={cn(
                      'h-0.5 w-full transition-colors duration-400',
                      isConnectorActive ? 'bg-emerald-500' : 'border-t-2 border-dashed border-border'
                    )}
                  />
                  <ArrowRight
                    className={cn(
                      'size-3.5 -ml-1 transition-colors duration-400 shrink-0',
                      isConnectorActive ? 'text-emerald-500' : 'text-muted-foreground/60'
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Add Step Button Node (max 5) */}
        {steps.length < 5 && (
          <button
            onClick={addStep}
            className="size-10 rounded-[16px] border-2 border-dashed border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
            title="Add core flow step"
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
