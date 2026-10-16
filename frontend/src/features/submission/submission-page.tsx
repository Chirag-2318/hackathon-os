import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  fetchSubmission,
  fetchRoomSummary,
  fetchRoomOverview,
  submitRoom,
  reopenSubmission,
} from '@/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmissionStateA } from './components/submission-state-a';
import { SubmissionStateB } from './components/submission-state-b';

export function SubmissionPage() {
  const { roomId = '' } = useParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const isReduced = Boolean(prefersReducedMotion);

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  // 1. Fetch submission data
  const {
    data: subData,
    isLoading: subLoading,
    isError: subError,
    refetch: refetchSub,
  } = useQuery({
    queryKey: ['submission', roomId],
    queryFn: () => fetchSubmission(roomId),
    enabled: Boolean(roomId),
  });

  // 2. Fetch room summary data
  const {
    data: summaryData,
    isError: summaryError,
  } = useQuery({
    queryKey: ['room-summary', roomId],
    queryFn: () => fetchRoomSummary(roomId),
    enabled: Boolean(roomId),
    retry: 1,
  });

  // 3. Fetch room overview for clock status and room name fallback
  const { data: overviewData } = useQuery({
    queryKey: ['room-overview', roomId],
    queryFn: () => fetchRoomOverview(roomId),
    enabled: Boolean(roomId),
  });

  // Mutations
  const submitMutation = useMutation({
    mutationFn: () => submitRoom(roomId),
    onSuccess: (data) => {
      setSubmitError(null);
      queryClient.setQueryData(['submission', roomId], data);
      queryClient.invalidateQueries({ queryKey: ['submission', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-summary', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-overview', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
    onError: (err: any) => {
      const msg = err?.message || 'Could not mark room as submitted. Please try again.';
      setSubmitError(msg);
    },
  });

  const reopenMutation = useMutation({
    mutationFn: () => reopenSubmission(roomId),
    onSuccess: (data) => {
      setSubmitError(null);
      queryClient.setQueryData(['submission', roomId], data);
      queryClient.invalidateQueries({ queryKey: ['submission', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-summary', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room-overview', roomId] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
    onError: (err: any) => {
      const msg = err?.message || 'Could not reopen submission.';
      setSubmitError(msg);
    },
  });

  // Determine submission status
  const isSubmitted = Boolean(
    subData?.submittedAt ||
      subData?.status === 'submitted' ||
      overviewData?.submittedAt ||
      overviewData?.clock?.clockStatus === 'SUBMITTED'
  );

  const roomName =
    overviewData?.room?.name ||
    summaryData?.roomName ||
    overviewData?.name ||
    'Project';

  const isLeader = Boolean(subData?.isLeader ?? overviewData?.isLeader ?? false);
  const leaderInfo = subData?.leader || overviewData?.leader;

  const deadlineAt =
    subData?.deadline?.at ||
    overviewData?.clock?.endsAt ||
    overviewData?.room?.endsAt;

  const clockStatus =
    overviewData?.clock?.clockStatus ||
    subData?.deadline?.status;

  const submittedAt =
    subData?.submittedAt ||
    overviewData?.submittedAt ||
    summaryData?.submittedAt;

  // Loading state
  if (subLoading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[560px] flex flex-col items-center space-y-4">
          <Skeleton className="h-12 w-3/4 max-w-[420px]" />
          <Skeleton className="h-5 w-full max-w-[480px]" />
          <Skeleton className="h-11 w-48 mt-4 rounded-md" />
          <Skeleton className="h-4 w-36 mt-2" />
        </div>
      </div>
    );
  }

  // Error state
  if (subError) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-full max-w-[480px] space-y-4">
          <h2
            className="text-2xl font-normal tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-display, serif)' }}
          >
            Failed to load submission status
          </h2>
          <p className="text-sm text-muted-foreground">
            We could not verify the submission state for this room.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => refetchSub()}
              className="min-h-[44px] px-6 py-2.5 rounded-md border border-border text-foreground hover:bg-accent font-medium text-sm transition-colors cursor-pointer select-none"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex flex-col">
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div
            key="state-a"
            initial={isReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={isReduced ? undefined : { opacity: 0 }}
            transition={isReduced ? { duration: 0 } : { duration: 0.4 }}
            className="w-full flex-1 flex flex-col justify-center"
          >
            <SubmissionStateA
              isLeader={isLeader}
              leader={leaderInfo}
              deadlineAt={deadlineAt}
              clockStatus={clockStatus}
              isOnline={isOnline}
              onSubmit={async () => {
                await submitMutation.mutateAsync();
              }}
              submitting={submitMutation.isPending}
              submitError={submitError}
            />
          </motion.div>
        ) : (
          <motion.div
            key="state-b"
            initial={isReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={isReduced ? undefined : { opacity: 0 }}
            transition={isReduced ? { duration: 0 } : { duration: 0.4 }}
            className="w-full flex-1"
          >
            <SubmissionStateB
              roomId={roomId}
              roomName={roomName}
              submittedAt={submittedAt}
              isLeader={isLeader}
              summary={summaryData}
              canAccessSummary={!summaryError}
              onReopen={async () => {
                await reopenMutation.mutateAsync();
              }}
              reopening={reopenMutation.isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SubmissionPage;
