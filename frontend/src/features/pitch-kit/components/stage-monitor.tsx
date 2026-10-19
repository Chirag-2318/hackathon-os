import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, AlertTriangle, Check, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PitchBeat, BeatTiming, Stumble } from '../api/pitch-kit-api';

export interface StageMonitorProps {
  beats: PitchBeat[];
  timeLimitSec: number;
  mode: 'TIMED' | 'VOICE';
  teleprompter: boolean;
  audioStream?: MediaStream | null;
  members: any[];
  onUploadBeatAudio?: (beatId: string, blob: Blob) => Promise<any>;
  onFinish: (timings: BeatTiming[], stumbles: Stumble[], endedReason: 'COMPLETE' | 'STOPPED') => void;
  onDiscard: () => void;
}

function fmtSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function StageMonitor({
  beats,
  timeLimitSec,
  mode,
  teleprompter,
  audioStream,
  members,
  onUploadBeatAudio,
  onFinish,
  onDiscard,
}: StageMonitorProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [handoverName, setHandoverName] = useState<string | null>(null);

  // High precision timing using performance.now()
  const [elapsedTotalMs, setElapsedTotalMs] = useState(0);
  const [elapsedBeatMs, setElapsedBeatMs] = useState(0);
  const [stumbles, setStumbles] = useState<Stumble[]>([]);

  const timingsRef = useRef<BeatTiming[]>([]);
  const beatStartPerfRef = useRef<number>(performance.now());
  const pausedAccumMsRef = useRef<number>(0);
  const pauseStartPerfRef = useRef<number | null>(null);
  const lastHiddenTimeRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const memberMap = useMemo(() => {
    const map = new Map<string, any>();
    members.forEach((m) => {
      if (m.id) map.set(m.id, m);
      if (m.userId) map.set(m.userId, m);
    });
    return map;
  }, [members]);

  const currentBeat = beats[currentIdx];
  const nextBeat = beats[currentIdx + 1];

  // Wake lock
  useEffect(() => {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((lock) => {
        wakeLockRef.current = lock;
      }).catch(() => {});
    }
    return () => {
      wakeLockRef.current?.release?.().catch(() => {});
    };
  }, []);

  // Before unload guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Tab visibility automatic pause (> 5s hidden)
  useEffect(() => {
    const handleVis = () => {
      if (document.hidden) {
        lastHiddenTimeRef.current = Date.now();
      } else if (lastHiddenTimeRef.current) {
        if (Date.now() - lastHiddenTimeRef.current > 5000) {
          setIsPaused(true);
        }
        lastHiddenTimeRef.current = null;
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, []);

  // MediaRecorder for Voice mode
  const startRecordingBeat = useCallback((beatId: string) => {
    if (mode !== 'VOICE' || !audioStream) return;
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      const rec = new MediaRecorder(audioStream);
      mediaRecorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0 && onUploadBeatAudio) {
          onUploadBeatAudio(beatId, e.data);
        }
      };
      rec.start();
    } catch {}
  }, [mode, audioStream, onUploadBeatAudio]);

  // Initial beat start
  useEffect(() => {
    beatStartPerfRef.current = performance.now();
    startRecordingBeat(beats[0]?.id);
  }, []);

  // Frame loop for precise timing
  useEffect(() => {
    let animId: number;
    const tick = () => {
      if (!isPaused) {
        const now = performance.now();
        const beatDelta = now - beatStartPerfRef.current - pausedAccumMsRef.current;
        setElapsedBeatMs(Math.max(0, beatDelta));

        const pastMs = timingsRef.current.reduce((sum, t) => sum + t.actualMs, 0);
        setElapsedTotalMs(pastMs + Math.max(0, beatDelta));
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPaused]);

  // Pause / Resume
  const togglePause = useCallback(() => {
    if (isPaused) {
      if (pauseStartPerfRef.current) {
        pausedAccumMsRef.current += performance.now() - pauseStartPerfRef.current;
        pauseStartPerfRef.current = null;
      }
      setIsPaused(false);
    } else {
      pauseStartPerfRef.current = performance.now();
      setIsPaused(true);
    }
  }, [isPaused]);

  // Step to next beat
  const handleNextBeat = useCallback(() => {
    const now = performance.now();
    const actualMs = Math.round(now - beatStartPerfRef.current - pausedAccumMsRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    const currentTiming: BeatTiming = {
      beatId: currentBeat.id,
      plannedMs: currentBeat.durationSec * 1000,
      actualMs,
      startedAtMs: Math.round(beatStartPerfRef.current),
    };
    timingsRef.current = [...timingsRef.current, currentTiming];

    if (currentIdx < beats.length - 1) {
      const nextIdx = currentIdx + 1;
      const nextSpeaker = beats[nextIdx].speakerUserId ? memberMap.get(beats[nextIdx].speakerUserId) : null;
      if (beats[nextIdx].speakerUserId !== currentBeat.speakerUserId && nextSpeaker) {
        const name = nextSpeaker.name || nextSpeaker.displayName || 'Teammate';
        setHandoverName(name);
        setTimeout(() => setHandoverName(null), 1500);
      }
      setCurrentIdx(nextIdx);
      beatStartPerfRef.current = performance.now();
      pausedAccumMsRef.current = 0;
      startRecordingBeat(beats[nextIdx].id);
    } else {
      onFinish(timingsRef.current, stumbles, 'COMPLETE');
    }
  }, [currentIdx, beats, currentBeat, memberMap, stumbles, onFinish, startRecordingBeat]);

  const handlePrevBeat = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      beatStartPerfRef.current = performance.now();
      pausedAccumMsRef.current = 0;
      startRecordingBeat(beats[currentIdx - 1].id);
    }
  }, [currentIdx, beats, startRecordingBeat]);

  const handleStumble = useCallback(() => {
    setStumbles((prev) => [...prev, { atMs: Math.round(elapsedTotalMs), beatId: currentBeat.id }]);
  }, [elapsedTotalMs, currentBeat]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showExitConfirm) return;
      if (e.code === 'Space' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextBeat();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevBeat();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        togglePause();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleStumble();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsPaused(true);
        setShowExitConfirm(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleNextBeat, handlePrevBeat, togglePause, handleStumble, showExitConfirm]);

  const currentSpeaker = currentBeat.speakerUserId ? memberMap.get(currentBeat.speakerUserId) : null;
  const isBeatOvertime = elapsedBeatMs > currentBeat.durationSec * 1000;
  const isTotalOvertime = elapsedTotalMs > timeLimitSec * 1000;
  const remainingBeatSec = Math.max(0, currentBeat.durationSec - Math.floor(elapsedBeatMs / 1000));

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#070708] text-[#F4F1EA] flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden font-sans">
      {/* Handover Banner */}
      {handoverName && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#F4F1EA] text-[#070708] px-6 py-2 rounded-full font-mono text-xs font-semibold uppercase tracking-wider animate-in fade-in">
          Handover to @{handoverName}
        </div>
      )}

      {/* TOP ROW: Segmented Progress Bar & Speaker/Title */}
      <div className="space-y-4">
        <div className="h-2 w-full bg-white/10 rounded-full flex gap-1 overflow-hidden">
          {beats.map((b, i) => {
            const isFilled = i < currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div
                key={b.id}
                style={{ flex: b.durationSec }}
                className={cn(
                  'h-full rounded-full transition-all duration-150',
                  isFilled ? 'bg-[#F4F1EA]' : isCurrent ? 'bg-[#F4F1EA] opacity-80 animate-pulse' : 'bg-white/20'
                )}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentSpeaker && <UserAvatar user={currentSpeaker} size={28} className="w-7 h-7 text-xs" />}
            <span className="font-display text-xl font-normal text-[#F4F1EA]">
              {currentBeat.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {mode === 'VOICE' && (
              <div className="flex items-center gap-1.5 font-mono text-xs text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                <span>REC</span>
              </div>
            )}
            <span className="font-mono text-xs text-white/50 uppercase tracking-wider">
              Beat {currentIdx + 1} of {beats.length}
            </span>
          </div>
        </div>
      </div>

      {/* CENTRE: Teleprompter SAY, SHOW, CUE */}
      <div className="my-auto max-w-4xl mx-auto text-center space-y-6">
        {teleprompter && (
          <p className="font-display text-3xl sm:text-[40px] leading-[1.3] text-[#F4F1EA] max-w-[28em] mx-auto tracking-normal font-normal">
            {currentBeat.say || '(Silence / demo action)'}
          </p>
        )}

        {(currentBeat.show || currentBeat.cue) && (
          <div className="flex items-center justify-center gap-6 font-mono text-xs text-white/40">
            {currentBeat.show && <span>SHOW: {currentBeat.show}</span>}
            {currentBeat.cue && <span>CUE: {currentBeat.cue}</span>}
          </div>
        )}

        {/* Timers */}
        <div className="flex items-baseline justify-center gap-4 pt-4">
          <span
            className={cn(
              'font-mono text-6xl sm:text-7xl tabular-nums font-bold tracking-tight',
              isTotalOvertime ? 'text-rose-500' : isBeatOvertime ? 'text-amber-400' : 'text-[#F4F1EA]'
            )}
          >
            {fmtSec(elapsedTotalMs / 1000)}
          </span>
          <span className="font-mono text-lg text-white/40 tabular-nums">
            -{fmtSec(remainingBeatSec)} beat
          </span>
        </div>
      </div>

      {/* BOTTOM ROW: Next Beat and Control Buttons */}
      <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="font-mono text-xs text-white/50">
          {nextBeat ? (
            <span>Next: <strong className="text-white/80">{nextBeat.title}</strong> ({fmtSec(nextBeat.durationSec)})</span>
          ) : (
            <span className="text-emerald-400">Final beat — Space finishes</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevBeat}
            disabled={currentIdx === 0}
            className="text-white/70 hover:text-white hover:bg-white/10 text-xs font-mono h-9"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Prev (←)
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={togglePause}
            className="text-white/70 hover:text-white hover:bg-white/10 text-xs font-mono h-9"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 mr-1" />}
            {isPaused ? 'Resume (P)' : 'Pause (P)'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleStumble}
            className="text-amber-400/80 hover:text-amber-400 hover:bg-white/10 text-xs font-mono h-9"
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Stumble (S)
          </Button>

          <Button
            size="sm"
            onClick={handleNextBeat}
            className="bg-[#F4F1EA] text-[#070708] hover:bg-white text-xs font-mono font-medium h-9 px-4"
          >
            {currentIdx === beats.length - 1 ? 'Finish' : 'Next (Space)'}
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Confirm Exit Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/20 p-6 rounded-xl max-w-sm w-full space-y-4 text-center">
            <h3 className="font-display text-xl text-white">Pause rehearsal?</h3>
            <p className="text-xs text-white/60">Choose what to do with this partial run:</p>
            <div className="space-y-2 pt-2">
              <Button
                className="w-full bg-[#F4F1EA] text-[#070708] hover:bg-white text-xs"
                onClick={() => {
                  onFinish(timingsRef.current, stumbles, 'STOPPED');
                }}
              >
                Save what you have
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 text-xs"
                onClick={() => {
                  setShowExitConfirm(false);
                  setIsPaused(false);
                }}
              >
                Keep going
              </Button>
              <Button
                variant="ghost"
                className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs"
                onClick={onDiscard}
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
