import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ideaService, briefService, roomService } from '@/services';
import type { Idea, IdeaLink, RoomMember } from '@/services/types';
import { ApiError } from '@/lib/apiClient';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, OfflineBanner } from '@/design';
import { toast } from 'sonner';

import { IdeateHeader } from './components/ideate-header';
import { IdeateComposer, type IdeateComposerRef } from './components/ideate-composer';
import { IdeateFilterBar, type IdeateSort, type IdeateViewMode } from './components/ideate-filter-bar';
import { IdeateCard } from './components/ideate-card';
import { IdeateRightRail } from './components/ideate-right-rail';
import { IdeateEmptyState, type IdeateTab } from './components/ideate-empty-state';

export function IdeatePage() {
  const { roomId, id } = useParams<{ roomId?: string; id?: string }>();
  const activeRoomId = roomId || id || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const [feedFilter, setFeedFilter] = useState<IdeateTab>('all');
  const [sort, setSort] = useState<IdeateSort>('newest');
  const [viewMode, setViewMode] = useState<IdeateViewMode>('cards');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const composerRef = useRef<IdeateComposerRef>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const {
    data: ideateData,
    isLoading: loadingIdeate,
    error: ideateError,
    refetch: refetchIdeate,
  } = useQuery({
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

  const { data: members = [] } = useQuery({
    queryKey: ['room-members', activeRoomId],
    queryFn: () => roomService.getMembers(activeRoomId).catch(() => []),
    enabled: Boolean(activeRoomId),
  });

  const isLocked = Boolean(ideateData?.ideationDone);
  const permissions = ideateData?.permissions as any;
  const canFinish = Boolean(permissions?.canFinish || permissions?.canDone || permissions?.isLeader);
  const canReopen = Boolean(permissions?.canReopen);
  const canDecide = Boolean(permissions?.canDecide ?? true);
  const canPost = Boolean(permissions?.canPost ?? true);

  const ideas = ideateData?.ideas || [];
  const counts = ideateData?.counts || { total: 0, pending: 0, approved: 0, rejected: 0 };

  // Mutations with optimistic updates
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] });
      toast.info('Idea deleted');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (ideaId: string) => ideaService.approveIdea(activeRoomId, ideaId),
    onMutate: async (ideaId: string) => {
      await queryClient.cancelQueries({ queryKey: ['ideate', activeRoomId] });
      const previous = queryClient.getQueryData(['ideate', activeRoomId]);
      queryClient.setQueryData(['ideate', activeRoomId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ideas: old.ideas.map((i: Idea) => (i.id === ideaId ? { ...i, status: 'approved' } : i)),
          counts: {
            ...old.counts,
            approved: (old.counts?.approved || 0) + 1,
            pending: Math.max(0, (old.counts?.pending || 1) - 1),
          },
        };
      });
      return { previous };
    },
    onError: (_err, _id, context: any) => {
      if (context?.previous) queryClient.setQueryData(['ideate', activeRoomId], context.previous);
      toast.error('Failed to approve idea');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (ideaId: string) => ideaService.restoreIdea(activeRoomId, ideaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (ideaId: string) => ideaService.rejectIdea(activeRoomId, ideaId),
    onMutate: async (ideaId: string) => {
      await queryClient.cancelQueries({ queryKey: ['ideate', activeRoomId] });
      const previous = queryClient.getQueryData(['ideate', activeRoomId]);
      queryClient.setQueryData(['ideate', activeRoomId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          ideas: old.ideas.map((i: Idea) => (i.id === ideaId ? { ...i, status: 'rejected' } : i)),
          counts: {
            ...old.counts,
            rejected: (old.counts?.rejected || 0) + 1,
            pending: Math.max(0, (old.counts?.pending || 1) - 1),
          },
        };
      });
      return { previous };
    },
    onSuccess: (_, ideaId) => {
      queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] });
      toast('Idea rejected', {
        duration: 6000,
        action: {
          label: 'Undo',
          onClick: () => restoreMutation.mutate(ideaId),
        },
      });
    },
    onError: (_err, _id, context: any) => {
      if (context?.previous) queryClient.setQueryData(['ideate', activeRoomId], context.previous);
      toast.error('Failed to reject idea');
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

  // Filter & Sort
  const filteredAndSortedIdeas = useMemo(() => {
    let list = ideas.filter((i) => {
      if (feedFilter === 'all') return true;
      return i.status === feedFilter;
    });

    if (sort === 'attachments') {
      list = [...list].sort((a, b) => {
        const countA = (a.links?.length || 0) + (a.notes?.length || 0);
        const countB = (b.links?.length || 0) + (b.notes?.length || 0);
        return countB - countA;
      });
    } else {
      list = [...list].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }
    return list;
  }, [ideas, feedFilter, sort]);

  // Loading state
  if (loadingIdeate && !ideateData) {
    return (
      <div className="w-full max-w-[1360px] mx-auto p-6 md:p-8 flex flex-col gap-8">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-44 w-full rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (ideateError && !ideateData) {
    return (
      <div className="w-full max-w-xl mx-auto p-8 my-auto">
        <ErrorState
          message={(ideateError as any)?.message || 'Failed to connect to the ideation room.'}
          onRetry={() => refetchIdeate()}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1360px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 pb-24">
      {/* Offline banner */}
      <OfflineBanner />

      {/* Header */}
      <IdeateHeader
        roomId={activeRoomId}
        isLocked={isLocked}
        problemStatement={brief?.fields?.problemStatement || ideateData?.topic?.problemStatement}
        onDownloadMarkdown={() => ideaService.exportIdeasMarkdown(activeRoomId)}
        onSeedIdeas={() =>
          ideaService.seedSampleIdeas(activeRoomId).then(() => {
            queryClient.invalidateQueries({ queryKey: ['ideate', activeRoomId] });
            toast.success('Sample ideas seeded');
          })
        }
      />

      {/* Main Layout: 68% Main Column / 32% Sticky Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Column (~68% = 8 cols) */}
        <main className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          {/* Composer */}
          <IdeateComposer
            ref={composerRef}
            currentUser={user}
            isLocked={isLocked}
            canPost={canPost}
            isPending={createMutation.isPending}
            onPost={(d) => {
              createMutation.mutate(d);
            }}
          />

          {/* Filter Bar */}
          <IdeateFilterBar
            activeTab={feedFilter}
            onSelectTab={setFeedFilter}
            counts={counts}
            sort={sort}
            onSelectSort={setSort}
            viewMode={viewMode}
            onSelectViewMode={setViewMode}
          />

          {/* ARIA Live notification for count / status updates */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            Showing {filteredAndSortedIdeas.length} ideas in {feedFilter} filter.
          </div>

          {/* Ideas List or Tab-specific Empty State */}
          {filteredAndSortedIdeas.length === 0 ? (
            <IdeateEmptyState
              tab={feedFilter}
              isLocked={isLocked}
              onFocusComposer={() => composerRef.current?.focus()}
            />
          ) : (
            <div
              className={
                viewMode === 'cards'
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                  : 'flex flex-col gap-3'
              }
            >
              {filteredAndSortedIdeas.map((idea) => (
                <IdeateCard
                  key={idea.id}
                  idea={idea}
                  isMine={user?.id ? idea.authorId === String(user.id) : true}
                  canDecide={canDecide}
                  isLocked={isLocked}
                  viewMode={viewMode}
                  onApprove={(id) => approveMutation.mutate(id)}
                  onReject={(id) => rejectMutation.mutate(id)}
                  onStar={(id, isPrimary) => starMutation.mutate({ ideaId: id, isPrimary })}
                  onUpdate={(i) => updateMutation.mutate(i)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </main>

        {/* Right Rail (~32% = 4 cols) */}
        <div className="lg:col-span-4 min-w-0">
          <IdeateRightRail
            roomId={activeRoomId}
            isLocked={isLocked}
            canFinish={canFinish}
            canReopen={canReopen}
            counts={counts}
            ideas={ideas}
            members={members}
            isDonePending={doneMutation.isPending}
            onMarkDone={() => doneMutation.mutate()}
            onReopen={() => reopenMutation.mutate()}
          />
        </div>
      </div>
    </div>
  );
}
