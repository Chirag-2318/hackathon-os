import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Circle, Bell, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Idea, RoomMember } from '@/services/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface IdeateRightRailProps {
  roomId: string;
  isLocked: boolean;
  canFinish: boolean;
  canReopen: boolean;
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  ideas: Idea[];
  members: RoomMember[];
  isDonePending: boolean;
  onMarkDone: () => void;
  onReopen: () => void;
}

export function IdeateRightRail({
  roomId,
  isLocked,
  canFinish,
  canReopen,
  counts,
  ideas,
  members,
  isDonePending,
  onMarkDone,
  onReopen,
}: IdeateRightRailProps) {
  const navigate = useNavigate();

  const approvedCount = counts.approved ?? 0;
  const pendingCount = counts.pending ?? 0;
  const rejectedCount = counts.rejected ?? 0;
  const totalCount = counts.total || (approvedCount + pendingCount + rejectedCount) || 1;

  const isRuleMet = approvedCount >= 1;

  // Compute segmented progress bar percentages
  const approvedPct = Math.round((approvedCount / (totalCount || 1)) * 100);
  const pendingPct = Math.round((pendingCount / (totalCount || 1)) * 100);
  const rejectedPct = Math.round((rejectedCount / (totalCount || 1)) * 100);

  // Filter approved ideas for compact list
  const approvedIdeas = ideas.filter((i) => i.status === 'approved');

  // Identify who has posted ideas
  const authorsSet = new Set(
    ideas.map((i) => String((i as any).authorId || (i as any).author?.id || ''))
  );

  const handleNudge = (member: RoomMember) => {
    const memberName = member.displayName || (member as any).username || 'teammate';
    navigator.clipboard?.writeText?.(`Hey ${memberName}, don't forget to drop your hackathon ideas in our room!`);
    toast.success(`Nudge copied for ${memberName}`);
  };

  return (
    <aside className="sticky top-6 flex flex-col divide-y divide-border/60 gap-6">
      {/* SECTION 1: Ideation Progress */}
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Ideation progress
          </h2>
          {isLocked && (
            <span className="font-mono text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
              COMPLETED
            </span>
          )}
        </div>

        {/* Segmented bar */}
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/60 gap-0.5">
          {approvedPct > 0 && (
            <div
              style={{ width: `${approvedPct}%` }}
              className="bg-emerald-500 transition-all duration-300"
              title={`Approved: ${approvedCount}`}
            />
          )}
          {pendingPct > 0 && (
            <div
              style={{ width: `${pendingPct}%` }}
              className="bg-muted-foreground/30 transition-all duration-300"
              title={`Pending: ${pendingCount}`}
            />
          )}
          {rejectedPct > 0 && (
            <div
              style={{ width: `${rejectedPct}%` }}
              className="bg-red-500/60 transition-all duration-300"
              title={`Rejected: ${rejectedCount}`}
            />
          )}
        </div>

        {/* Big mono counts */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground">Approved</span>
            <span className="font-mono text-2xl font-bold text-foreground">
              {approvedCount}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground">Pending</span>
            <span className="font-mono text-2xl font-bold text-foreground">
              {pendingCount}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-muted-foreground">Rejected</span>
            <span className="font-mono text-2xl font-bold text-foreground">
              {rejectedCount}
            </span>
          </div>
        </div>

        {/* Checklist rule line */}
        <div className="pt-1">
          {isRuleMet ? (
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <span className="size-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Check className="size-2.5 stroke-[3]" />
              </span>
              <span>Ready for the plan</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Circle className="size-3 text-muted-foreground/60 shrink-0" />
              <span>1 approved idea needed</span>
            </div>
          )}
        </div>

        {/* Navigation & Completion Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <TooltipProvider>
            {!isRuleMet ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      disabled
                      className="w-full text-xs font-semibold h-9 gap-1.5"
                    >
                      <span>Next: Go to Plan</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  At least 1 approved idea is required to advance to the plan.
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                onClick={() => navigate(`/app/room/${roomId}/plan`)}
                className="w-full text-xs font-semibold h-9 gap-1.5"
              >
                <span>Next: Go to Plan</span>
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </TooltipProvider>

          {/* Leader specific done / reopen buttons */}
          {!isLocked && canFinish && isRuleMet && (
            <Button
              variant="outline"
              size="sm"
              disabled={isDonePending}
              onClick={onMarkDone}
              className="w-full text-xs h-8 border-border/80 hover:bg-muted/60"
            >
              <Lock className="size-3 mr-1.5 text-muted-foreground" />
              <span>{isDonePending ? 'Completing...' : 'Mark ideation done'}</span>
            </Button>
          )}

          {isLocked && canReopen && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReopen}
              className="w-full text-xs h-8 border-border/80 hover:bg-muted/60"
            >
              <Unlock className="size-3 mr-1.5 text-muted-foreground" />
              <span>Reopen ideation</span>
            </Button>
          )}
        </div>
      </div>

      {/* SECTION 2: Team */}
      <div className="flex flex-col gap-3 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Team ({members.length})
          </h2>
        </div>

        <div className="flex flex-col gap-2">
          {members.length > 0 ? (
            members.map((member) => {
              const memberId = String((member as any).userId || member.id || '');
              const hasPosted = authorsSet.has(memberId);

              return (
                <div
                  key={memberId}
                  className="flex items-center justify-between gap-2 py-1 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative">
                      <UserAvatar user={member} size={24} />
                      {hasPosted && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 border border-background"
                          title="Posted ideas"
                        />
                      )}
                    </div>
                    <span className="truncate font-medium text-foreground">
                      {member.displayName || (member as any).username || 'Team member'}
                    </span>
                  </div>

                  {!hasPosted && canFinish && !isLocked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNudge(member)}
                      className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                      title="Nudge teammate to share ideas"
                    >
                      <Bell className="size-3" />
                      <span>Nudge</span>
                    </Button>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground italic">No team members joined yet.</p>
          )}
        </div>
      </div>

      {/* SECTION 3: Approved Ideas */}
      <div className="flex flex-col gap-3 pt-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Approved ideas ({approvedIdeas.length})
        </h2>

        {approvedIdeas.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {approvedIdeas.map((idea) => (
              <div
                key={idea.id}
                className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/40 text-xs text-foreground"
              >
                <Check className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="line-clamp-2 leading-snug">
                  {idea.text}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No ideas approved yet.
          </p>
        )}
      </div>
    </aside>
  );
}
