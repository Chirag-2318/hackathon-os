import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { GuidedStop } from './guided-stops';
import type { TourPath } from '../types';
import type { TailSide } from './use-card-placement';

interface GuidedCardProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  stop: GuidedStop;
  stopIndex: number;
  totalStops: number;
  tourPath: TourPath;
  cardStyle: React.CSSProperties;
  tailSide?: TailSide | null;
  tailPos?: number | null;
  isReducedMotion?: boolean;
  isMobile?: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onSelectPath?: (path: TourPath) => void;
}

interface CalloutTailProps {
  side: TailSide;
  pos: number;
  isReducedMotion?: boolean;
  stopKey: string;
}

function CalloutTail({ side, pos, isReducedMotion = false, stopKey }: CalloutTailProps) {
  if (side === 'top') {
    return (
      <motion.svg
        key={`tail-${stopKey}-top`}
        width={22}
        height={13}
        viewBox="0 0 22 13"
        initial={isReducedMotion ? undefined : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          top: -12,
          left: pos - 11,
          width: 22,
          height: 13,
          transformOrigin: '11px 0px',
          filter: 'drop-shadow(0 -2px 5px rgba(0,0,0,0.35))',
          pointerEvents: 'none',
          zIndex: 10,
        }}
        className="overflow-visible"
        aria-hidden="true"
      >
        <path
          d="M 0,13 L 9.5,1.5 Q 11,0 12.5,1.5 L 22,13"
          fill="var(--tour-bg)"
          stroke="var(--tour-border)"
          strokeWidth="1"
        />
        <rect x="0.5" y="12" width="21" height="1.5" fill="var(--tour-bg)" stroke="none" />
      </motion.svg>
    );
  }

  if (side === 'bottom') {
    return (
      <motion.svg
        key={`tail-${stopKey}-bottom`}
        width={22}
        height={13}
        viewBox="0 0 22 13"
        initial={isReducedMotion ? undefined : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          bottom: -12,
          left: pos - 11,
          width: 22,
          height: 13,
          transformOrigin: '11px 13px',
          filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.35))',
          pointerEvents: 'none',
          zIndex: 10,
        }}
        className="overflow-visible"
        aria-hidden="true"
      >
        <path
          d="M 0,0 L 9.5,11.5 Q 11,13 12.5,11.5 L 22,0"
          fill="var(--tour-bg)"
          stroke="var(--tour-border)"
          strokeWidth="1"
        />
        <rect x="0.5" y="0" width="21" height="1.5" fill="var(--tour-bg)" stroke="none" />
      </motion.svg>
    );
  }

  if (side === 'left') {
    return (
      <motion.svg
        key={`tail-${stopKey}-left`}
        width={13}
        height={22}
        viewBox="0 0 13 22"
        initial={isReducedMotion ? undefined : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          left: -12,
          top: pos - 11,
          width: 13,
          height: 22,
          transformOrigin: '0px 11px',
          filter: 'drop-shadow(-2px 0 5px rgba(0,0,0,0.35))',
          pointerEvents: 'none',
          zIndex: 10,
        }}
        className="overflow-visible"
        aria-hidden="true"
      >
        <path
          d="M 13,0 L 1.5,9.5 Q 0,11 1.5,12.5 L 13,22"
          fill="var(--tour-bg)"
          stroke="var(--tour-border)"
          strokeWidth="1"
        />
        <rect x="11.5" y="0.5" width="1.5" height="21" fill="var(--tour-bg)" stroke="none" />
      </motion.svg>
    );
  }

  // Right
  return (
    <motion.svg
      key={`tail-${stopKey}-right`}
      width={13}
      height={22}
      viewBox="0 0 13 22"
      initial={isReducedMotion ? undefined : { scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'absolute',
        right: -12,
        top: pos - 11,
        width: 13,
        height: 22,
        transformOrigin: '13px 11px',
        filter: 'drop-shadow(2px 0 5px rgba(0,0,0,0.35))',
        pointerEvents: 'none',
        zIndex: 10,
      }}
      className="overflow-visible"
      aria-hidden="true"
    >
      <path
        d="M 0,0 L 11.5,9.5 Q 13,11 11.5,12.5 L 0,22"
        fill="var(--tour-bg)"
        stroke="var(--tour-border)"
        strokeWidth="1"
      />
      <rect x="0" y="0.5" width="1.5" height="21" fill="var(--tour-bg)" stroke="none" />
    </motion.svg>
  );
}

import { SeatChoiceCard } from './SeatChoiceCard';

export function GuidedCard({
  cardRef,
  stop,
  stopIndex,
  totalStops,
  tourPath,
  cardStyle,
  tailSide = null,
  tailPos = null,
  isReducedMotion = false,
  isMobile = false,
  onNext,
  onPrev,
  onSkip,
  onSelectPath,
}: GuidedCardProps) {
  if (stop.isSeatChoice) {
    return (
      <SeatChoiceCard
        cardRef={cardRef}
        stopIndex={stopIndex}
        totalStops={totalStops}
        isReducedMotion={isReducedMotion}
        isMobile={isMobile}
        onSkip={onSkip}
        onSelectPath={(path) => {
          if (onSelectPath) {
            onSelectPath(path);
          } else {
            onNext();
          }
        }}
      />
    );
  }
  const titleHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const sceneContainerRef = useRef<HTMLDivElement | null>(null);
  const [sceneScale, setSceneScale] = useState(1);

  const title = typeof stop.title === 'function' ? stop.title(tourPath) : stop.title;
  const caption = typeof stop.caption === 'function' ? stop.caption(tourPath) : stop.caption;
  const isLastStop = stopIndex === totalStops - 1;

  // Focus management on stop change
  useEffect(() => {
    if (titleHeadingRef.current) {
      titleHeadingRef.current.focus();
    }
  }, [stop.id]);

  // Scale scene content with ResizeObserver transform to fit the scene column
  useEffect(() => {
    const el = sceneContainerRef.current;
    if (!el) return;

    const updateScale = () => {
      if (!sceneContainerRef.current) return;
      const { width, height } = sceneContainerRef.current.getBoundingClientRect();
      // Scene base canvas dimensions: 480 x 300
      const s = Math.min((width - 8) / 480, (height - 8) / 300, 1);
      setSceneScale(Math.max(0.4, s));
    };

    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    updateScale();

    return () => ro.disconnect();
  }, [stop.id]);

  const SceneComponent = stop.Scene;

  return (
    <motion.div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-card-title"
      tabIndex={-1}
      style={{
        ...cardStyle,
        backgroundColor: 'var(--tour-bg)',
        color: 'var(--tour-text)',
        borderColor: 'var(--tour-border)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 60px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
      }}
      initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: cardStyle.transform ? undefined : 1 }}
      exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-[20px] border outline-none flex flex-col relative ${
        isMobile ? 'max-h-[78vh]' : 'h-[420px] w-[720px]'
      }`}
    >
      {/* Callout Tail pointing at target */}
      {!isMobile && tailSide && tailPos != null && (
        <CalloutTail
          side={tailSide}
          pos={tailPos}
          isReducedMotion={isReducedMotion}
          stopKey={stop.id}
        />
      )}

      {/* Clipped Card Interior */}
      <div className="w-full h-full flex flex-col rounded-[19px] overflow-hidden">
        {/* Live region announcement */}
        <div className="sr-only" aria-live="polite">
          {`${title}. ${caption}`}
        </div>

        {/* Main Content Area (Two columns on desktop, text left, scene right) */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 ${
            isMobile
              ? 'flex flex-col gap-3'
              : 'grid grid-cols-12 gap-5 items-center'
          }`}
        >
          {/* Left Column: Chips, Title, Caption */}
          <div className={`${isMobile ? 'order-2' : 'col-span-5'} flex flex-col gap-2.5 text-left min-w-0`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2 py-0.5 rounded bg-[var(--tour-surface)] border border-[var(--tour-border)] text-xs font-mono font-bold text-amber-400 tracking-wider"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {stop.hourLabel || `HOUR ${stop.hour}`}
              </span>
              {stop.sidebarTag && (
                <span
                  className="px-2 py-0.5 rounded-full bg-[var(--tour-surface)] text-[11px] font-mono text-[var(--tour-text-muted)] border border-[var(--tour-border)]"
                  title="Location in [brackit]"
                >
                  {stop.sidebarTag}
                </span>
              )}
            </div>

            <h2
              id="tour-card-title"
              ref={titleHeadingRef}
              tabIndex={-1}
              className="text-2xl sm:text-[32px] text-[var(--tour-text)] font-normal leading-[1.1] tracking-tight outline-none"
              style={{ fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }}
            >
              {title}
            </h2>

            <p
              className="text-[14px] text-[var(--tour-text-muted)] font-normal leading-relaxed"
              style={{ fontFamily: 'var(--font-ui, "Inter", sans-serif)' }}
            >
              {caption}
            </p>
          </div>

          {/* Right Column: Scene Window with ResizeObserver scaling */}
          <div
            ref={sceneContainerRef}
            className={`${
              isMobile ? 'order-1 h-[200px]' : 'col-span-7 h-[280px]'
            } w-full flex items-center justify-center relative overflow-hidden bg-[#FCFAF5] rounded-xl border border-neutral-300/80 shadow-md p-2`}
          >
            <div
              style={{
                transform: `scale(${sceneScale})`,
                transformOrigin: 'center center',
                width: 480,
                height: 300,
              }}
              className="shrink-0 flex items-center justify-center"
            >
              {stop.isSeatChoice && onSelectPath ? (
                // @ts-expect-error PickSeatScene takes onSelectPath
                <SceneComponent onSelectPath={onSelectPath} isReducedMotion={isReducedMotion} />
              ) : (
                <SceneComponent
                  active={true}
                  progress={1}
                  tourPath={tourPath}
                  isReducedMotion={isReducedMotion}
                  onAdvance={onNext}
                />
              )}
            </div>
          </div>
        </div>

        {/* Card Footer Row (inside card, pinned to bottom) */}
        <div className="h-[52px] px-5 bg-[var(--tour-surface)] border-t border-[var(--tour-border)] flex items-center justify-between gap-3 shrink-0">
          {/* Left: Progress dots */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: totalStops }).map((_, idx) => (
              <span
                key={idx}
                className={`size-2 rounded-full transition-colors ${
                  idx < stopIndex
                    ? 'bg-amber-400'
                    : idx === stopIndex
                    ? 'bg-[var(--tour-text)] scale-125'
                    : 'bg-[var(--tour-surface-2)] border border-[var(--tour-border)]'
                }`}
              />
            ))}
          </div>

          {/* Right: Controls (Back, Next/Finish, Skip tour) */}
          <div className="flex items-center gap-2.5 ml-auto">
            {stopIndex > 0 && (
              <button
                type="button"
                onClick={onPrev}
                className="h-[36px] px-3.5 rounded-lg border border-[var(--tour-border)] bg-[var(--tour-surface-2)] hover:bg-[var(--tour-surface)] text-xs font-semibold text-[var(--tour-text)] transition-colors cursor-pointer"
              >
                Back
              </button>
            )}

            <button
              type="button"
              onClick={onNext}
              className="h-[36px] px-4 rounded-lg bg-[var(--tour-text)] hover:bg-white text-xs font-bold text-neutral-950 transition-all shadow-[0_2px_12px_rgba(244,241,234,0.18)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isLastStop ? 'Finish' : 'Next'}
            </button>

            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-[var(--tour-text-muted)] hover:text-[var(--tour-text)] transition-colors cursor-pointer ml-1 underline decoration-[var(--tour-text-muted)]/40 underline-offset-2"
            >
              Skip tour
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

