import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, Clock, Play, AlertCircle, Volume2 } from 'lucide-react';
import { useAiAction } from '@/features/ai-gate';
import { cn } from '@/lib/utils';
import type { PitchBeat } from '../api/pitch-kit-api';

export interface RehearsalLaunchConfig {
  mode: 'TIMED' | 'VOICE';
  scope: 'FULL' | 'MY_BEATS' | 'ONE_BEAT';
  beatIds: string[];
  teleprompter: boolean;
  audioStream?: MediaStream | null;
  selectedDeviceId?: string;
}

export interface RehearsalSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beats: PitchBeat[];
  currentUserId?: string;
  roomAiAllowed?: boolean;
  initialScope?: 'FULL' | 'MY_BEATS' | 'ONE_BEAT';
  initialBeatId?: string;
  onLaunch: (config: RehearsalLaunchConfig) => void;
}

export function RehearsalSetupDialog({
  open,
  onOpenChange,
  beats,
  currentUserId,
  roomAiAllowed = true,
  initialScope = 'FULL',
  initialBeatId,
  onLaunch,
}: RehearsalSetupDialogProps) {
  const { hasKey, isAvailable } = useAiAction({ aiAllowed: roomAiAllowed });
  const [mode, setMode] = useState<'TIMED' | 'VOICE'>('TIMED');
  const [scope, setScope] = useState<'FULL' | 'MY_BEATS' | 'ONE_BEAT'>(initialScope);
  const [selectedSingleBeatId, setSelectedSingleBeatId] = useState<string>(
    initialBeatId || beats[0]?.id || ''
  );
  const [teleprompter, setTeleprompter] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Audio & Mic state
  const [micGranted, setMicGranted] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [micLevel, setMicLevel] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const hasMyBeats = Boolean(
    currentUserId && beats.some((b) => b.speakerUserId === currentUserId)
  );

  // Stop media stream on close or mode switch
  const stopAudio = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setMicLevel(0);
  };

  useEffect(() => {
    if (!open) {
      stopAudio();
      setCountdown(null);
    }
  }, [open]);

  // Request mic when Voice mode is selected
  useEffect(() => {
    if (open && mode === 'VOICE') {
      let isMounted = true;
      navigator.mediaDevices
        ?.getUserMedia({
          audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
        })
        .then(async (stream) => {
          if (!isMounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          setMicGranted(true);
          setMicError(null);

          // Enumerate input devices
          const devs = await navigator.mediaDevices.enumerateDevices();
          setAudioDevices(devs.filter((d) => d.kind === 'audioinput'));

          // Web Audio Analyser
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            audioCtxRef.current = ctx;
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            src.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateMeter = () => {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
              animFrameRef.current = requestAnimationFrame(updateMeter);
            };
            updateMeter();
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          setMicError(err.message || 'Microphone access denied');
          setMicGranted(false);
        });

      return () => {
        isMounted = false;
        stopAudio();
      };
    } else {
      stopAudio();
    }
  }, [open, mode, selectedDeviceId]);

  const handleStart = () => {
    let resolvedBeatIds: string[] = [];
    if (scope === 'FULL') {
      resolvedBeatIds = beats.map((b) => b.id);
    } else if (scope === 'MY_BEATS') {
      resolvedBeatIds = beats.filter((b) => b.speakerUserId === currentUserId).map((b) => b.id);
    } else {
      resolvedBeatIds = [selectedSingleBeatId];
    }

    // Start 3 second countdown
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          onLaunch({
            mode,
            scope,
            beatIds: resolvedBeatIds,
            teleprompter,
            audioStream: mode === 'VOICE' ? streamRef.current : null,
            selectedDeviceId,
          });
          onOpenChange(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] bg-card border-border p-6 space-y-5">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal text-foreground">
            Rehearsal setup
          </DialogTitle>
        </DialogHeader>

        {countdown !== null ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <span className="font-mono text-7xl font-bold text-foreground animate-pulse">
              {countdown}
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Starting stage monitor...
            </span>
          </div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* MODE SELECTION */}
            <div className="space-y-2">
              <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('TIMED')}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all cursor-pointer',
                    mode === 'TIMED'
                      ? 'border-foreground bg-accent/60 text-foreground font-medium'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-foreground" />
                    <span className="font-medium text-xs text-foreground">Timed mode</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Stopwatch pacing only. Works offline.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setMode('VOICE')}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all cursor-pointer relative',
                    mode === 'VOICE'
                      ? 'border-foreground bg-accent/60 text-foreground font-medium'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground',
                    !isAvailable && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Mic className="w-4 h-4 text-foreground" />
                    <span className="font-medium text-xs text-foreground">Voice mode</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Transcribes speech via Groq for transcript & pace analysis.
                  </p>
                  {!hasKey && (
                    <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 block mt-1">
                      Groq key needed in Settings
                    </span>
                  )}
                </button>
              </div>

              {mode === 'VOICE' && (
                <div className="p-3 bg-muted/30 border border-border rounded-md space-y-2">
                  <p className="text-[11px] text-muted-foreground">
                    Audio is sent to Groq for transcription with your key and is not stored.
                  </p>
                  {micError ? (
                    <div className="flex items-center justify-between text-destructive text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{micError}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px]"
                        onClick={() => setMode('TIMED')}
                      >
                        Continue timed-only
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Input level:
                        </span>
                        <div className="w-36 h-2 bg-muted rounded-full overflow-hidden border border-border">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-75"
                            style={{ width: `${micLevel}%` }}
                          />
                        </div>
                      </div>

                      {audioDevices.length > 1 && (
                        <select
                          value={selectedDeviceId}
                          onChange={(e) => setSelectedDeviceId(e.target.value)}
                          className="w-full bg-background border border-border rounded p-1 text-[11px]"
                        >
                          {audioDevices.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>
                              {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SCOPE SELECTION */}
            <div className="space-y-2">
              <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                Scope
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('FULL')}
                  className={cn(
                    'p-2 rounded border text-center transition-all',
                    scope === 'FULL'
                      ? 'border-foreground bg-accent/60 font-medium'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  Full pitch
                </button>
                <button
                  type="button"
                  disabled={!hasMyBeats}
                  onClick={() => setScope('MY_BEATS')}
                  className={cn(
                    'p-2 rounded border text-center transition-all',
                    scope === 'MY_BEATS'
                      ? 'border-foreground bg-accent/60 font-medium'
                      : 'border-border text-muted-foreground hover:text-foreground',
                    !hasMyBeats && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  Only my beats
                </button>
                <button
                  type="button"
                  onClick={() => setScope('ONE_BEAT')}
                  className={cn(
                    'p-2 rounded border text-center transition-all',
                    scope === 'ONE_BEAT'
                      ? 'border-foreground bg-accent/60 font-medium'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  One beat
                </button>
              </div>

              {scope === 'ONE_BEAT' && (
                <select
                  value={selectedSingleBeatId}
                  onChange={(e) => setSelectedSingleBeatId(e.target.value)}
                  className="w-full bg-background border border-border rounded p-1.5 text-xs text-foreground mt-2"
                >
                  {beats.map((b, i) => (
                    <option key={b.id} value={b.id}>
                      Beat {i + 1}: {b.title} ({b.durationSec}s)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* TELEPROMPTER TOGGLE */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div>
                <span className="font-medium text-foreground block">Teleprompter text</span>
                <span className="text-[11px] text-muted-foreground">
                  Display large SAY script on the stage monitor
                </span>
              </div>
              <input
                type="checkbox"
                checked={teleprompter}
                onChange={(e) => setTeleprompter(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-foreground"
              />
            </div>
          </div>
        )}

        {countdown === null && (
          <DialogFooter className="flex justify-end gap-2 border-t border-border pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-muted-foreground"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleStart} className="text-xs">
              <Play className="w-3.5 h-3.5 mr-1.5" /> Start rehearsal
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
