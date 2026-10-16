import * as React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DashedContainer } from '@/components/primitives/dashed-container';
import { Check, X, FileText, Sparkles, ExternalLink, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PlanRightRailProps {
  roomId: string;
  hasIdeas: boolean;
  ideasCount: number;
  hasBrief: boolean;
  hasSkills: boolean;
  hasNotes?: boolean;
  membersCount?: number;
  isLeader?: boolean;
  missingInputs?: string[];
  onDownloadIdeas?: () => void;
  onDownloadContext?: () => void;
}

export function PlanRightRail({
  roomId,
  hasIdeas,
  ideasCount,
  hasBrief,
  hasSkills,
  hasNotes = false,
  membersCount = 1,
  isLeader = false,
  missingInputs = [],
  onDownloadIdeas,
  onDownloadContext,
}: PlanRightRailProps) {
  return (
    <div className="flex flex-col gap-6 w-72 shrink-0">
      {/* Context Pack Card */}
      <DashedContainer className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">Context pack</h3>
          <span className="text-[11px] text-ink-muted">fields sent</span>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {/* Idea Row */}
          <div className="flex items-center justify-between text-xs py-1 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex size-4 items-center justify-center rounded-full',
                  hasIdeas
                    ? 'bg-emerald-500/20 text-emerald-600'
                    : 'bg-rose-500/20 text-rose-500'
                )}
              >
                {hasIdeas ? <Check className="size-2.5" strokeWidth={3} /> : <X className="size-2.5" strokeWidth={3} />}
              </div>
              <span className="font-medium text-ink">
                Idea ({ideasCount} approved)
              </span>
            </div>
            {!hasIdeas && (
              <Link
                to={`/app/room/${roomId}/ideate`}
                className="text-[11px] text-lav-600 hover:underline flex items-center gap-0.5"
              >
                Fix <ArrowUpRight className="size-3" />
              </Link>
            )}
          </div>

          {/* Rubric and Brief Row */}
          <div className="flex items-center justify-between text-xs py-1 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex size-4 items-center justify-center rounded-full',
                  hasBrief
                    ? 'bg-emerald-500/20 text-emerald-600'
                    : 'bg-rose-500/20 text-rose-500'
                )}
              >
                {hasBrief ? <Check className="size-2.5" strokeWidth={3} /> : <X className="size-2.5" strokeWidth={3} />}
              </div>
              <span className="font-medium text-ink">Rubric and Brief</span>
            </div>
            {!hasBrief && (
              <Link
                to={`/app/room/${roomId}/brief`}
                className="text-[11px] text-lav-600 hover:underline flex items-center gap-0.5"
              >
                Fix <ArrowUpRight className="size-3" />
              </Link>
            )}
          </div>

          {/* Skills and roles Row */}
          <div className="flex items-center justify-between text-xs py-1 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex size-4 items-center justify-center rounded-full',
                  hasSkills
                    ? 'bg-emerald-500/20 text-emerald-600'
                    : 'bg-rose-500/20 text-rose-500'
                )}
              >
                {hasSkills ? <Check className="size-2.5" strokeWidth={3} /> : <X className="size-2.5" strokeWidth={3} />}
              </div>
              <span className="font-medium text-ink">Skills and roles</span>
            </div>
            {!hasSkills && (
              <Link
                to={`/app/room/${roomId}/settings`}
                className="text-[11px] text-lav-600 hover:underline flex items-center gap-0.5"
              >
                Fix <ArrowUpRight className="size-3" />
              </Link>
            )}
          </div>

          {/* Project notes Row */}
          <div className="flex items-center justify-between text-xs py-1">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex size-4 items-center justify-center rounded-full',
                  hasNotes
                    ? 'bg-emerald-500/20 text-emerald-600'
                    : 'bg-neutral-500/20 text-muted-foreground'
                )}
              >
                {hasNotes ? <Check className="size-2.5" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-muted-foreground" />}
              </div>
              <span className="font-medium text-ink">Project notes</span>
            </div>
            {!hasNotes && (
              <span className="text-[11px] text-muted-foreground">Optional</span>
            )}
          </div>
        </div>

        {/* Files mini list */}
        <div className="pt-2 border-t border-border/60 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
            Context Files
          </span>
          <div className="flex flex-col gap-1 text-xs">
            <button
              type="button"
              onClick={onDownloadContext || onDownloadIdeas}
              className="flex items-center justify-between p-1.5 rounded hover:bg-surface-raised transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-ink">
                <FileText className="size-3.5 text-emerald-600" />
                <span className="font-mono text-[11px]">context.md</span>
              </div>
              <span className="text-[10px] text-ink-muted">Available</span>
            </button>
          </div>
        </div>

        {/* Leader Included in Prompt Checklist */}
        <div className="pt-2 border-t border-border/60 flex flex-col gap-1 text-[11px]">
          <span className="font-semibold text-ink-muted uppercase tracking-wider text-[10px]">
            Included in prompt
          </span>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-ink-muted">
            <span className="flex items-center gap-1"><Check className="size-3 text-emerald-500" /> Brief</span>
            <span className="flex items-center gap-1"><Check className="size-3 text-emerald-500" /> Rubric</span>
            <span className="flex items-center gap-1"><Check className="size-3 text-emerald-500" /> Rules</span>
            <span className="flex items-center gap-1"><Check className="size-3 text-emerald-500" /> Team ({membersCount})</span>
            <span className="flex items-center gap-1"><Check className="size-3 text-emerald-500" /> Ideas</span>
            <span className="flex items-center gap-1"><Check className="size-3 text-emerald-500" /> Notes</span>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-2 flex gap-2 items-start text-[11px] text-ink-muted bg-surface-sunken p-2.5 rounded-card border border-border">
          <AlertCircle className="size-3.5 shrink-0 text-amber-500 mt-0.5" />
          <p>This prompt contains your project facts. It stays on the server until copied.</p>
        </div>
      </DashedContainer>
    </div>
  );
}
