import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { SpotlightStep, Placement } from './types';

interface CoachCardProps {
  stepIndex: number;
  totalSteps: number;
  step: SpotlightStep;
  placement: Placement;
  style: React.CSSProperties;
  isMobile: boolean;
  isReducedMotion: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onCreateRoom?: () => void;
  onJoinRoom?: () => void;
}

export function CoachCard({
  stepIndex,
  totalSteps,
  step,
  placement,
  style,
  isMobile,
  isReducedMotion,
  onNext,
  onBack,
  onSkip,
  onCreateRoom,
  onJoinRoom,
}: CoachCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Focus trap / focus into card
  useEffect(() => {
    const nextBtn = cardRef.current?.querySelector<HTMLButtonElement>('[data-tour-action="next"]');
    if (nextBtn) {
      nextBtn.focus();
    } else {
      cardRef.current?.focus();
    }
  }, [stepIndex]);

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const isFinale = step.isFinale || isLast;

  return (
    <motion.div
      ref={cardRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      style={style}
      initial={
        isReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, y: placement === 'top' ? -10 : 10, scale: 0.97 }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={
        isReducedMotion
          ? { duration: 0.1 }
          : { type: 'spring', stiffness: 320, damping: 26 }
      }
      className={`z-50 pointer-events-auto rounded-[14px] bg-[#FAF8F3] text-zinc-900 border border-[#E8E2D4] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.22)] dark:bg-[#1A1916] dark:text-zinc-100 dark:border-zinc-800 ${
        placement === 'bottom-sheet' ? 'w-[calc(100vw-32px)] max-w-sm mx-auto' : 'w-[320px] max-w-[320px]'
      }`}
    >
      {/* Arrow indicator */}
      {!isMobile && placement !== 'center' && placement !== 'bottom-sheet' && (
        <div
          className={`absolute size-3 bg-[#FAF8F3] dark:bg-[#1A1916] border-[#E8E2D4] dark:border-zinc-800 rotate-45 pointer-events-none ${
            placement === 'bottom'
              ? '-top-1.5 left-8 border-t border-l'
              : placement === 'top'
              ? '-bottom-1.5 left-8 border-b border-r'
              : placement === 'right'
              ? '-left-1.5 top-6 border-b border-l'
              : '-right-1.5 top-6 border-t border-r'
          }`}
        />
      )}

      {/* Confetti puff on finale */}
      {isFinale && !isReducedMotion && <ConfettiPuff />}

      {/* Top Header Row: step count & skip */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {stepIndex + 1} / {totalSteps}
        </span>
        {!isFinale && (
          <button
            type="button"
            onClick={onSkip}
            className="text-[12px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors focus:outline-none focus-visible:underline"
          >
            Skip tour
          </button>
        )}
      </div>

      {/* Step Title (display serif 24px) */}
      <h3 className="font-serif text-[22px] sm:text-[24px] leading-tight font-normal text-zinc-950 dark:text-zinc-50 mb-2">
        {step.title}
      </h3>

      {/* Step Body */}
      <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed mb-5">
        {step.body}
      </p>

      {/* Step 5 "Try it" hint if applicable */}
      {step.tryItKey === 'ctrl-k' && (
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-mono text-amber-800 dark:text-amber-300 border border-amber-500/20">
          <span>Tip:</span> Press <kbd className="rounded bg-black/10 px-1 py-0.5 dark:bg-white/10">Ctrl K</kbd> to advance now
        </div>
      )}

      {/* Action Buttons */}
      {isFinale ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCreateRoom}
              className="flex-1 rounded-lg bg-zinc-900 px-3 py-2 text-[12px] font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/40"
            >
              Create room
            </button>
            <button
              type="button"
              onClick={onJoinRoom}
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[12px] font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              Join with code
            </button>
          </div>
          <button
            type="button"
            data-tour-action="next"
            onClick={onNext}
            className="w-full text-center py-1 text-[12px] font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-zinc-800/80">
          <div>
            {!isFirst && (
              <button
                type="button"
                onClick={onBack}
                className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 transition-colors focus:outline-none"
              >
                Back
              </button>
            )}
          </div>
          <button
            type="button"
            data-tour-action="next"
            onClick={onNext}
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-[12px] font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/30"
          >
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
}

function ConfettiPuff() {
  const particles = Array.from({ length: 14 });
  const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#F97316'];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[14px]">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * 360;
        const rad = (angle * Math.PI) / 180;
        const dist = 50 + (i % 3) * 25;
        const x = Math.cos(rad) * dist;
        const y = Math.sin(rad) * dist;
        const color = colors[i % colors.length];

        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 size-2 rounded-full"
            style={{ backgroundColor: color }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x, y, scale: [0, 1.2, 0.4], opacity: [1, 0.9, 0] }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}
