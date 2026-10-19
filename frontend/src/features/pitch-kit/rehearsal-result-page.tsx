import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { roomService } from '@/services/roomService';
import { fetchRehearsalDetail, fetchPitch } from './api/pitch-kit-api';
import { RehearsalResultView } from './components/rehearsal-result-view';
import { RehearsalSetupDialog, type RehearsalLaunchConfig } from './components/rehearsal-setup-dialog';
import { StageMonitor } from './components/stage-monitor';
import { RehearsalProcessingScreen } from './components/rehearsal-processing-screen';
import {
  startRehearsal,
  uploadRehearsalAudio,
  finishRehearsal,
} from './api/pitch-kit-api';
import { toast } from 'sonner';

export function RehearsalResultPage() {
  const { roomId, rehearsalId, id } = useParams<{
    roomId?: string;
    rehearsalId?: string;
    id?: string;
  }>();
  const navigate = useNavigate();
  const activeRehearsalId = rehearsalId || id || '';
  const { data: currentUser } = useCurrentUser();

  // Dialog and execution state for "Run again" or "Practise weakest beat"
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupScope, setSetupScope] = useState<'FULL' | 'MY_BEATS' | 'ONE_BEAT'>('FULL');
  const [setupBeatId, setSetupBeatId] = useState<string | undefined>();
  const [activeStageConfig, setActiveStageConfig] = useState<RehearsalLaunchConfig | null>(null);
  const [activeServerRehearsalId, setActiveServerRehearsalId] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<{
    mode: 'TIMED' | 'VOICE';
    totalBeats: number;
    uploadedCount: number;
  } | null>(null);

  const {
    data: rehearsal,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['rehearsal-detail', activeRehearsalId, roomId],
    queryFn: () => fetchRehearsalDetail(roomId || 'current', activeRehearsalId),
    enabled: Boolean(activeRehearsalId),
  });

  const effectiveRoomId = roomId || rehearsal?.roomId || '';

  const { data: room = null } = useQuery({
    queryKey: ['room', effectiveRoomId],
    queryFn: () => roomService.getRoom(effectiveRoomId),
    enabled: Boolean(effectiveRoomId),
  });

  const { data: pitch } = useQuery({
    queryKey: ['pitch-detail', effectiveRoomId],
    queryFn: () => fetchPitch(effectiveRoomId),
    enabled: Boolean(effectiveRoomId),
  });

  const handleLaunch = async (config: RehearsalLaunchConfig) => {
    try {
      const started = await startRehearsal(effectiveRoomId, {
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

  const handleFinish = async (timings: any[], stumbles: any[], endedReason: 'COMPLETE' | 'STOPPED') => {
    const rid = activeServerRehearsalId;
    const mode = activeStageConfig?.mode || 'TIMED';
    const totalBeats = timings.length;

    setActiveStageConfig(null);
    setProcessingState({ mode, totalBeats, uploadedCount: totalBeats });

    try {
      const finished = await finishRehearsal(effectiveRoomId, rid!, {
        beatTimings: timings,
        stumbles,
        endedReason,
      });
      setTimeout(() => {
        setProcessingState(null);
        navigate(`/app/room/${effectiveRoomId}/pitch-kit/rehearsals/${finished.id}`);
      }, 1000);
    } catch (err: any) {
      setProcessingState(null);
      toast.error(err?.message || 'Failed to compute rehearsal metrics');
    }
  };

  if (isLoading && !rehearsal) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !rehearsal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-6">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Could not load rehearsal details.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <RehearsalResultView
        roomId={effectiveRoomId}
        rehearsal={rehearsal}
        currentUserId={currentUser?.id}
        roomAiAllowed={(room as any)?.aiAllowed ?? true}
        onRunAgain={() => {
          setSetupScope('FULL');
          setSetupBeatId(undefined);
          setSetupOpen(true);
        }}
        onPractiseWeakestBeat={(beatId) => {
          setSetupScope('ONE_BEAT');
          setSetupBeatId(beatId);
          setSetupOpen(true);
        }}
      />

      {setupOpen && pitch && (
        <RehearsalSetupDialog
          open={setupOpen}
          onOpenChange={setSetupOpen}
          beats={pitch.beats}
          currentUserId={currentUser?.id}
          roomAiAllowed={(room as any)?.aiAllowed ?? true}
          initialScope={setupScope}
          initialBeatId={setupBeatId}
          onLaunch={handleLaunch}
        />
      )}

      {activeStageConfig && pitch && (
        <StageMonitor
          beats={pitch.beats.filter((b) => activeStageConfig.beatIds.includes(b.id))}
          timeLimitSec={pitch.timeLimitSec}
          mode={activeStageConfig.mode}
          teleprompter={activeStageConfig.teleprompter}
          audioStream={activeStageConfig.audioStream}
          members={[]}
          onUploadBeatAudio={(beatId, blob) =>
            uploadRehearsalAudio(effectiveRoomId, activeServerRehearsalId!, beatId, blob)
          }
          onFinish={handleFinish}
          onDiscard={() => {
            setActiveStageConfig(null);
            setActiveServerRehearsalId(null);
          }}
        />
      )}

      {processingState && (
        <RehearsalProcessingScreen
          mode={processingState.mode}
          totalBeats={processingState.totalBeats}
          uploadedCount={processingState.uploadedCount}
          onSkip={() => {
            setProcessingState(null);
            if (activeServerRehearsalId) {
              navigate(`/app/room/${effectiveRoomId}/pitch-kit/rehearsals/${activeServerRehearsalId}`);
            }
          }}
        />
      )}
    </>
  );
}
