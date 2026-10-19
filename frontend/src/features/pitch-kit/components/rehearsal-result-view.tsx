import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Target, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { deleteRehearsal, type RehearsalDetail } from '../api/pitch-kit-api';
import { RehearsalTimeline } from './rehearsal-timeline';
import { RehearsalCoachPanel } from './rehearsal-coach-panel';
import { toast } from 'sonner';

export interface RehearsalResultViewProps {
  roomId: string;
  rehearsal: RehearsalDetail;
  currentUserId?: string;
  roomAiAllowed?: boolean;
  onRunAgain: () => void;
  onPractiseWeakestBeat: (beatId: string) => void;
}

function fmtSec(ms: number) {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RehearsalResultView({
  roomId,
  rehearsal,
  currentUserId,
  roomAiAllowed = true,
  onRunAgain,
  onPractiseWeakestBeat,
}: RehearsalResultViewProps) {
  const navigate = useNavigate();
  const [selectedBeatId, setSelectedBeatId] = useState<string>(
    rehearsal.beatTimings[0]?.beatId || ''
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const durationStr = fmtSec(rehearsal.durationMs);
  const targetStr = fmtSec(rehearsal.plannedMs || 180000);
  const totalDeltaSec = Math.round((rehearsal.durationMs - (rehearsal.plannedMs || 180000)) / 1000);

  // Subtitle sentence built from real numbers
  const summarySentence = useMemo(() => {
    let sentence = '';
    if (totalDeltaSec <= 0) {
      sentence = `${Math.abs(totalDeltaSec)} seconds under.`;
    } else {
      sentence = `${totalDeltaSec} seconds over the target limit.`;
    }
    if (rehearsal.metrics?.slowestBeatId) {
      const beat = rehearsal.beats?.find((b) => b.id === rehearsal.metrics.slowestBeatId);
      const deltaSec = Math.round(rehearsal.metrics.slowestBeatDeltaMs / 1000);
      if (deltaSec > 0) {
        sentence += ` Slowest beat: ${beat?.title || 'Beat'}, ${deltaSec} seconds over its slot.`;
      }
    }
    return sentence;
  }, [totalDeltaSec, rehearsal.metrics, rehearsal.beats]);

  // Find weakest beat for "Practise the weakest beat"
  const weakestBeatId = useMemo(() => {
    if (rehearsal.metrics?.beatMetrics?.length > 0) {
      // Pick beat with lowest scriptCoveragePct, or highest deltaMs
      const sorted = [...rehearsal.metrics.beatMetrics].sort((a, b) => {
        if (a.scriptCoveragePct !== b.scriptCoveragePct) return a.scriptCoveragePct - b.scriptCoveragePct;
        return b.deltaMs - a.deltaMs;
      });
      return sorted[0]?.beatId;
    }
    return rehearsal.beatTimings[0]?.beatId;
  }, [rehearsal.metrics, rehearsal.beatTimings]);

  const selectedBeat = rehearsal.beats?.find((b) => b.id === selectedBeatId);
  const selectedMetric = rehearsal.metrics?.beatMetrics?.find((m) => m.beatId === selectedBeatId);
  const selectedTranscript = rehearsal.transcript?.[selectedBeatId];

  const canDelete = Boolean(currentUserId && rehearsal.userId === currentUserId);

  const handleDelete = async () => {
    if (!confirm('Delete this rehearsal run?')) return;
    setIsDeleting(true);
    try {
      await deleteRehearsal(roomId, rehearsal.id);
      toast.success('Rehearsal deleted.');
      navigate(`/app/room/${roomId}/pitch-kit?tab=pitch`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete rehearsal');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-[1120px] mx-auto p-6 sm:p-8 space-y-8 bg-background text-foreground">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/app/room/${roomId}/pitch-kit?tab=pitch`)}
          className="h-8 px-2 text-xs font-mono text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Pitch station
        </Button>
      </div>

      {/* HEADLINE */}
      <div className="space-y-2 border-b border-border pb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <h1 className="font-display text-5xl sm:text-[56px] font-normal tracking-tight text-foreground">
            {durationStr} of {targetStr}
          </h1>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-mono text-xs px-2.5 py-1 rounded-md font-medium',
                rehearsal.countsTowardReadiness
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-muted text-muted-foreground border border-border'
              )}
            >
              {rehearsal.countsTowardReadiness
                ? 'Counts toward readiness'
                : 'Practice only: run the full pitch to the end'}
            </span>
          </div>
        </div>

        <p className="font-mono text-sm text-muted-foreground">
          {summarySentence}
        </p>
      </div>

      {/* TIMELINE */}
      <RehearsalTimeline
        rehearsal={rehearsal}
        selectedBeatId={selectedBeatId}
        onSelectBeat={setSelectedBeatId}
      />

      {/* HAIRLINE METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pace */}
        <div className="border border-border rounded-xl p-4 bg-card space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block">
            Pace (Target: 130–170 wpm)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
              {rehearsal.metrics?.overallWpm || 0} <span className="text-xs font-normal text-muted-foreground">wpm</span>
            </span>
            {rehearsal.delta?.wpmDelta != null && (
              <span className="font-mono text-xs text-muted-foreground flex items-center tabular-nums">
                {rehearsal.delta.wpmDelta >= 0 ? '+' : ''}{rehearsal.delta.wpmDelta}
              </span>
            )}
          </div>
        </div>

        {/* Fillers */}
        <div className="border border-border rounded-xl p-4 bg-card space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block">
            Filler words
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
              {rehearsal.metrics?.totalFillers || 0}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                ({rehearsal.metrics?.fillersPerMin?.toFixed(1) || 0}/min)
              </span>
            </span>
            {rehearsal.delta?.fillersDelta != null && (
              <span className="font-mono text-xs text-muted-foreground flex items-center tabular-nums">
                {rehearsal.delta.fillersDelta >= 0 ? '+' : ''}{rehearsal.delta.fillersDelta}
              </span>
            )}
          </div>
        </div>

        {/* Script Coverage */}
        <div className="border border-border rounded-xl p-4 bg-card space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block">
            Script coverage
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
              {rehearsal.metrics?.overallCoveragePct || 0}%
            </span>
            {rehearsal.delta?.coverageDeltaPct != null && (
              <span className="font-mono text-xs text-muted-foreground flex items-center tabular-nums">
                {rehearsal.delta.coverageDeltaPct >= 0 ? '+' : ''}{rehearsal.delta.coverageDeltaPct}%
              </span>
            )}
          </div>
        </div>

        {/* Stumbles */}
        <div className="border border-border rounded-xl p-4 bg-card space-y-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block">
            Stumbles
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
              {rehearsal.stumbles?.length || 0}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {rehearsal.completionPct}% completed
            </span>
          </div>
        </div>
      </div>

      {/* PER BEAT DETAIL */}
      {selectedBeat && (
        <div className="border border-border rounded-xl bg-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block">
                Beat comparison
              </span>
              <h3 className="font-display text-xl font-normal text-foreground">
                {selectedBeat.title}
              </h3>
            </div>
            {selectedMetric && (
              <div className="font-mono text-xs text-muted-foreground flex items-center gap-3">
                <span>{selectedMetric.wpm} wpm</span>
                <span>{selectedMetric.fillerCount} fillers</span>
                <span>{selectedMetric.scriptCoveragePct}% coverage</span>
              </div>
            )}
          </div>

          {rehearsal.mode === 'TIMED' ? (
            <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
              <p>Timed-only run recorded durations.</p>
              <p className="text-muted-foreground/70">
                Add your Groq key and use Voice to get a transcript, pace and filler words.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                  Script
                </span>
                <div className="p-3 bg-muted/20 border border-border rounded-md text-foreground/90 leading-relaxed font-normal whitespace-pre-wrap">
                  {selectedBeat.say || '(No say text)'}
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                  What you said
                </span>
                <div className="p-3 bg-muted/10 border border-border rounded-md text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedTranscript || '(No audio transcribed for this beat)'}
                </div>

                {selectedMetric?.missedPhrases && selectedMetric.missedPhrases.length > 0 && (
                  <div className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                    Missed key phrases: {selectedMetric.missedPhrases.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI COACH PANEL */}
      <RehearsalCoachPanel
        roomId={roomId}
        rehearsalId={rehearsal.id}
        initialCoach={rehearsal.coach}
        roomAiAllowed={roomAiAllowed}
      />

      {/* ACTIONS */}
      <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onRunAgain} className="text-xs">
            <Play className="w-3.5 h-3.5 mr-1.5" /> Run again
          </Button>

          {weakestBeatId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPractiseWeakestBeat(weakestBeatId)}
              className="text-xs"
            >
              <Target className="w-3.5 h-3.5 mr-1.5" /> Practise the weakest beat
            </Button>
          )}
        </div>

        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={handleDelete}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete this run
          </Button>
        )}
      </div>
    </div>
  );
}
