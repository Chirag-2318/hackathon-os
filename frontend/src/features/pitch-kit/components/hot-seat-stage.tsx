import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  submitHotSeatAnswer,
  uploadHotSeatAudio,
  finishHotSeatSession,
  type QnaItem,
  type StartSessionRequest,
  type SessionSummary,
} from '../api/qna-api';
import { HotSeatSummary } from './hot-seat-summary';
import { HotSeatAskView } from './hot-seat-ask-view';
import { HotSeatRevealView } from './hot-seat-reveal-view';

interface HotSeatStageProps {
  roomId: string;
  sessionId: string;
  initialQuestions: QnaItem[];
  config: StartSessionRequest;
  roomAiAllowed: boolean;
  onClose: () => void;
  onFinishSession: (summary: SessionSummary) => void;
}

export function HotSeatStage({
  roomId,
  sessionId,
  initialQuestions,
  config,
  roomAiAllowed,
  onClose,
  onFinishSession,
}: HotSeatStageProps) {
  const [queue, setQueue] = useState<QnaItem[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<'ASK' | 'REVEAL'>('ASK');
  const [typeAnswer, setTypeAnswer] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [checkedPoints, setCheckedPoints] = useState<Set<number>>(new Set());
  const [requeuedHashes, setRequeuedHashes] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  // Timer & Audio
  const [timeLeft, setTimeLeft] = useState<number>(config.timerSec || 0);
  const questionStartTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);

  // Audio Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const currentItem = queue[currentIndex];

  const keyPoints = useMemo(() => {
    if (!currentItem?.answer) return [];
    return currentItem.answer
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);
  }, [currentItem?.answer]);

  // Start question timer & recording
  const startQuestion = useCallback(() => {
    setStep('ASK');
    setTypeAnswer('');
    setTranscribedText('');
    setCheckedPoints(new Set());
    setTimeLeft(config.timerSec || 0);
    questionStartTimeRef.current = Date.now();

    if (config.answerMode === 'SPEAK') {
      audioChunksRef.current = [];
      navigator.mediaDevices?.getUserMedia({ audio: true }).then((stream) => {
        try {
          const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          mediaRecorderRef.current = rec;
          rec.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          rec.start();
          setIsRecording(true);
        } catch {
          setIsRecording(false);
        }
      }).catch(() => setIsRecording(false));
    }
  }, [config.timerSec, config.answerMode]);

  useEffect(() => {
    startQuestion();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [currentIndex, startQuestion]);

  // Countdown timer
  useEffect(() => {
    if (config.timerSec > 0 && step === 'ASK') {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            handleReveal();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerIntervalRef.current);
    }
  }, [config.timerSec, step]);

  const handleReveal = () => {
    setStep('REVEAL');
    if (config.answerMode === 'SPEAK' && mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0 && currentItem) {
          try {
            const res = await uploadHotSeatAudio(roomId, sessionId, currentItem.hash, audioBlob);
            if (res?.text) setTranscribedText(res.text);
          } catch {
            // Non-blocking voice upload failure
          }
        }
      };
    }
  };

  const togglePoint = (idx: number) => {
    const next = new Set(checkedPoints);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setCheckedPoints(next);
  };

  const handleRate = async (rating: number) => {
    if (!currentItem) return;
    const durationMs = Date.now() - questionStartTimeRef.current;
    const coveredPoints = Array.from(checkedPoints).map((i) => keyPoints[i]).filter(Boolean);

    await submitHotSeatAnswer(roomId, sessionId, {
      hash: currentItem.hash,
      rating,
      answerText: typeAnswer || transcribedText || undefined,
      durationMs,
      followupShown: config.pressure && !!currentItem.followup,
      coveredPoints,
    });

    // Repetition logic: Missed returns 3 questions later, Shaky 6 later
    if (!requeuedHashes.has(currentItem.hash)) {
      if (rating === 1) {
        setRequeuedHashes((prev) => new Set(prev).add(currentItem.hash));
        setQueue((prev) => {
          const next = [...prev];
          next.splice(Math.min(next.length, currentIndex + 4), 0, currentItem);
          return next;
        });
      } else if (rating === 2) {
        setRequeuedHashes((prev) => new Set(prev).add(currentItem.hash));
        setQueue((prev) => {
          const next = [...prev];
          next.splice(Math.min(next.length, currentIndex + 7), 0, currentItem);
          return next;
        });
      }
    }

    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      try {
        const sum = await finishHotSeatSession(roomId, sessionId);
        setSummary(sum);
        onFinishSession(sum);
      } catch {
        onClose();
      }
    }
  };

  // Keyboard navigation: Space = Reveal, 1/2/3 = Rate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (summary) return;
      if (step === 'ASK' && e.code === 'Space' && config.answerMode !== 'TYPE') {
        e.preventDefault();
        handleReveal();
      } else if (step === 'REVEAL') {
        if (e.key === '1') handleRate(1);
        else if (e.key === '2') handleRate(2);
        else if (e.key === '3') handleRate(3);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, summary, config.answerMode]);

  if (summary) {
    return (
      <HotSeatSummary
        summary={summary}
        totalCount={queue.length}
        onBackToMap={onClose}
        onDrillRevisit={(revisitHashes) => {
          const revQuestions = initialQuestions.filter((q) => revisitHashes.includes(q.hash));
          if (revQuestions.length > 0) {
            setQueue(revQuestions);
            setCurrentIndex(0);
            setSummary(null);
            setRequeuedHashes(new Set());
          } else {
            onClose();
          }
        }}
      />
    );
  }

  if (!currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#070708] text-[#F4F1EA] flex flex-col justify-between overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tracking-wider uppercase text-white/50">
            Hot Seat · Drill {currentIndex + 1} of {queue.length}
          </span>
          <div className="flex items-center gap-1">
            {queue.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === currentIndex ? 'w-4 bg-[#F4F1EA]' : i < currentIndex ? 'w-1.5 bg-white/40' : 'w-1.5 bg-white/15'
                )}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {config.timerSec > 0 && (
            <span className={cn('font-mono text-xs font-semibold px-2 py-0.5 rounded border border-white/20', timeLeft <= 10 && 'text-rose-400 border-rose-400/50 animate-pulse')}>
              {timeLeft}s
            </span>
          )}
          <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Thin Timer Bar */}
      {config.timerSec > 0 && (
        <div className="h-0.5 w-full bg-white/10">
          <div
            className="h-full bg-white/80 transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / config.timerSec) * 100}%` }}
          />
        </div>
      )}

      {/* Main Focus Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col justify-center space-y-8 overflow-y-auto">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs text-white/50">
            <span>{currentItem.criterion || 'Criterion General'}</span>
            <span>·</span>
            <span>{config.persona.replace('_', ' ')}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-normal leading-tight text-[#F4F1EA]">
            {currentItem.question}
          </h1>
        </div>

        {step === 'ASK' ? (
          <HotSeatAskView
            answerMode={config.answerMode}
            typeAnswer={typeAnswer}
            onTypeAnswerChange={setTypeAnswer}
            onReveal={handleReveal}
          />
        ) : (
          <HotSeatRevealView
            roomId={roomId}
            item={currentItem}
            keyPoints={keyPoints}
            checkedPoints={checkedPoints}
            onTogglePoint={togglePoint}
            pressure={config.pressure}
            typeAnswer={typeAnswer}
            transcribedText={transcribedText}
            roomAiAllowed={roomAiAllowed}
            onRate={handleRate}
          />
        )}
      </div>

      {/* Footer Navigation Note */}
      <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/40">
        <span>Keyboard: Space (Reveal) · 1, 2, 3 (Rate)</span>
        <span>Near-black stage monitor</span>
      </div>
    </div>
  );
}
