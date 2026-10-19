import React, { useState, useMemo, useEffect } from 'react';
import { Minus, Plus, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAiAction } from '@/features/ai-gate';
import { PitchDiffModal } from './pitch-diff-modal';
import {
  aiEditPitchBeat,
  type PitchBeat,
  type PitchAiEditResponse,
} from '../api/pitch-kit-api';
import { cn } from '@/lib/utils';

export interface BeatEditorProps {
  roomId: string;
  beat: PitchBeat;
  onUpdateBeat: (updated: PitchBeat) => void;
  members: any[];
  deckSlides?: Array<{ pageNo: number; title: string }>;
  saveStatus: 'idle' | 'saving' | 'saved' | 'offline';
  conflict: { theirBeat?: PitchBeat; onKeepMine: () => void; onViewTheirs: () => void; onMerge: () => void } | null;
  disabled?: boolean;
  roomAiAllowed?: boolean;
}

function fmtSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function BeatEditor({
  roomId,
  beat,
  onUpdateBeat,
  members,
  deckSlides = [],
  saveStatus,
  conflict,
  disabled = false,
  roomAiAllowed = true,
}: BeatEditorProps) {
  const { guard, tooltip, isAvailable } = useAiAction({ aiAllowed: roomAiAllowed });
  const [aiDiff, setAiDiff] = useState<PitchAiEditResponse | null>(null);
  const [aiPendingAction, setAiPendingAction] = useState<string | null>(null);

  // Live word counter & pacing
  const words = useMemo(() => {
    return beat.say.trim().length === 0 ? 0 : beat.say.trim().split(/\s+/).length;
  }, [beat.say]);

  const estSec = Math.round((words / 150) * 60);

  const pacingTone = useMemo(() => {
    if (words === 0 || estSec <= beat.durationSec) return 'text-emerald-600 dark:text-emerald-400';
    if (estSec <= beat.durationSec * 1.3) return 'text-amber-600 dark:text-amber-400';
    return 'text-destructive';
  }, [words, estSec, beat.durationSec]);

  const handleStepDuration = (delta: number) => {
    const next = Math.max(3, Math.min(600, beat.durationSec + delta));
    onUpdateBeat({ ...beat, durationSec: next });
  };

  const handleTriggerAi = (action: 'Tighten to fit' | 'Punchier' | 'Explain the jargon') => {
    guard(async () => {
      setAiPendingAction(action);
      try {
        const res = await aiEditPitchBeat(roomId, {
          action,
          beatSay: beat.say,
          title: beat.title,
          targetSeconds: beat.durationSec,
        });
        setAiDiff(res);
      } finally {
        setAiPendingAction(null);
      }
    })();
  };

  const selectedSpeaker = members.find(
    (m) => m.id === beat.speakerUserId || m.userId === beat.speakerUserId
  );

  return (
    <div className="flex-1 space-y-6">
      {/* Conflict banner */}
      {conflict && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center justify-between text-xs text-foreground">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span>Another teammate updated this pitch. Choose how to proceed:</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={conflict.onViewTheirs}>
              View theirs
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={conflict.onMerge}>
              Merge
            </Button>
            <Button size="sm" variant="default" className="h-7 text-xs" onClick={conflict.onKeepMine}>
              Keep mine
            </Button>
          </div>
        </div>
      )}

      {/* Top Header inside editor: Title and Duration Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <input
          type="text"
          value={beat.title}
          disabled={disabled}
          onChange={(e) => onUpdateBeat({ ...beat, title: e.target.value })}
          placeholder="Beat title..."
          className="font-display text-[28px] font-normal tracking-tight bg-transparent border-0 border-b border-transparent focus:border-border outline-none w-full max-w-lg text-foreground placeholder:text-muted-foreground/40 leading-tight"
        />

        <div className="flex items-center gap-4 shrink-0">
          {/* Stepper */}
          <div className="flex items-center border border-border rounded-md bg-muted/20 p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || beat.durationSec <= 3}
              onClick={() => handleStepDuration(-5)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono text-xs tabular-nums font-medium px-2 min-w-[44px] text-center">
              {fmtSec(beat.durationSec)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || beat.durationSec >= 600}
              onClick={() => handleStepDuration(5)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Speaker picker */}
          <div className="flex items-center gap-1.5 border border-border rounded-md px-2 py-1 bg-background text-xs">
            {selectedSpeaker ? (
              <UserAvatar user={selectedSpeaker} size={20} className="w-5 h-5 text-[10px]" />
            ) : (
              <div className="w-5 h-5 rounded-full border border-dashed border-border" />
            )}
            <select
              value={beat.speakerUserId || ''}
              disabled={disabled}
              onChange={(e) => onUpdateBeat({ ...beat, speakerUserId: e.target.value || null })}
              className="bg-transparent border-0 outline-none text-xs text-foreground cursor-pointer"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id || m.userId} value={m.id || m.userId}>
                  {m.name || m.displayName || m.username || 'Member'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SAY SECTION */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            SAY (Script)
          </label>
          <span className="font-mono text-[10px] text-muted-foreground">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'offline' && 'Offline'}
          </span>
        </div>

        <textarea
          value={beat.say}
          disabled={disabled}
          onChange={(e) => onUpdateBeat({ ...beat, say: e.target.value })}
          rows={6}
          placeholder="Write what the presenter says aloud..."
          className="w-full rounded-md border border-border bg-background p-3 text-[17px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-foreground/40 transition-colors resize-y font-normal"
        />

        {/* Live counters under SAY */}
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <span className={cn('tabular-nums font-medium', pacingTone)}>
            {words} words, about {estSec} s at 150 wpm, you gave this beat {beat.durationSec} s
          </span>

          {/* Thin row of AI actions */}
          <div className="flex items-center gap-1">
            {(['Tighten to fit', 'Punchier', 'Explain the jargon'] as const).map((act) => (
              <Button
                key={act}
                type="button"
                variant="ghost"
                size="sm"
                title={tooltip}
                disabled={disabled || !isAvailable || aiPendingAction !== null || !beat.say.trim()}
                onClick={() => handleTriggerAi(act)}
                className="h-6 px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground"
              >
                {aiPendingAction === act ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1 text-muted-foreground" />
                )}
                {act}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* SHOW & CUE SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* SHOW */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              SHOW (Visual / Screen)
            </label>
            {deckSlides.length > 0 && (
              <select
                value={beat.slideRef || ''}
                disabled={disabled}
                onChange={(e) => onUpdateBeat({ ...beat, slideRef: e.target.value || null })}
                className="bg-transparent border-0 font-mono text-[10px] text-muted-foreground cursor-pointer outline-none hover:text-foreground"
              >
                <option value="">Link slide...</option>
                {deckSlides.map((s) => (
                  <option key={s.pageNo} value={`Slide ${s.pageNo}: ${s.title}`}>
                    Slide {s.pageNo}: {s.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <textarea
            value={beat.show}
            disabled={disabled}
            onChange={(e) => onUpdateBeat({ ...beat, show: e.target.value })}
            rows={3}
            placeholder="What is displayed or demoed on screen..."
            className="w-full rounded-md border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-foreground/40 transition-colors resize-y"
          />
        </div>

        {/* CUE */}
        <div className="space-y-1.5">
          <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
            CUE (Operator hint)
          </label>
          <textarea
            value={beat.cue}
            disabled={disabled}
            onChange={(e) => onUpdateBeat({ ...beat, cue: e.target.value })}
            rows={3}
            placeholder="Operator handoff or transition trigger..."
            className="w-full rounded-md border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-foreground/40 transition-colors resize-y"
          />
        </div>
      </div>

      {/* AI Diff modal */}
      {aiDiff && (
        <PitchDiffModal
          open={Boolean(aiDiff)}
          onOpenChange={(open) => !open && setAiDiff(null)}
          title="Proposed AI replacement"
          originalText={beat.say}
          proposedText={aiDiff.proposedText}
          diffText={aiDiff.diff}
          onAccept={() => {
            onUpdateBeat({ ...beat, say: aiDiff.proposedText });
            setAiDiff(null);
          }}
          onDismiss={() => setAiDiff(null)}
        />
      )}
    </div>
  );
}
