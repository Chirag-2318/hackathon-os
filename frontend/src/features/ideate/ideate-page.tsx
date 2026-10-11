import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ideaService, briefService } from '@/services';
import type { Idea, IdeaLink } from '@/services/types';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/apiClient';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { IdeaComposer } from './components/idea-composer';
import { IdeaFeedCard } from './components/idea-feed-card';

export function IdeatePage() {
  const { roomId, id } = useParams<{ roomId?: string; id?: string }>();
  const activeRoomId = roomId || id || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const [feedFilter, setFeedFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const { data: ideateData } = useQuery({
    queryKey: ['ideate', activeRoomId],
    queryFn: () => ideaService.getIdeateData(activeRoomId),
    enabled: Boolean(activeRoomId),
    refetchInterval: 15000,
  });

  const { data: brief } = useQuery({
    queryKey: ['brief', activeRoomId],
    queryFn: () => briefService.getBrief(activeRoomId),
    enabled: Boolean(activeRoomId),
  });

  const isLocked = Boolean(ideateData?.ideationDone);
  const permissions = ideateData?.permissions || {
    canPost: true,
    canDecide: false,
    canDone: false,
    canReopen: false,
    isLeader: false,
  };

  const ideas = ideateData?.ideas || [];
  const counts = ideateData?.counts || { total: 0, pending: 0, approved: 0, rejected: 0 };

  const createMutation = useMutation({
    mutationFn: (draft: { text: string; links: IdeaLink[]; notes: string[] }) =>
      ideaService.createIdea(activeRoomId, draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] });
      toast.success('Idea posted');
    },
    onError: (err: any) => {
      if (err instanceof ApiError && err.code === 'IDEATION_LOCKED') {
        toast.error('Ideation is locked. Reopen ideation to post more ideas.');
      } else {
        toast.error(err.message || 'Failed to post idea');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (idea: Idea) => ideaService.updateIdea(idea),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (ideaId: string) => ideaService.deleteIdea(activeRoomId, ideaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] }),
  });

  const approveMutation = useMutation({
    mutationFn: (ideaId: string) => ideaService.approveIdea(activeRoomId, ideaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (ideaId: string) => ideaService.restoreIdea(activeRoomId, ideaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (ideaId: string) => ideaService.rejectIdea(activeRoomId, ideaId),
    onSuccess: (_, ideaId) => {
      queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] });
      toast('Idea rejected', {
        duration: 8000,
        action: {
          label: 'Undo',
          onClick: () => restoreMutation.mutate(ideaId),
        },
      });
    },
  });

  const starMutation = useMutation({
    mutationFn: ({ ideaId, isPrimary }: { ideaId: string; isPrimary: boolean }) =>
      ideaService.setPrimaryIdea(activeRoomId, ideaId, isPrimary),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] }),
  });

  const doneMutation = useMutation({
    mutationFn: () => ideaService.markIdeationDone(activeRoomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      toast.success('Ideation complete! Ready to Plan.', {
        action: { label: 'Go to Plan', onClick: () => navigate(`/app/room/${activeRoomId}/plan`) },
      });
    },
    onError: (err: any) => {
      if (err instanceof ApiError && err.code === 'NEED_APPROVED_IDEA') {
        toast.error('You need at least one approved idea to finish ideation.');
      } else {
        toast.error(err.message || 'Failed to complete ideation');
      }
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => ideaService.reopenIdeation(activeRoomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] });
      queryClient.invalidateQueries({ queryKey: ['room', activeRoomId] });
      toast.info('Ideation reopened.');
    },
  });

  const handleDownloadMarkdown = async () => {
    try {
      await ideaService.exportIdeasMarkdown(activeRoomId);
      toast.success('Downloaded ideas.md');
    } catch (e: any) {
      toast.error('Failed to download ideas.md');
    }
  };

  const filteredIdeas = ideas.filter((i) => {
    if (feedFilter === 'all') return true;
    return i.status === feedFilter;
  });

  const approvedCount = counts.approved;

  return (
    <div className="w-full flex flex-col gap-6 p-8 max-w-[1320px] mx-auto font-sans pb-20">
      {/* Page Header */}
      <div className="flex flex-col gap-1 pb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ideate</h1>
          <span className={cn(
            'px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase',
            isLocked ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
          )}>
            {isLocked ? 'LOCKED' : 'OPEN'}
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleDownloadMarkdown} className="text-xs h-8 gap-1.5">
              <Download className="size-3.5" /> Download ideas.md
            </Button>
            {import.meta.env.DEV && ideas.length === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => ideaService.seedSampleIdeas(activeRoomId).then(() => queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] }))}
                className="text-xs h-8 text-blue-600"
              >
                <Sparkles className="size-3.5 mr-1" /> Seed ideas
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="line-clamp-1 flex-1">
            {brief?.fields?.problemStatement || ideateData?.topic?.problemStatement || 'Problem statement from brief'}
          </span>
          <Link to={`/app/room/${activeRoomId}/brief`} className="text-blue-600 hover:underline font-semibold shrink-0">
            Open brief &rarr;
          </Link>
        </div>
      </div>

      {/* Main Grid: Left feed (7 cols), Right summary & actions (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Feed Card */}
        <div className="lg:col-span-7 flex flex-col rounded-[24px] bg-card border border-border shadow-xs overflow-hidden">
          <IdeaComposer
            isLocked={isLocked}
            canPost={permissions.canPost}
            isPending={createMutation.isPending}
            onPost={(d) => createMutation.mutate(d)}
          />

          {/* Filter Pills */}
          <div className="px-4 py-2 bg-muted/20 border-b border-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFeedFilter(tab)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg font-medium capitalize transition-colors',
                    feedFilter === tab ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab} ({tab === 'all' ? counts.total : counts[tab]})
                </button>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">Live feed (15s poll)</span>
          </div>

          {/* Ideas List */}
          <div className="divide-y divide-border/60">
            {filteredIdeas.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No ideas in this category yet.
              </div>
            ) : (
              filteredIdeas.map((idea) => (
                <IdeaFeedCard
                  key={idea.id}
                  idea={idea}
                  isMine={user?.id ? idea.authorId === String(user.id) : true}
                  canDecide={permissions.canDecide}
                  isLocked={isLocked}
                  onApprove={(id) => approveMutation.mutate(id)}
                  onReject={(id) => rejectMutation.mutate(id)}
                  onStar={(id, isPrimary) => starMutation.mutate({ ideaId: id, isPrimary })}
                  onUpdate={(i) => updateMutation.mutate(i)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Rail: Decisions and Completion */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-[24px] bg-card border border-border p-6 flex flex-col gap-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">Ideation Progress</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">Total</span>
                <p className="text-xl font-mono font-bold mt-0.5">{counts.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                <span className="text-[11px] uppercase font-semibold">Approved</span>
                <p className="text-xl font-mono font-bold mt-0.5">{counts.approved}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
              {!isLocked ? (
                <>
                  {approvedCount === 0 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1.5">
                      <AlertCircle className="size-3.5 shrink-0" />
                      At least one approved idea is required to complete ideation.
                    </p>
                  )}
                  {permissions.canDone && (
                    <Button
                      onClick={() => doneMutation.mutate()}
                      disabled={approvedCount === 0 || doneMutation.isPending}
                      className="w-full text-xs font-semibold h-9"
                    >
                      {doneMutation.isPending ? 'Completing...' : 'Mark ideation done & proceed'}
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-emerald-600 font-medium">
                    Ideation is complete! Your team is ready to plan.
                  </p>
                  <Button onClick={() => navigate(`/app/room/${activeRoomId}/plan`)} className="w-full text-xs h-9">
                    Go to Plan &rarr;
                  </Button>
                  {permissions.canReopen && (
                    <Button variant="outline" onClick={() => reopenMutation.mutate()} className="w-full text-xs h-9">
                      Reopen ideation
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
