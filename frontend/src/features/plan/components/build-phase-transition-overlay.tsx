import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface BuildPhaseTransitionOverlayProps {
  roomId: string;
  docsCount?: number | null;
  phasesCount?: number | null;
  tasksCount?: number | null;
  onNavigate: () => void;
  onComplete: () => void;
}

export function BuildPhaseTransitionOverlay({
  roomId,
  docsCount,
  phasesCount,
  tasksCount,
  onNavigate,
  onComplete,
}: BuildPhaseTransitionOverlayProps) {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Store in sessionStorage so refreshes or re-renders don't replay it
  useEffect(() => {
    const key = `plan_transition_${roomId}`;
    sessionStorage.setItem(key, 'true');
  }, [roomId]);

  // If user prefers reduced motion, render static card with open button
  if (prefersReduced) {
    return (
      <div
        className="fixed inset-0 z-[9999] bg-[#0A0A0B] flex items-center justify-center p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Build phase is ready"
      >
        <div className="w-full max-w-[420px] flex flex-col gap-6 text-[#F4F1EA]">
          <span className="font-mono text-xs tracking-widest text-[#F4F1EA]/60 uppercase">
            BUILD PHASE
          </span>
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[40px] leading-tight text-[#F4F1EA]"
          >
            Your build is ready.
          </h1>

          <div className="flex flex-col gap-3 py-2">
            {['Plan locked', `${docsCount ? `${docsCount} ` : ''}documents created`, `${phasesCount ? `${phasesCount} ` : '5 '}phases ready`, 'Board ready'].map((label, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="#F4F1EA" strokeWidth="1.5" strokeOpacity="0.4" />
                  <path d="M7 12.5L10.5 16L17 8.5" stroke="#F4F1EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={() => {
              onNavigate();
              onComplete();
            }}
            className="w-full bg-[#F4F1EA] text-[#0A0A0B] hover:bg-[#F4F1EA]/90 font-medium text-xs h-9 mt-2"
          >
            Open the board
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AnimatedTransition
      docsCount={docsCount}
      phasesCount={phasesCount}
      tasksCount={tasksCount}
      onNavigate={onNavigate}
      onComplete={onComplete}
    />
  );
}

function AnimatedTransition({
  docsCount,
  phasesCount,
  tasksCount,
  onNavigate,
  onComplete,
}: {
  docsCount?: number | null;
  phasesCount?: number | null;
  tasksCount?: number | null;
  onNavigate: () => void;
  onComplete: () => void;
}) {
  // Step state: 0 to 4
  const [activeStep, setActiveStep] = useState(0);
  const [showHeadlineReady, setShowHeadlineReady] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [isLifting, setIsLifting] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  const navigatedRef = useRef(false);
  const completedRef = useRef(false);

  const finishImmediately = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (!navigatedRef.current) {
      navigatedRef.current = true;
      onNavigate();
    }
    setIsLifting(true);
    setTimeout(onComplete, 350);
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Allow skip text after 800ms
    timers.push(setTimeout(() => setCanSkip(true), 800));

    // Stagger 4 checklist steps (each ~450ms)
    timers.push(setTimeout(() => setActiveStep(1), 450));
    timers.push(setTimeout(() => setActiveStep(2), 900));
    timers.push(setTimeout(() => setActiveStep(3), 1350));
    timers.push(setTimeout(() => setActiveStep(4), 1800));

    // Crossfade headline to "Your build is ready."
    timers.push(setTimeout(() => setShowHeadlineReady(true), 1900));

    // Navigate router underneath at ~2250ms
    timers.push(
      setTimeout(() => {
        if (!navigatedRef.current) {
          navigatedRef.current = true;
          setHasNavigated(true);
          onNavigate();
        }
      }, 2250)
    );

    // Fade and lift away overlay at 2600ms over 350ms
    timers.push(
      setTimeout(() => {
        setIsLifting(true);
      }, 2350)
    );

    timers.push(
      setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      }, 2700)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onNavigate, onComplete]);

  const rows = [
    { label: 'Plan locked', count: null },
    { label: 'documents created', count: docsCount ?? 8 },
    { label: 'phases ready', count: phasesCount ?? 5 },
    { label: 'Board ready', count: null },
  ];

  // Progress width
  const progressPercent = Math.min(100, Math.round((activeStep / 4) * 100));

  return (
    <div
      onClick={() => {
        // Clicking anywhere skips after the first row (after 450ms)
        if (activeStep >= 1) {
          finishImmediately();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Setting up your build"
      className={cn(
        'fixed inset-0 z-[9999] bg-[#0A0A0B] flex items-center justify-center p-6 select-none cursor-default',
        'transition-all duration-350 ease-out',
        isLifting ? '-translate-y-2 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      )}
    >
      <div className="w-full max-w-[420px] flex flex-col gap-7 text-[#F4F1EA]">
        {/* Label: BUILD PHASE */}
        <span className="font-mono text-xs tracking-widest text-[#F4F1EA]/60 uppercase">
          BUILD PHASE
        </span>

        {/* Headline with crossfade in Instrument Serif */}
        <div className="relative min-h-[48px]">
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className={cn(
              'text-[40px] leading-tight text-[#F4F1EA] absolute inset-0 transition-opacity duration-300',
              showHeadlineReady ? 'opacity-0' : 'opacity-100'
            )}
          >
            Setting up your build.
          </h1>
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className={cn(
              'text-[40px] leading-tight text-[#F4F1EA] transition-opacity duration-300',
              showHeadlineReady ? 'opacity-100' : 'opacity-0'
            )}
          >
            Your build is ready.
          </h1>
        </div>

        {/* Vertical checklist of 4 real steps */}
        <div className="flex flex-col gap-3.5 py-1">
          {rows.map((row, idx) => {
            const isDone = activeStep > idx;
            const isCurrent = activeStep === idx;
            const isPending = activeStep < idx;

            return (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-3.5 text-sm transition-opacity duration-300',
                  isPending ? 'opacity-30' : 'opacity-100'
                )}
              >
                {/* Thin circle that draws itself into a check with stroke animation */}
                <div className="size-5 shrink-0 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#F4F1EA"
                      strokeWidth="1.5"
                      strokeOpacity={isDone ? 0.6 : 0.25}
                    />
                    <path
                      d="M7 12.5L10.5 16L17 8.5"
                      stroke="#F4F1EA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: 20,
                        strokeDashoffset: isDone ? 0 : 20,
                        transition: 'stroke-dashoffset 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </svg>
                </div>

                {/* Label sliding in 6px + count in mono */}
                <div
                  className={cn(
                    'flex items-center gap-1.5 transition-transform duration-300 text-sm font-normal text-[#F4F1EA]',
                    isCurrent ? 'translate-x-0' : isDone ? 'translate-x-0' : '-translate-x-1.5'
                  )}
                >
                  {row.count != null && (
                    <span className="font-mono text-sm font-semibold text-[#F4F1EA]">
                      {row.count}
                    </span>
                  )}
                  <span>{row.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2px hairline progress line with soft cream glow at leading tip */}
        <div className="w-full h-[2px] bg-[#F4F1EA]/15 rounded-full overflow-hidden relative">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-[#F4F1EA] transition-all duration-400 ease-out relative"
          >
            {progressPercent > 0 && progressPercent < 100 && (
              <span
                className="absolute right-0 top-1/2 -translate-y-1/2 size-2 rounded-full bg-[#F4F1EA]"
                style={{
                  boxShadow: '0 0 8px 2px rgba(244, 241, 234, 0.8)',
                }}
              />
            )}
          </div>
        </div>

        {/* Subtle Skip text appearing after 800ms */}
        <div className="min-h-[24px] flex justify-center pt-2">
          {canSkip && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                finishImmediately();
              }}
              className="font-mono text-xs text-[#F4F1EA]/40 hover:text-[#F4F1EA] transition-colors cursor-pointer tracking-wider uppercase"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
