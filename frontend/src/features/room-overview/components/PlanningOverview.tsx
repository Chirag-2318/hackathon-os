import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  roomService, briefService, ideaService, crowdService, planService, prepService
} from '@/services';
import type { Room, RoomStage, PrepItem, RoomMember, Brief } from '@/services/types';
import { TagChip, TimeChip, Checkbox } from '@/features/home/components/HomeDesignSystem';
import {
  Check, Lock, ChevronRight, FileText, Lightbulb, Users,
  ExternalLink, Sparkles, Copy, Plus, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PlanningOverviewProps {
  roomId: string;
}

function formatStartsIn(startDateStr: string | null): { text: string; urgent: boolean } {
  if (!startDateStr) return { text: 'No start date', urgent: false };
  const diff = new Date(startDateStr).getTime() - Date.now();
  if (diff <= 0) return { text: 'Event started', urgent: true };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  if (days > 0) {
    return { text: `Event starts in ${days}d ${remHours}h`, urgent: false };
  }
  return { text: `Event starts in ${hours}h`, urgent: hours < 24 };
}

export function PlanningOverview({ roomId }: PlanningOverviewProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [teamTab, setTeamTab] = useState<'members' | 'skills'>('members');

  // Queries
  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomService.getRoom(roomId),
  });

  const { data: brief } = useQuery({
    queryKey: ['brief', roomId],
    queryFn: () => briefService.getBrief(roomId),
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ['ideas', roomId],
    queryFn: () => ideaService.listIdeas(roomId),
  });

  const { data: crowdRows = [] } = useQuery({
    queryKey: ['crowd', roomId],
    queryFn: () => crowdService.getCrowdRows(roomId),
  });

  const { data: planState } = useQuery({
    queryKey: ['plan-state', roomId],
    queryFn: () => planService.getPlanState(roomId),
  });

  const { data: prepItems = [] } = useQuery({
    queryKey: ['prep', roomId],
    queryFn: () => prepService.getPrepItems(roomId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members', roomId],
    queryFn: () => roomService.getMembers(roomId),
  });

  const memberList: RoomMember[] = Array.isArray(members)
    ? members
    : Array.isArray((members as any)?.items)
    ? (members as any).items
    : [];

  const currentRole = (room as any)?.currentUserRole || 'leader';
  const isLeader = currentRole === 'leader';
  const stage = room?.stage || 'brief';
  const stageDone = room?.stageDone || { brief: false, ideate: false, crowd: false, plan: false };

  // Checklist toggling
  const togglePrepMutation = useMutation({
    mutationFn: (itemId: string) => prepService.togglePrepItem(roomId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prep', roomId] });
    },
  });

  // Calculate metrics
  const ideaList = Array.isArray(ideas)
    ? ideas
    : Array.isArray((ideas as any)?.ideas)
    ? (ideas as any).ideas
    : Array.isArray((ideas as any)?.items)
    ? (ideas as any).items
    : [];
  const approvedIdeas = ideaList.filter((i: any) => i.status === 'approved');
  const pendingIdeas = ideaList.filter((i: any) => i.status === 'pending');
  const rejectedIdeas = ideaList.filter((i: any) => i.status === 'rejected');

  const prepList = Array.isArray(prepItems)
    ? prepItems
    : Array.isArray((prepItems as any)?.checklist)
    ? (prepItems as any).checklist
    : [];
  const prepDoneCount = (prepItems as any)?.progress?.done ?? prepList.filter((p: any) => p.done).length;
  const prepTotalCount = (prepItems as any)?.progress?.total ?? (prepList.length || 6);

  const validatedSteps = ['prd', 'tech', 'phases', 'tasks', 'demo'].filter(
    k => planState?.steps?.[k as keyof typeof planState.steps]?.validated
  );

  const hasBrief = Boolean(
    brief && (brief.hasSource || (brief.fields?.problemStatement && brief.fields.problemStatement.trim().length > 0))
  );

  const startsInfo = formatStartsIn(room?.eventStart || null);

  // Stepper nodes definitions (4 nodes)
  const stageOrder: RoomStage[] = ['brief', 'ideate', 'plan', 'build'];
  const currentStageIndex = Math.max(0, stageOrder.indexOf(stage === 'crowd' ? 'plan' : stage));

  const journeyNodes = [
    {
      id: 'brief',
      label: 'Brief',
      path: `/app/room/${roomId}/brief`,
      isDone: stageDone.brief,
      helper: stageDone.brief ? 'Confirmed' : hasBrief ? 'Needs confirm' : 'Not added',
    },
    {
      id: 'ideate',
      label: 'Ideate',
      path: `/app/room/${roomId}/ideate`,
      isDone: stageDone.ideate,
      helper: ideas.length > 0 ? `${ideas.length} ideas, ${approvedIdeas.length} approved` : '0 ideas',
    },
    {
      id: 'plan',
      label: 'Plan',
      path: `/app/room/${roomId}/plan`,
      isDone: stageDone.plan,
      helper: `${validatedSteps.length} of 5 steps`,
    },
    {
      id: 'build',
      label: 'Build',
      path: `/app/room/${roomId}/board`,
      isDone: stage === 'build',
      helper: stage === 'build' ? 'Live' : 'Locked',
      isLocked: stage !== 'build',
    },
  ];

  // Footer target & labels per stage
  const ctaMap: Record<RoomStage, { title: string; desc: string; button: string; link: string }> = {
    brief: {
      title: 'Hackathon Brief',
      desc: 'Add the rules, rubric, and deadlines so your team stays aligned.',
      button: 'Continue: Add the brief',
      link: `/app/room/${roomId}/brief`,
    },
    ideate: {
      title: 'Brainstorm & Vote',
      desc: 'Submit ideas, review team entries, and approve the winners.',
      button: 'Continue: Start ideating',
      link: `/app/room/${roomId}/ideate`,
    },
    crowd: {
      title: 'AI Planning & Architecture',
      desc: 'Chain prompts to produce PRD, tech stack, phases, and task board.',
      button: 'Continue: Complete plan',
      link: `/app/room/${roomId}/plan`,
    },
    plan: {
      title: 'AI Planning & Architecture',
      desc: 'Chain prompts to produce PRD, tech stack, phases, and task board.',
      button: 'Continue: Complete plan',
      link: `/app/room/${roomId}/plan`,
    },
    build: {
      title: 'Build Phase Live',
      desc: 'Sprint tasks and milestones are ready on the board.',
      button: 'Open board',
      link: `/app/room/${roomId}/board`,
    },
  };

  const currentCta = ctaMap[stage] || ctaMap.brief;

  const handleNodeClick = (node: typeof journeyNodes[0]) => {
    if (node.isLocked) {
      toast('Unlocks when the plan is complete', {
        action: {
          label: 'Go to Plan',
          onClick: () => navigate(`/app/room/${roomId}/plan`),
        },
      });
      return;
    }
    navigate(node.path);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${roomId}`);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-6 p-8 max-w-[1320px] mx-auto font-sans pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {room?.name || 'Hackathon Command Room'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {room?.projectDescription || room?.description || 'Your structured path from brief to build.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <TagChip label="PLANNING" color="blue" />
          <TimeChip timeRemaining={startsInfo.text} urgent={startsInfo.urgent} />
        </div>
      </div>

      {/* ── JOURNEY CARD ── */}
      <div className="rounded-[24px] bg-card border border-border shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/50">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Your path to build
          </h2>
          <span className="px-2.5 py-1 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
            Step {Math.min(currentStageIndex + 1, 4)} of 4
          </span>
        </div>

        {/* Stepper Rail */}
        <div className="p-6 relative">
          <div className="relative flex items-center justify-between">
            {/* Background Rail */}
            <div className="absolute top-[14px] left-[20px] right-[20px] h-[3px] bg-muted -z-0" />

            {/* Filled Rail (animates to current step) */}
            <motion.div
              className="absolute top-[14px] left-[20px] h-[3px] bg-neutral-900 dark:bg-neutral-100 -z-0"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((currentStageIndex / 3) * 100, 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />

            {journeyNodes.map((node, idx) => {
              const isCurrent = idx === currentStageIndex;
              const isDone = node.isDone;

              return (
                <div
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className="flex flex-col items-center text-center cursor-pointer group z-10 select-none max-w-[120px]"
                >
                  {/* Node Circle */}
                  <div
                    className={cn(
                      'size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200',
                      isDone
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-sm'
                        : isCurrent
                        ? 'bg-card border-2 border-blue-600 text-blue-600 ring-4 ring-blue-500/20'
                        : 'bg-card border-2 border-muted-foreground/30 text-muted-foreground'
                    )}
                  >
                    {isDone ? (
                      <Check className="size-3.5 stroke-[3]" />
                    ) : node.isLocked ? (
                      <Lock className="size-3 text-muted-foreground" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Label & Helper */}
                  <span
                    className={cn(
                      'text-sm mt-2 transition-colors',
                      isCurrent
                        ? 'font-bold text-foreground'
                        : isDone
                        ? 'font-medium text-muted-foreground'
                        : 'font-normal text-muted-foreground/70'
                    )}
                  >
                    {node.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {node.helper}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Footer: Next Step Guidance & Single Primary CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-t border-border/70 bg-muted/20">
          <div>
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {currentCta.title}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">{currentCta.desc}</p>
          </div>

          <Button
            onClick={() => navigate(currentCta.link)}
            className="h-9 px-5 rounded-[12px] bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 font-semibold text-xs shadow-xs"
          >
            {currentCta.button} &rarr;
          </Button>
        </div>
      </div>

      {/* ── TWO STACKED COLUMNS (7 / 5) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN (7 cols) ── */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Brief Card */}
          <div className="rounded-[24px] bg-card border border-border shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/60">
              <h3 className="text-sm font-semibold text-foreground">Hackathon Brief</h3>
              {brief?.confirmed ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold">
                  CONFIRMED
                </span>
              ) : hasBrief ? (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-bold">
                  NEEDS CONFIRMATION
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold">
                  NOT ADDED
                </span>
              )}
            </div>

            <div className="p-6">
              {!hasBrief ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="size-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
                    <FileText className="size-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">No brief added yet</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                    Add the hackathon brief so everyone knows the rules, deadlines, and rubric.
                  </p>
                  <Button
                    onClick={() => navigate(`/app/room/${roomId}/brief`)}
                    className="h-8 px-4 rounded-xl bg-neutral-900 text-white text-xs font-semibold"
                  >
                    Add brief &rarr;
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Problem Statement
                    </span>
                    <p className="text-xs text-foreground mt-1 leading-relaxed line-clamp-3">
                      {brief?.fields?.problemStatement || 'No problem statement provided yet.'}
                    </p>
                  </div>

                  {brief?.fields?.rubric && brief.fields.rubric.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Rubric Weights
                      </span>
                      <div className="mt-2 flex h-2 rounded-full overflow-hidden bg-muted gap-0.5">
                        {brief.fields.rubric.map((r, i) => (
                          <div
                            key={i}
                            title={`${r.criterion} (${r.weight}%)`}
                            style={{ width: `${r.weight}%` }}
                            className={cn(
                              'h-full',
                              i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-purple-500' : i === 2 ? 'bg-emerald-500' : 'bg-amber-500'
                            )}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                        {brief.fields.rubric.map((r, i) => (
                          <span key={i}>
                            <strong>{r.weight}%</strong> {r.criterion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Eligibility:{' '}
                      {brief?.fields?.eligibility
                        ? brief.fields.eligibility.length > 30
                          ? `${brief.fields.eligibility.substring(0, 30)}...`
                          : brief.fields.eligibility
                        : 'Not specified'}
                    </span>
                    <Link
                      to={`/app/room/${roomId}/brief`}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View full brief &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ideas Mini Card (during ideate or when ideas exist) */}
          <div className="rounded-[24px] bg-card border border-border shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/60">
              <h3 className="text-sm font-semibold text-foreground">Brainstorm Activity</h3>
              <Link
                to={`/app/room/${roomId}/ideate`}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Open ideate &rarr;
              </Link>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="text-lg font-bold text-foreground font-mono">{ideas.length}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Submitted</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-lg font-bold text-emerald-600 font-mono">{approvedIdeas.length}</div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">Approved</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="text-lg font-bold text-muted-foreground font-mono">{pendingIdeas.length}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Pending</div>
                </div>
              </div>

              {/* Contributor statuses */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                <span className="text-muted-foreground">Team contributions:</span>
                <div className="flex items-center gap-1.5">
                  {memberList.map((m) => {
                    const hasSubmitted = ideas.some(i => i.authorId === m.id);
                    return (
                      <div
                        key={m.id}
                        title={`${m.displayName}: ${hasSubmitted ? 'Submitted' : 'Pending'}`}
                        className={cn(
                          'size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white relative',
                          !hasSubmitted && 'ring-2 ring-muted-foreground/30 opacity-70'
                        )}
                        style={{ backgroundColor: m.avatarColor }}
                      >
                        {m.initials}
                        {hasSubmitted && (
                          <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-1 ring-white" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (5 cols) ── */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Team Panel */}
          <div className="rounded-[24px] bg-card border border-border shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTeamTab('members')}
                  className={cn(
                    'text-xs font-semibold pb-1 cursor-pointer transition-colors border-b-2',
                    teamTab === 'members'
                      ? 'border-neutral-900 text-foreground dark:border-neutral-100 font-bold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Members ({memberList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeamTab('skills')}
                  className={cn(
                    'text-xs font-semibold pb-1 cursor-pointer transition-colors border-b-2',
                    teamTab === 'skills'
                      ? 'border-neutral-900 text-foreground dark:border-neutral-100 font-bold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Skills
                </button>
              </div>

              <span className="text-[11px] text-muted-foreground">
                {isLeader ? 'Leader view' : 'Member view'}
              </span>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Prominent Invite Row for new room */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border border-border/60">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/invite/${roomId}`}
                  className="flex-1 bg-transparent text-xs text-muted-foreground font-mono truncate outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border hover:bg-muted text-foreground transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {copiedInvite ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                  {copiedInvite ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Members List */}
              {teamTab === 'members' ? (
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                  {memberList.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="size-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                          style={{ backgroundColor: m.avatarColor }}
                        >
                          {m.initials}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground leading-tight">
                            {m.displayName}
                          </div>
                          <div className="text-[11px] text-muted-foreground capitalize">
                            {m.role}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {m.roleTags?.map((tag, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-xs text-muted-foreground flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span>Frontend Coverage</span>
                    <span className="font-semibold text-emerald-600">Covered</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Backend Coverage</span>
                    <span className="font-semibold text-emerald-600">Covered</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pitch & Presentation</span>
                    <span className="font-semibold text-amber-600">Needs assignee</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
