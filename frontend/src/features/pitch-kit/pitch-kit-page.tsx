import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { roomService } from '@/services/roomService';
import { fetchQa, apiFetch } from '@/api/client';
import { useRoomEvents } from '@/api/useRoomEvents';
import { useCurrentUser } from '@/features/auth/useCurrentUser';

import {
  fetchPitchSettings,
  updatePitchSettings,
  fetchPitchReadiness,
  fetchDemoAssets,
  fetchDemoLadder,
  fetchPitch,
  fetchRehearsals,
  startRehearsal,
  uploadRehearsalAudio,
  finishRehearsal,
  type PitchSettings,
} from './api/pitch-kit-api';
import { PitchKitHeader } from './components/pitch-kit-header';
import { DemoStation } from './components/demo-station';
import { PitchStation } from './components/pitch-station';
import { QnaStation } from './components/qna-station';
import { RehearsalSetupDialog, type RehearsalLaunchConfig } from './components/rehearsal-setup-dialog';
import { StageMonitor } from './components/stage-monitor';
import { RehearsalProcessingScreen } from './components/rehearsal-processing-screen';
import { toast } from 'sonner';

type StationTab = 'demo' | 'pitch' | 'qa';

const STATIONS: { id: StationTab; label: string }[] = [
  { id: 'demo', label: 'Demo' },
  { id: 'pitch', label: 'Pitch' },
  { id: 'qa', label: 'Q&A' },
];

const roomTabMemory = new Map<string, StationTab>();

export function PitchKitPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();
  const { data: currentUser } = useCurrentUser();
  const { lastEvent } = useRoomEvents(roomId, currentUser?.id);

  const [lastUpdatedBy, setLastUpdatedBy] = useState<string | null>(null);

  // Rehearsal modal & stage state
  const [rehearsalSetupOpen, setRehearsalSetupOpen] = useState(false);
  const [rehearsalSetupScope, setRehearsalSetupScope] = useState<'FULL' | 'MY_BEATS' | 'ONE_BEAT'>('FULL');
  const [rehearsalSetupBeatId, setRehearsalSetupBeatId] = useState<string | undefined>();
  const [activeStageConfig, setActiveStageConfig] = useState<RehearsalLaunchConfig | null>(null);
  const [activeServerRehearsalId, setActiveServerRehearsalId] = useState<string | null>(null);
  const [isReadMode, setIsReadMode] = useState(false);
  const [processingState, setProcessingState] = useState<{
    mode: 'TIMED' | 'VOICE';
    totalBeats: number;
    uploadedCount: number;
  } | null>(null);

  // Queries
  const {
    data: settings = null,
    isLoading: settingsLoading,
    isError: settingsError,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ['pitch-settings', roomId],
    queryFn: () => fetchPitchSettings(roomId!),
    enabled: !!roomId,
    staleTime: 30_000,
  });

  const {
    data: readiness = null,
    isLoading: readinessLoading,
    refetch: refetchReadiness,
  } = useQuery({
    queryKey: ['pitchkit-readiness', roomId],
    queryFn: () => fetchPitchReadiness(roomId!),
    enabled: !!roomId,
    staleTime: 15_000,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['demo-assets', roomId],
    queryFn: () => fetchDemoAssets(roomId!),
    enabled: !!roomId,
  });

  const { data: ladder = [] } = useQuery({
    queryKey: ['demo-ladder', roomId],
    queryFn: () => fetchDemoLadder(roomId!),
    enabled: !!roomId,
  });

  const { data: pitchData } = useQuery({
    queryKey: ['pitch-detail', roomId],
    queryFn: () => fetchPitch(roomId!),
    enabled: !!roomId,
  });

  const { data: rehearsals = [] } = useQuery({
    queryKey: ['rehearsals', roomId],
    queryFn: () => fetchRehearsals(roomId!),
    enabled: !!roomId,
  });

  const { data: deckSlidesData } = useQuery({
    queryKey: ['deck-slides', roomId],
    queryFn: () =>
      apiFetch<{ slides: Array<{ pageNo: number; title: string }> }>(
        `/api/v1/rooms/${roomId}/deck/slides`
      ).catch(() => ({ slides: [] })),
    enabled: !!roomId,
  });

  const { data: qa = null } = useQuery({
    queryKey: ['qa', roomId],
    queryFn: () => fetchQa(roomId!),
    enabled: !!roomId,
  });

  const { data: meta = null } = useQuery({
    queryKey: ['meta'],
    queryFn: () => apiFetch<any>('/api/v1/meta'),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['room-members', roomId],
    queryFn: () => roomService.getMembers(roomId!),
    enabled: !!roomId,
  });

  const { data: room = null } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomService.getRoom(roomId!),
    enabled: !!roomId,
  });

  useEffect(() => {
    if (lastEvent?.actorName) {
      setLastUpdatedBy(lastEvent.actorName);
      const timer = setTimeout(() => setLastUpdatedBy(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  // Tab Status Lines Calculations
  const demoProofCount = assets.filter(
    (a) => a.kind === 'FULL_RECORDING' || a.kind === 'BACKUP_RECORDING' || a.kind === 'LIVE_LINK'
  ).length;
  const demoFallbackReadyCount = ladder.filter((r) => r.status === 'READY').length;
  const isDemoComplete = demoProofCount >= 3 && demoFallbackReadyCount >= 3;

  const demoStatusLine = `${demoProofCount} of 3 assets, ${demoFallbackReadyCount} of 4 fallbacks`;
  const countingRuns = rehearsals.filter((r) => r.countsTowardReadiness).length;
  const pitchStatusLine = `${countingRuns} of 3 rehearsals`;
  const qQuestions = qa?.questions ?? qa?.items ?? [];
  const qSolidCount = qQuestions.filter((q: any) => q.practiced || q.solid).length;
  const qaStatusLine = `${qSolidCount} of ${qQuestions.length} solid`;

  const urlTab = searchParams.get('tab') as StationTab | null;
  const activeTab: StationTab = useMemo(() => {
    if (urlTab && (urlTab === 'demo' || urlTab === 'pitch' || urlTab === 'qa')) {
      return urlTab;
    }
    if (roomId && roomTabMemory.has(roomId)) {
      return roomTabMemory.get(roomId)!;
    }
    return isDemoComplete ? 'pitch' : 'demo';
  }, [urlTab, roomId, isDemoComplete]);

  const setTab = useCallback(
    (tab: StationTab) => {
      if (roomId) roomTabMemory.set(roomId, tab);
      setSearchParams({ tab }, { replace: true });
    },
    [roomId, setSearchParams]
  );

  const updateSettingsMutation = useMutation({
    mutationFn: (patch: Partial<PitchSettings>) => updatePitchSettings(roomId!, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(['pitch-settings', roomId], updated);
      queryClient.invalidateQueries({ queryKey: ['pitchkit-readiness', roomId] });
    },
  });

  const handleUpdateRole = async (role: 'presenter' | 'operator', userId: string | null) => {
    const patch = role === 'presenter' ? { presenterUserId: userId } : { operatorUserId: userId };
    await updateSettingsMutation.mutateAsync({ ...patch, version: settings?.version });
  };

  const handleLaunchRehearsal = async (config: RehearsalLaunchConfig) => {
    try {
      const started = await startRehearsal(roomId!, {
        mode: config.mode,
        scope: config.scope,
        beatIds: config.beatIds,
      });
      setActiveServerRehearsalId(started.id);
      setActiveStageConfig(config);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start rehearsal run');
    }
  };

  const handleFinishRehearsal = async (timings: any[], stumbles: any[], endedReason: 'COMPLETE' | 'STOPPED') => {
    const rid = activeServerRehearsalId;
    const mode = activeStageConfig?.mode || 'TIMED';
    const totalBeats = timings.length;

    setActiveStageConfig(null);
    setProcessingState({ mode, totalBeats, uploadedCount: totalBeats });

    try {
      const finished = await finishRehearsal(roomId!, rid!, {
        beatTimings: timings,
        stumbles,
        endedReason,
      });
      queryClient.invalidateQueries({ queryKey: ['rehearsals', roomId] });
      queryClient.invalidateQueries({ queryKey: ['pitchkit-readiness', roomId] });

      setTimeout(() => {
        setProcessingState(null);
        navigate(`/app/room/${roomId}/pitch-kit/rehearsals/${finished.id}`);
      }, 1000);
    } catch (err: any) {
      setProcessingState(null);
      toast.error(err?.message || 'Failed to save rehearsal metrics');
    }
  };

  const isLeader = Boolean(
    room?.isLeader ||
    room?.myRole === 'leader' ||
    members.find((m) => m.id === currentUser?.id)?.role === 'leader'
  );

  if (settingsLoading && !settings) {
    return (
      <div className="max-w-[1120px] mx-auto p-6 sm:p-8 space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-36" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (settingsError && !settings) {
    return (
      <div className="max-w-[1120px] mx-auto p-8 flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Could not load pitch kit settings.</p>
        <Button variant="outline" onClick={() => { refetchSettings(); refetchReadiness(); }}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  const activeBeats = pitchData?.beats || [];
  const selectedStageBeats = activeStageConfig
    ? activeBeats.filter((b) => activeStageConfig.beatIds.includes(b.id))
    : activeBeats;

  return (
    <div className="flex-1 overflow-y-auto min-h-screen bg-background text-foreground">
      <div className="max-w-[1120px] mx-auto p-6 sm:p-8 space-y-8">
        <PitchKitHeader
          settings={settings}
          readiness={readiness}
          isLoadingReadiness={readinessLoading}
          onUpdateSettings={async (patch) => {
            await updateSettingsMutation.mutateAsync({ ...patch, version: settings?.version });
          }}
          onNavigateTab={(tab) => setTab(tab)}
        />

        {/* STATIONS TABS */}
        <div className="hidden sm:grid grid-cols-3 border-b border-border pb-px" role="tablist">
          {STATIONS.map((station) => {
            const isActive = activeTab === station.id;
            const statusLine =
              station.id === 'demo' ? demoStatusLine : station.id === 'pitch' ? pitchStatusLine : qaStatusLine;

            return (
              <button
                key={station.id}
                role="tab"
                id={`station-tab-${station.id}`}
                aria-selected={isActive}
                onClick={() => setTab(station.id)}
                className={cn(
                  'text-left pb-4 px-2 relative transition-colors cursor-pointer border-b-2',
                  isActive
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="font-display text-[28px] font-normal tracking-tight block leading-tight">
                  {station.label}
                </span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground block mt-1">
                  {statusLine}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Sticky Segmented Bar */}
        <div className="sm:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border py-2 -mx-6 px-6">
          <div className="grid grid-cols-3 gap-1 bg-muted/40 p-1 rounded-lg">
            {STATIONS.map((station) => (
              <button
                key={station.id}
                onClick={() => setTab(station.id)}
                className={cn(
                  'min-h-[44px] flex flex-col items-center justify-center rounded-md px-2 text-center transition-all',
                  activeTab === station.id ? 'bg-background shadow-xs text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                <span className="font-display text-base leading-none">{station.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* STATION CANVAS */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            >
              {activeTab === 'demo' && roomId && (
                <DemoStation
                  roomId={roomId}
                  isLeader={isLeader}
                  members={members}
                  settings={settings}
                  onUpdateRole={handleUpdateRole}
                  lastUpdatedBy={lastUpdatedBy}
                />
              )}

              {activeTab === 'pitch' && roomId && (
                <div className="border border-border rounded-xl bg-card p-6 sm:p-8 space-y-6">
                  <div className="border-b border-border pb-4">
                    <h2 className="font-display text-2xl font-normal text-foreground">Pitch station</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Script beats, pacing, and practice runs
                    </p>
                  </div>
                  <PitchStation
                    roomId={roomId}
                    isLeader={isLeader}
                    members={members}
                    deckSlides={deckSlidesData?.slides || []}
                    roomAiAllowed={(room as any)?.aiAllowed ?? true}
                    onStartRehearsal={(opts) => {
                      setRehearsalSetupScope(opts?.scope || 'FULL');
                      setRehearsalSetupBeatId(opts?.beatId);
                      setRehearsalSetupOpen(true);
                    }}
                    onOpenReadMode={() => setIsReadMode(true)}
                  />
                </div>
              )}

              {activeTab === 'qa' && roomId && (
                <div className="border border-border rounded-xl bg-card p-6 sm:p-8">
                  <QnaStation
                    roomId={roomId}
                    roomAiAllowed={(room as any)?.aiAllowed ?? true}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* SETUP DIALOG */}
        {rehearsalSetupOpen && pitchData && (
          <RehearsalSetupDialog
            open={rehearsalSetupOpen}
            onOpenChange={setRehearsalSetupOpen}
            beats={pitchData.beats}
            currentUserId={currentUser?.id}
            roomAiAllowed={(room as any)?.aiAllowed ?? true}
            initialScope={rehearsalSetupScope}
            initialBeatId={rehearsalSetupBeatId}
            onLaunch={handleLaunchRehearsal}
          />
        )}

        {/* STAGE MONITOR (ACTIVE REHEARSAL) */}
        {activeStageConfig && pitchData && (
          <StageMonitor
            beats={selectedStageBeats}
            timeLimitSec={pitchData.timeLimitSec}
            mode={activeStageConfig.mode}
            teleprompter={activeStageConfig.teleprompter}
            audioStream={activeStageConfig.audioStream}
            members={members}
            onUploadBeatAudio={(beatId, blob) =>
              uploadRehearsalAudio(roomId!, activeServerRehearsalId!, beatId, blob)
            }
            onFinish={handleFinishRehearsal}
            onDiscard={() => {
              setActiveStageConfig(null);
              setActiveServerRehearsalId(null);
            }}
          />
        )}

        {/* READ MODE (PORTAL TELEPROMPTER WITHOUT RECORDING) */}
        {isReadMode && pitchData && (
          <StageMonitor
            beats={pitchData.beats}
            timeLimitSec={pitchData.timeLimitSec}
            mode="TIMED"
            teleprompter={true}
            members={members}
            onFinish={() => setIsReadMode(false)}
            onDiscard={() => setIsReadMode(false)}
          />
        )}

        {/* PROCESSING SCREEN */}
        {processingState && (
          <RehearsalProcessingScreen
            mode={processingState.mode}
            totalBeats={processingState.totalBeats}
            uploadedCount={processingState.uploadedCount}
            onSkip={() => {
              setProcessingState(null);
              if (activeServerRehearsalId) {
                navigate(`/app/room/${roomId}/pitch-kit/rehearsals/${activeServerRehearsalId}`);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
