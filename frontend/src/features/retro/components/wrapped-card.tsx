/**
 * WrappedCard / WrappedStat — M13 Hackathon Wrapped
 * PRD 5b §3.2, §5. [D S24, §5; A M13].
 *
 * Fill #231F1B, cream text. Exactly four numerals: hours, tasks done,
 * first working demo hour, rehearsals. One View pill button (no-op, OQ-10).
 *
 * AC-24-1: Four numerals only, cream text ≥4.5:1 on #231F1B.
 * AC-13-1: M13 plays on first open: card fades in, four stats appear ~200 ms apart,
 *           chart draws, sequence ends on View.
 * AC-13-2: Full sequence under 4 seconds.
 * AC-13-3: Any key press or click skips to final state.
 * AC-13-7: Reduced motion → final card at 200 ms cross-fade + live region.
 * AC-13-9: No Replay control.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { WrappedStats } from '../api/types';
import { Eye } from 'lucide-react';

/** Cream hex — closest to cream in the token set is --pastel-cream #FBECBE (ink-safe) */
const CREAM = '#FBECBE';
const DARK_FILL = '#231F1B';

interface WrappedStatItem {
  label: string;
  value: number;
  unit?: string;
}

/** Ordered per PRD 5b §3.2: hours · tasks done · first working demo hour · rehearsals */
function buildStats(wrapped: WrappedStats): WrappedStatItem[] {
  return [
    { label: 'Hours',                  value: wrapped.hours },
    { label: 'Tasks done',             value: wrapped.tasksDone },
    { label: 'First working demo',     value: wrapped.firstWorkingDemoHour, unit: 'h' },
    { label: 'Rehearsals',             value: wrapped.rehearsals },
  ];
}

/** Rolling number animation */
function RollingNumber({ target, active }: { target: number; active: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setDisplayed(target);
      return;
    }
    const start = 0;
    const duration = 400; // ms
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayed(Math.round(start + (target - start) * progress));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, active]);

  return (
    <span className="tabular-nums" aria-hidden="true">
      {displayed}
    </span>
  );
}

export type WrappedState = 'playing' | 'done' | 'skipped' | 'static';

interface WrappedCardProps {
  wrapped: WrappedStats;
  /** From useWrappedSeen */
  seen: boolean | undefined;
  onMarkSeen: () => void;
  /** Called when M13 completes or is skipped, so timeline dots can enter */
  onSequenceEnd: () => void;
}

export function WrappedCard({
  wrapped,
  seen,
  onMarkSeen,
  onSequenceEnd,
}: WrappedCardProps) {
  const prefersReduced = useReducedMotion();
  const stats = buildStats(wrapped);

  // M13 orchestration state
  const [animState, setAnimState] = useState<WrappedState>(() => {
    if (seen === false && !prefersReduced) return 'playing';
    return 'static';
  });
  const [visibleStats, setVisibleStats] = useState<number>(
    animState === 'static' ? 4 : 0,
  );
  const [cardVisible, setCardVisible] = useState(animState === 'static');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const skipToFinal = () => {
    clearTimers();
    setCardVisible(true);
    setVisibleStats(4);
    setAnimState('skipped');
    onMarkSeen();
    onSequenceEnd();
  };

  // Announce for screen readers [A M13, §3.3]
  const liveText = `Hackathon Wrapped: ${wrapped.hours} hours, ${wrapped.tasksDone} tasks done, first working demo at hour ${wrapped.firstWorkingDemoHour}, ${wrapped.rehearsals} rehearsals.`;

  // Start M13 sequence
  useEffect(() => {
    if (animState !== 'playing' || prefersReduced) {
      if (prefersReduced && seen === false) {
        // Reduced motion: show final card with 200 ms cross-fade
        setCardVisible(true);
        setVisibleStats(4);
        setAnimState('static');
        onMarkSeen();
        onSequenceEnd();
      }
      return;
    }

    // Mark seen on start (OQ-18: timing isolated here)
    onMarkSeen();

    // 1. Card fades in (t-base = 220 ms)
    const t1 = setTimeout(() => setCardVisible(true), 0);

    // 2. Stats appear sequentially, 200 ms apart
    const t2 = setTimeout(() => setVisibleStats(1), 300);
    const t3 = setTimeout(() => setVisibleStats(2), 500);
    const t4 = setTimeout(() => setVisibleStats(3), 700);
    const t5 = setTimeout(() => setVisibleStats(4), 900);

    // 3. Sequence ends — signal chart to draw + update state
    const t6 = setTimeout(() => {
      setAnimState('done');
      onSequenceEnd();
      // Total elapsed ≈ 1.3 s well under 4 s [AC-13-2]
    }, 1300);

    timersRef.current = [t1, t2, t3, t4, t5, t6];
    return clearTimers;
  }, []);

  const isPlaying = animState === 'playing';

  return (
    <>
      {/* Live region for screen readers [A §3.3] */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {(animState === 'done' || animState === 'skipped' || animState === 'static') && liveText}
      </div>

      {/* Skip target: any keypress or click while playing */}
      <div
        data-state={animState}
        aria-label="Hackathon Wrapped"
        aria-live="off"
        onClick={isPlaying ? skipToFinal : undefined}
        onKeyDown={isPlaying ? (e) => { if (e.key) skipToFinal(); } : undefined}
        tabIndex={isPlaying ? 0 : undefined}
        role={isPlaying ? 'button' : undefined}
        aria-label-details={isPlaying ? 'Press any key or click to skip' : undefined}
        className={isPlaying ? 'cursor-pointer select-none' : undefined}
        style={{ outline: 'none' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={cardVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={prefersReduced
            ? { duration: 0.2 }
            : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
          }
          className="rounded-card p-6 flex flex-col gap-6"
          style={{ backgroundColor: DARK_FILL }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2
              className="text-h2 font-bold"
              style={{ color: CREAM }}
            >
              Hackathon Wrapped
            </h2>
            <span
              className="text-caption"
              style={{ color: CREAM, opacity: 0.6 }}
            >
              Hackathon Workspace
            </span>
          </div>

          {/* Four stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={isPlaying ? { opacity: 0, y: 12 } : { opacity: 1, y: 0 }}
                animate={i < visibleStats ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-1"
              >
                <p
                  className="text-display leading-none font-bold tabular-nums"
                  style={{ color: CREAM, fontSize: '2.5rem', lineHeight: 1 }}
                  aria-label={`${stat.value}${stat.unit ?? ''} ${stat.label}`}
                >
                  <RollingNumber
                    target={stat.value}
                    active={isPlaying && i < visibleStats}
                  />
                  {stat.unit && (
                    <span className="text-h3" style={{ color: CREAM }}>
                      {stat.unit}
                    </span>
                  )}
                </p>
                <p
                  className="text-label"
                  style={{ color: CREAM, opacity: 0.75 }}
                >
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* View button [D S24, §5] — no-op pending OQ-10 */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="rounded-pill min-h-[44px] px-5"
              style={{
                borderColor: CREAM,
                color: CREAM,
                backgroundColor: 'transparent',
              }}
              onClick={(e) => {
                e.stopPropagation();
                // TODO(OQ-10): wire View destination once decided
              }}
              aria-label="View Hackathon Wrapped details"
            >
              <Eye className="size-4 mr-1.5" />
              View
            </Button>
          </div>

          {isPlaying && (
            <p
              className="text-caption text-center"
              style={{ color: CREAM, opacity: 0.5 }}
            >
              Press any key or click to skip
            </p>
          )}
        </motion.div>
      </div>
    </>
  );
}
