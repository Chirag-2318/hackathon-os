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
  onDownloadIdeas?: () => void;
  onDownloadContext?: () => void;
}

export function PlanRightRail({
  roomId,
  hasIdeas,
  ideasCount,
  hasBrief,
  hasSkills,
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

          {/* Rubric Row */}
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
              <span className="font-medium text-ink">Rubric / Brief</span>
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

          {/* Skills Row */}
          <div className="flex items-center justify-between text-xs py-1">
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
              <span className="font-medium text-ink">Skills & Roles</span>
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
        </div>

        {/* Files mini list */}
        <div className="pt-2 border-t border-border/60 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
            Context Files
          </span>
          <div className="flex flex-col gap-1 text-xs">
            <button
              type="button"
              onClick={onDownloadIdeas}
              className="flex items-center justify-between p-1.5 rounded hover:bg-surface-raised transition-colors text-left"
            >
              <div className="flex items-center gap-1.5 text-ink">
                <FileText className="size-3.5 text-lav-600" />
                <span className="font-mono text-[11px]">ideas.md</span>
              </div>
              <span className="text-[10px] text-ink-muted">Available</span>
            </button>
            <button
              type="button"
              onClick={onDownloadContext}
              className="flex items-center justify-between p-1.5 rounded hover:bg-surface-raised transition-colors text-left"
            >
              <div className="flex items-center gap-1.5 text-ink">
                <FileText className="size-3.5 text-emerald-600" />
                <span className="font-mono text-[11px]">context.md</span>
              </div>
              <span className="text-[10px] text-ink-muted">Available</span>
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-2 flex gap-2 items-start text-[11px] text-ink-muted bg-surface-sunken p-2.5 rounded-card border border-border">
          <AlertCircle className="size-3.5 shrink-0 text-amber-500 mt-0.5" />
          <p>This prompt contains your idea text. It goes to the AI service you paste it into.</p>
        </div>
      </DashedContainer>

      {/* Pro Upgrade Card */}
      <div className="bg-surface-raised border border-border rounded-card p-4 shadow-e1 flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 text-ink font-bold text-xs">
          <Sparkles className="size-4 text-lav-600" />
          <span>Skip copy-paste with Pro</span>
        </div>
        <p className="text-[11px] text-ink-muted leading-relaxed">
          Connect your API keys or upgrade to Managed to let the app generate these files automatically.
        </p>
        <button
          type="button"
          className="w-full h-8 text-xs font-semibold rounded-control bg-ink text-surface hover:opacity-90 transition-opacity mt-1 cursor-pointer"
        >
          Upgrade
        </button>
      </div>
    </div>
  );
}
