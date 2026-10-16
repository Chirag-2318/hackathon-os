import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Ticket, Check } from 'lucide-react';
import type { TourPath } from '../types';
import { cn } from '@/lib/utils';

export interface SeatChoiceCardProps {
  cardRef?: React.RefObject<HTMLDivElement | null>;
  stopIndex: number;
  totalStops: number;
  isReducedMotion?: boolean;
  isMobile?: boolean;
  onSkip: () => void;
  onSelectPath: (path: TourPath) => void;
}

export function SeatChoiceCard({
  cardRef,
  stopIndex,
  totalStops,
  isReducedMotion = false,
  isMobile = false,
  onSkip,
  onSelectPath,
}: SeatChoiceCardProps) {
  const [selected, setSelected] = useState<TourPath>('LEADER');

  const handleContinue = () => {
    onSelectPath(selected);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowUp' || e.key === '1') {
        e.preventDefault();
        setSelected('LEADER');
      } else if (e.key === 'ArrowDown' || e.key === '2') {
        e.preventDefault();
        setSelected('MEMBER');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleContinue();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected]);

  return (
    <motion.div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="seat-choice-title"
      tabIndex={-1}
      initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      style={{
        backgroundColor: '#070708',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 60px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.4)',
      }}
      className={cn(
        "border outline-none z-50 text-[#F4F1EA] select-none",
        isMobile
          ? "fixed bottom-0 left-0 right-0 w-full rounded-t-[20px] p-6 pb-8 max-h-[85vh] overflow-y-auto"
          : "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(520px,calc(100vw-32px))] rounded-[20px] p-7"
      )}
    >
      {/* Top Header Row: Progress Dots & Skip tour */}
      <div className="flex items-center justify-between gap-3">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: totalStops }).map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "size-2 rounded-full transition-all",
                idx < stopIndex
                  ? "bg-amber-400"
                  : idx === stopIndex
                  ? "bg-[#F4F1EA] scale-125"
                  : "bg-white/15"
              )}
            />
          ))}
        </div>

        {/* Skip tour */}
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-neutral-400 hover:text-[#F4F1EA] transition-colors cursor-pointer"
        >
          Skip tour
        </button>
      </div>

      {/* Headline & Subtitle */}
      <div className="mt-5 text-left">
        <h2
          id="seat-choice-title"
          className="text-[32px] text-[#F4F1EA] font-normal leading-[1.15] tracking-tight"
          style={{ fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }}
        >
          Who's on this flight?
        </h2>
        <p className="text-[14px] text-neutral-400 font-normal leading-relaxed mt-1.5">
          Pick your seat. We'll tailor the tour to it.
        </p>
      </div>

      {/* Two Role Options */}
      <div className="mt-6 flex flex-col gap-3">
        {/* Leader Option */}
        <button
          type="button"
          onClick={() => setSelected('LEADER')}
          className={cn(
            "w-full rounded-xl p-4 text-left flex items-center justify-between gap-3.5 transition-all cursor-pointer outline-none border focus-visible:ring-2 focus-visible:ring-[#F4F1EA]/50",
            isMobile ? "h-[56px] py-2" : "h-[76px]",
            selected === 'LEADER'
              ? "bg-[#17171A] border-[rgba(255,255,255,0.32)]"
              : "bg-[#101012] border-[rgba(255,255,255,0.10)] hover:border-[rgba(255,255,255,0.18)]"
          )}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <Crown className="size-5 shrink-0 text-[#F4F1EA]/80" strokeWidth={1.75} />
            <div className="flex flex-col min-w-0">
              <span className="text-[16px] font-medium text-[#F4F1EA] leading-snug">
                I'm leading a team
              </span>
              {!isMobile && (
                <span className="text-[13px] text-neutral-400 leading-snug truncate">
                  Create the room, invite people and approve the plan.
                </span>
              )}
            </div>
          </div>
          <div
            className={cn(
              "size-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
              selected === 'LEADER'
                ? "border-[#F4F1EA] bg-[#F4F1EA] text-neutral-950"
                : "border-white/30 bg-transparent"
            )}
            aria-hidden="true"
          >
            {selected === 'LEADER' && <Check className="size-3 stroke-[3]" />}
          </div>
        </button>

        {/* Member Option */}
        <button
          type="button"
          onClick={() => setSelected('MEMBER')}
          className={cn(
            "w-full rounded-xl p-4 text-left flex items-center justify-between gap-3.5 transition-all cursor-pointer outline-none border focus-visible:ring-2 focus-visible:ring-[#F4F1EA]/50",
            isMobile ? "h-[56px] py-2" : "h-[76px]",
            selected === 'MEMBER'
              ? "bg-[#17171A] border-[rgba(255,255,255,0.32)]"
              : "bg-[#101012] border-[rgba(255,255,255,0.10)] hover:border-[rgba(255,255,255,0.18)]"
          )}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <Ticket className="size-5 shrink-0 text-[#F4F1EA]/80" strokeWidth={1.75} />
            <div className="flex flex-col min-w-0">
              <span className="text-[16px] font-medium text-[#F4F1EA] leading-snug">
                I'm joining a team
              </span>
              {!isMobile && (
                <span className="text-[13px] text-neutral-400 leading-snug truncate">
                  Join with a code, post ideas and pick up tasks.
                </span>
              )}
            </div>
          </div>
          <div
            className={cn(
              "size-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
              selected === 'MEMBER'
                ? "border-[#F4F1EA] bg-[#F4F1EA] text-neutral-950"
                : "border-white/30 bg-transparent"
            )}
            aria-hidden="true"
          >
            {selected === 'MEMBER' && <Check className="size-3 stroke-[3]" />}
          </div>
        </button>
      </div>

      {/* Footer: Continue Button */}
      <div className={cn("mt-6 flex", isMobile ? "w-full" : "justify-end")}>
        <button
          type="button"
          onClick={handleContinue}
          className={cn(
            "px-6 rounded-lg bg-[#F4F1EA] hover:bg-white text-neutral-950 font-semibold text-sm transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.98]",
            isMobile ? "h-12 w-full" : "h-10"
          )}
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
