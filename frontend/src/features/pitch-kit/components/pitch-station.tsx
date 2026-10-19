import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchPitch,
  updatePitch,
  pullPitchFromDoc,
  pushPitchToDoc,
  restorePitchVersion,
  fetchRehearsals,
  type PitchBeat,
} from '../api/pitch-kit-api';
import { PitchStationHeader } from './pitch-station-header';
import { BeatRail } from './beat-rail';
import { BeatEditor } from './beat-editor';
import { RubricCoverage } from './rubric-coverage';
import { RehearsalHistoryTable } from './rehearsal-history-table';
import { VersionHistoryDrawer } from './version-history-drawer';
import { PitchDiffModal } from './pitch-diff-modal';
import { PitchCueCards } from './pitch-cue-cards';

export interface PitchStationProps {
  roomId: string;
  isLeader: boolean;
  members: any[];
  deckSlides?: Array<{ pageNo: number; title: string }>;
  roomAiAllowed?: boolean;
  onStartRehearsal: (options?: { scope?: 'FULL' | 'MY_BEATS' | 'ONE_BEAT'; beatId?: string }) => void;
  onOpenReadMode: () => void;
}

export function PitchStation({
  roomId,
  isLeader,
  members,
  deckSlides = [],
  roomAiAllowed = true,
  onStartRehearsal,
  onOpenReadMode,
}: PitchStationProps) {
  const queryClient = useQueryClient();
  const [selectedBeatId, setSelectedBeatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pullDiffModal, setPullDiffModal] = useState<{ diff: string; beats: PitchBeat[] } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'offline'>('idle');
  const [conflict, setConflict] = useState<any>(null);

  const { data: pitch, isLoading: isPitchLoading, refetch: refetchPitch } = useQuery({
    queryKey: ['pitch-detail', roomId],
    queryFn: () => fetchPitch(roomId),
  });

  const [localBeats, setLocalBeats] = useState<PitchBeat[]>([]);
  const beatsRef = useRef<PitchBeat[]>([]);
  const versionRef = useRef<number>(1);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pitch?.beats) {
      setLocalBeats(pitch.beats);
      beatsRef.current = pitch.beats;
      versionRef.current = pitch.version;
      if (!selectedBeatId && pitch.beats.length > 0) {
        setSelectedBeatId(pitch.beats[0].id);
      }
    }
  }, [pitch]);

  const { data: rehearsals = [] } = useQuery({
    queryKey: ['rehearsals', roomId],
    queryFn: () => fetchRehearsals(roomId),
  });

  const timeLimitSec = pitch?.timeLimitSec || 180;
  const isLocked = Boolean((pitch as any)?.locked);
  const isLockedForMe = isLocked && !isLeader;

  const saveMutation = useMutation({
    mutationFn: (beats: PitchBeat[]) =>
      updatePitch(roomId, {
        beats,
        expectedVersion: versionRef.current,
        timeLimitSec,
      }),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: (updated) => {
      versionRef.current = updated.version;
      queryClient.setQueryData(['pitch-detail', roomId], updated);
      queryClient.invalidateQueries({ queryKey: ['pitchkit-readiness', roomId] });
      setSaveStatus('saved');
      setConflict(null);
    },
    onError: (err: any) => {
      if (err?.status === 409) {
        setConflict({
          onKeepMine: () => {
            versionRef.current = (err?.details?.serverVersion || versionRef.current) + 1;
            saveMutation.mutate(beatsRef.current);
          },
          onViewTheirs: () => {
            refetchPitch();
            setConflict(null);
          },
          onMerge: () => {
            refetchPitch();
            setConflict(null);
          },
        });
      } else {
        setSaveStatus('offline');
      }
    },
  });

  const triggerAutosave = useCallback(
    (beats: PitchBeat[]) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      setSaveStatus('saving');
      debounceTimer.current = setTimeout(() => saveMutation.mutate(beats), 1200);
    },
    [saveMutation]
  );

  const handleUpdateBeats = (updated: PitchBeat[]) => {
    setLocalBeats(updated);
    beatsRef.current = updated;
    triggerAutosave(updated);
  };

  const handleAddBeat = () => {
    const newBeat: PitchBeat = {
      id: crypto.randomUUID(),
      title: `Beat ${localBeats.length + 1}`,
      durationSec: 15,
      say: '',
      show: '',
      cue: '',
    };
    const updated = [...localBeats, newBeat];
    handleUpdateBeats(updated);
    setSelectedBeatId(newBeat.id);
  };

  const handleDuplicateBeat = (beatId: string) => {
    const idx = localBeats.findIndex((b) => b.id === beatId);
    if (idx === -1) return;
    const target = localBeats[idx];
    const copy: PitchBeat = { ...target, id: crypto.randomUUID(), title: `${target.title} (Copy)` };
    const updated = [...localBeats];
    updated.splice(idx + 1, 0, copy);
    handleUpdateBeats(updated);
    setSelectedBeatId(copy.id);
  };

  const handleDeleteBeat = (beatId: string) => {
    if (localBeats.length <= 1) {
      toast.error('The pitch must have at least one beat.');
      return;
    }
    const updated = localBeats.filter((b) => b.id !== beatId);
    handleUpdateBeats(updated);
    if (selectedBeatId === beatId) setSelectedBeatId(updated[0]?.id || null);
  };

  const handleFitToLimit = () => {
    const total = localBeats.reduce((s, b) => s + b.durationSec, 0);
    if (total === 0) return;
    const factor = timeLimitSec / total;
    let distributed = 0;
    const rescaled = localBeats.map((b, i) => {
      if (i === localBeats.length - 1) {
        return { ...b, durationSec: Math.max(3, timeLimitSec - distributed) };
      }
      const scaled = Math.max(3, Math.round(b.durationSec * factor));
      distributed += scaled;
      return { ...b, durationSec: scaled };
    });
    handleUpdateBeats(rescaled);
    toast.success('Rescaled beat durations to fit exactly.');
  };

  const handleDownloadMarkdown = () => {
    let md = `# Pitch Script\n\n**Time limit:** ${timeLimitSec}s\n\n`;
    let cumulative = 0;
    localBeats.forEach((b) => {
      const start = cumulative;
      cumulative += b.durationSec;
      md += `### ${start}-${cumulative}s - ${b.title}\n\n`;
      if (b.say) md += `- **SAY:** ${b.say}\n`;
      if (b.show) md += `- **SHOW:** ${b.show}\n`;
      if (b.cue) md += `- **CUE:** ${b.cue}\n`;
      md += '\n';
    });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pitch-script.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentBeat = localBeats.find((b) => b.id === selectedBeatId) || localBeats[0];

  if (isPitchLoading && !pitch) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isLocked && (
        <div className="p-3 bg-muted border border-border rounded-lg flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-foreground" />
            <span>Locked for the event by leader</span>
          </div>
          {isLeader && <span className="font-mono text-[11px] text-foreground font-medium">Edit access active</span>}
        </div>
      )}

      <PitchStationHeader
        beats={localBeats}
        selectedBeatId={selectedBeatId}
        timeLimitSec={timeLimitSec}
        onStartRehearsal={() => onStartRehearsal()}
        onOpenReadMode={onOpenReadMode}
        onPullFromDoc={async () => {
          try {
            setPullDiffModal(await pullPitchFromDoc(roomId, false));
          } catch (e: any) {
            toast.error(e?.message || 'Failed to pull from doc');
          }
        }}
        onPushToDoc={async () => {
          try {
            const res = await pushPitchToDoc(roomId);
            toast.success(`Updated DEMO_SCRIPT.md (doc v${res.docVersion})`);
          } catch (e: any) {
            toast.error(e?.message || 'Failed to push to doc');
          }
        }}
        onOpenHistory={() => setHistoryOpen(true)}
        onFitToLimit={handleFitToLimit}
        onDownloadMarkdown={handleDownloadMarkdown}
      />

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <BeatRail
          beats={localBeats}
          selectedBeatId={selectedBeatId}
          onSelectBeat={setSelectedBeatId}
          onReorderBeats={handleUpdateBeats}
          onAddBeat={handleAddBeat}
          onDuplicateBeat={handleDuplicateBeat}
          onDeleteBeat={handleDeleteBeat}
          members={members}
          timeLimitSec={timeLimitSec}
          disabled={isLockedForMe}
        />

        {currentBeat && (
          <BeatEditor
            roomId={roomId}
            beat={currentBeat}
            onUpdateBeat={(beat) => handleUpdateBeats(localBeats.map((b) => (b.id === beat.id ? beat : b)))}
            members={members}
            deckSlides={deckSlides}
            saveStatus={saveStatus}
            conflict={conflict}
            disabled={isLockedForMe}
            roomAiAllowed={roomAiAllowed}
          />
        )}
      </div>

      <RubricCoverage roomId={roomId} onSelectBeat={setSelectedBeatId} />

      <RehearsalHistoryTable
        roomId={roomId}
        rehearsals={rehearsals}
        members={members}
        pitchLimitSec={timeLimitSec}
        onStartRehearsal={() => onStartRehearsal()}
      />

      <VersionHistoryDrawer
        roomId={roomId}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onRestore={async (ver) => {
          try {
            const restored = await restorePitchVersion(roomId, ver);
            queryClient.setQueryData(['pitch-detail', roomId], restored);
            setHistoryOpen(false);
            toast.success(`Restored to version ${ver}`);
          } catch (err: any) {
            toast.error(err?.message || 'Failed to restore version');
          }
        }}
      />

      {pullDiffModal && (
        <PitchDiffModal
          open={Boolean(pullDiffModal)}
          onOpenChange={(open) => !open && setPullDiffModal(null)}
          title="Pull from DEMO_SCRIPT.md"
          proposedText="Incoming changes parsed from DEMO_SCRIPT.md"
          diffText={pullDiffModal.diff}
          acceptLabel="Apply changes"
          onAccept={async () => {
            try {
              await pullPitchFromDoc(roomId, true);
              queryClient.invalidateQueries({ queryKey: ['pitch-detail', roomId] });
              setPullDiffModal(null);
              toast.success('Pitch script updated from document.');
            } catch (err: any) {
              toast.error(err?.message || 'Failed to apply doc changes');
            }
          }}
          onDismiss={() => setPullDiffModal(null)}
        />
      )}

      <PitchCueCards beats={localBeats} members={members} />
    </div>
  );
}
