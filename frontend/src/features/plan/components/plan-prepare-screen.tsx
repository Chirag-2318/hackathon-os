import * as React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { planService, type PlanPrepareStatus, type PrepareStage, type PrepareStageState } from '@/services/planService';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlanPrepareScreenProps {
  roomId: string;
  stepIndex?: number;
  totalSteps?: number;
  onComplete: () => void;
  onOpenAnyway: () => void;
  onRetry?: () => void;
}

interface StageRowProps {
  label: string;
  state: PrepareStageState;
  detail?: string;
  prefersReducedMotion: boolean;
}

const StageRow = React.memo(function StageRow({
  label,
  state,
  detail,
}: StageRowProps) {
  const isDone = state === 'DONE' || state === 'SKIPPED';
  const isRunning = state === 'RUNNING';
  const isFallback = state === 'FALLBACK';

  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border/40 last:border-b-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-4 flex items-center justify-center shrink-0">
          {isDone ? (
            <Check className="size-3.5 text-primary stroke-[2.5]" />
          ) : isFallback ? (
            <span className="text-xs text-amber-500 font-mono">*</span>
          ) : isRunning ? (
            <span className="size-1.5 rounded-full bg-foreground" />
          ) : (
            <span className="size-1 rounded-full bg-muted-foreground/30" />
          )}
        </div>
        <span
          className={`text-sm transition-opacity duration-150 ${
            isRunning || isDone ? 'text-foreground font-medium' : 'text-muted-foreground/60'
          }`}
        >
          {label}
        </span>
      </div>

      {detail && (
        <span className="text-xs text-muted-foreground truncate max-w-[240px] tabular-nums text-right font-normal">
          {detail}
        </span>
      )}
    </div>
  );
});

export function PlanPrepareScreen({
  roomId,
  stepIndex = 1,
  totalSteps = 4,
  onComplete,
  onOpenAnyway,
}: PlanPrepareScreenProps) {
  const queryClient = useQueryClient();
  const [statusData, setStatusData] = useState<PlanPrepareStatus | null>(null);
  const [mountTime] = useState(() => Date.now());
  const [isReady, setIsReady] = useState(false);
  const [isLiftingAway, setIsLiftingAway] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const etagRef = useRef<string | undefined>(undefined);
  const startTimeRef = useRef<number>(Date.now());
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTriggeredRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Handle Ready transition
  const handleReady = React.useCallback(() => {
    if (readyTriggeredRef.current) return;
    readyTriggeredRef.current = true;
    setIsReady(true);

    const elapsed = Date.now() - mountTime;
    const holdRemaining = Math.max(0, 1000 - elapsed);

    setTimeout(async () => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['plan-prompt', roomId, stepIndex],
          queryFn: () => planService.getStepPrompt(roomId, stepIndex),
        });
      } catch (_) {}

      // Hold 400ms on ready, then lift away
      setTimeout(() => {
        setIsLiftingAway(true);
        setTimeout(() => {
          onComplete();
        }, prefersReducedMotion ? 0 : 250);
      }, prefersReducedMotion ? 0 : 400);
    }, holdRemaining);
  }, [mountTime, onComplete, queryClient, prefersReducedMotion, roomId, stepIndex]);

  // Status Polling with ETag & backoff (500ms -> 1s after 8s)
  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
        const res = await planService.getStepPrepareStatusWithEtag(roomId, stepIndex, etagRef.current);
        if (!active) return;

        if (res.etag) {
          etagRef.current = res.etag;
        }

        if (!res.notModified && res.data) {
          setStatusData(res.data);
          if (res.data.status === 'READY' || res.data.status === 'FALLBACK') {
            handleReady();
            return;
          }
        }

        const nextInterval = elapsedSec >= 8 ? 1000 : 500;
        pollTimerRef.current = setTimeout(poll, nextInterval);
      } catch (_) {
        if (!active) return;
        pollTimerRef.current = setTimeout(poll, 1000);
      }
    }

    poll();
    return () => {
      active = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [handleReady, roomId, stepIndex]);

  // Extract up to 3 real facts from backend
  const realFacts = useMemo(() => {
    const list: string[] = [];
    if (statusData?.facts?.approvedIdeaTitles?.[0]) {
      list.push(`Approved idea: "${statusData.facts.approvedIdeaTitles[0]}"`);
    }
    if (statusData?.facts?.rubricCriterionNames?.[0]) {
      list.push(`Scoring rubric: ${statusData.facts.rubricCriterionNames[0]}`);
    }
    if (statusData?.facts?.teamHandles?.[0]) {
      list.push(`Team: ${statusData.facts.teamHandles[0]}`);
    }
    return list;
  }, [statusData?.facts]);

  // Cycle facts every 1200ms
  useEffect(() => {
    if (realFacts.length <= 1) return;
    const timer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % realFacts.length);
    }, 1200);
    return () => clearInterval(timer);
  }, [realFacts.length]);

  // Map 3 stages from backend
  const stagesMap = useMemo(() => {
    const map = new Map<string, PrepareStage>();
    if (statusData?.stages) {
      for (const s of statusData.stages) {
        map.set(s.key, s);
      }
    }
    return map;
  }, [statusData?.stages]);

  const s1 = stagesMap.get('READ_INPUTS');
  const s2 = stagesMap.get('JUDGE_IDEA');
  const s3 = stagesMap.get('WRITE_PROMPT');

  // Completed count for hairline progress
  const completedCount = useMemo(() => {
    let c = 0;
    if (s1?.state === 'DONE' || s1?.state === 'SKIPPED' || s1?.state === 'FALLBACK') c++;
    if (s2?.state === 'DONE' || s2?.state === 'SKIPPED' || s2?.state === 'FALLBACK') c++;
    if (s3?.state === 'DONE' || s3?.state === 'SKIPPED' || s3?.state === 'FALLBACK') c++;
    return c;
  }, [s1?.state, s2?.state, s3?.state]);

  const scaleRatio = isReady ? 1 : Math.min(1, Math.max(0.05, completedCount / 3));

  const headline = isReady
    ? 'Your plan is ready.'
    : stepIndex === 1
    ? 'Preparing your plan.'
    : `Preparing step ${stepIndex}.`;

  const timerText = `${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop-fallback,#0a0a0b80)] supports-[backdrop-filter]:bg-[var(--backdrop)] backdrop-blur-[3px] transition-opacity duration-200 ${
        isLiftingAway ? 'opacity-0 -translate-y-1 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}
      style={{
        backdropFilter: 'var(--backdrop-blur, blur(3px))',
        WebkitBackdropFilter: 'var(--backdrop-blur, blur(3px))',
      }}
    >
      <div className="w-full max-w-[480px] bg-card border border-border rounded-xl p-6 sm:p-8 text-card-foreground shadow-xl relative flex flex-col gap-6">
        {/* Hairline Progress Line */}
        <div className="w-full h-[1px] bg-border overflow-hidden">
          <div
            className="h-full bg-primary origin-left transition-transform duration-300 ease-out"
            style={{
              transform: prefersReducedMotion ? 'none' : `scaleX(${scaleRatio})`,
              width: prefersReducedMotion ? `${scaleRatio * 100}%` : '100%',
            }}
          />
        </div>

        {/* Display Headline & Timer */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[11px] tracking-wider uppercase text-muted-foreground">
              STEP {stepIndex} OF {totalSteps}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-normal leading-tight text-foreground tracking-tight">
              {headline}
            </h2>
          </div>
          <span className="font-mono text-xs text-muted-foreground pt-1 tabular-nums">
            {timerText}
          </span>
        </div>

        {/* 3 Real Rows */}
        <div className="flex flex-col">
          <StageRow
            label="Reading your brief, team and ideas"
            state={s1?.state || 'PENDING'}
            detail={s1?.detail}
            prefersReducedMotion={prefersReducedMotion}
          />
          <StageRow
            label={s2?.label || (stepIndex === 1 ? 'Judging the idea, bluntly' : `Analyzing step ${stepIndex}`)}
            state={s2?.state || 'PENDING'}
            detail={s2?.detail || (statusData?.verdict && statusData.verdict !== 'Pending analysis.' ? statusData.verdict : undefined)}
            prefersReducedMotion={prefersReducedMotion}
          />
          <StageRow
            label={s3?.label || `Writing prompt ${stepIndex}`}
            state={s3?.state || 'PENDING'}
            detail={s3?.detail || (isReady ? `Prompt ${stepIndex} ready` : undefined)}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>

        {/* Facts Line crossfading */}
        {realFacts.length > 0 && !isReady && (
          <div className="h-5 overflow-hidden flex items-center">
            {prefersReducedMotion ? (
              <span className="text-xs text-muted-foreground truncate">{realFacts[0]}</span>
            ) : (
              <AnimatePresence mode="wait">
                <motion.span
                  key={factIndex}
                  initial={{ opacity: 0, y: 2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.15 }}
                  className="text-xs text-muted-foreground truncate block"
                >
                  {realFacts[factIndex]}
                </motion.span>
              </AnimatePresence>
            )}
          </div>
        )}

        {/* 6s honest muted line */}
        {elapsedSeconds >= 6 && !isReady && (
          <p className="text-xs text-muted-foreground italic -mt-2">
            This is the only slow step. The next prompts prepare while you work.
          </p>
        )}

        {/* 15s Timeout notice: Open Plan anyway */}
        {elapsedSeconds >= 15 && (
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Taking longer than usual.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAnyway}
              className="h-7 text-xs"
            >
              Open Plan anyway
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
