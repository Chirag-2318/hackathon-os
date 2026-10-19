import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getVisualViewport, computeCanvasScale } from './viewport-scale';

interface TourWelcomeModalProps {
  isOpen: boolean;
  onTakeTour: () => void;
  onSkipTour: () => void;
  isReducedMotion?: boolean;
}

export function TourWelcomeModal({
  isOpen,
  onTakeTour,
  onSkipTour,
  isReducedMotion = false,
}: TourWelcomeModalProps) {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const takeTourBtnRef = useRef<HTMLButtonElement | null>(null);
  const [viewport, setViewport] = useState(() => getVisualViewport());

  // Listen to viewport changes for zoom/resize overflow safety
  useEffect(() => {
    if (!isOpen) return;
    const handleUpdate = () => setViewport(getVisualViewport());
    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('orientationchange', handleUpdate, { passive: true });
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', handleUpdate);
      vv.addEventListener('scroll', handleUpdate);
    }
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('orientationchange', handleUpdate);
      if (vv) {
        vv.removeEventListener('resize', handleUpdate);
        vv.removeEventListener('scroll', handleUpdate);
      }
    };
  }, [isOpen]);

  const modalScale = computeCanvasScale(viewport.width, viewport.height, 520, 360, 0.5, 1.0, 32);

  // Trap and restore focus; handle Esc
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      const t = setTimeout(() => {
        takeTourBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkipTour();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSkipTour]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--backdrop-fallback,#0a0a0b80)] supports-[backdrop-filter]:bg-[var(--backdrop)] backdrop-blur-[3px] select-none"
        style={{
          backdropFilter: 'var(--backdrop-blur, blur(3px))',
          WebkitBackdropFilter: 'var(--backdrop-blur, blur(3px))',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-modal-title"
      >
        <motion.div
          initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={isReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{
            transform: `scale(${modalScale})`,
            transformOrigin: 'center center',
          }}
          className="w-full max-w-[520px] bg-[#0B0D12] text-[#F7F4EB] rounded-[20px] border border-[#222736] p-7 sm:p-9 shadow-[0_24px_80px_rgba(0,0,0,0.85),0_0_40px_rgba(255,255,255,0.03)] flex flex-col items-center text-center gap-5 relative overflow-hidden"
        >
          {/* Headline in Instrument Serif */}
          <h2
            id="welcome-modal-title"
            tabIndex={-1}
            className="text-4xl sm:text-[44px] font-normal text-[#F7F4EB] leading-[1.08] tracking-tight outline-none"
            style={{ fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }}
          >
            Take a 90-second tour.
          </h2>

          {/* Body */}
          <p
            className="text-[15px] sm:text-base text-[#F7F4EB]/70 font-normal leading-relaxed max-w-md"
            style={{ fontFamily: 'var(--font-ui, "Inter", sans-serif)' }}
          >
            See how a hackathon runs here, from creating a room to submitting, right inside the real app.
          </p>

          {/* Single quiet line in mono */}
          <p
            className="text-xs font-mono text-[#8E97AA]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Shown once. You can't miss anything by skipping.
          </p>

          {/* Buttons: Cream primary + Ghost skip */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <button
              ref={takeTourBtnRef}
              type="button"
              autoFocus
              onClick={onTakeTour}
              className="w-full sm:flex-1 h-11 rounded-xl bg-[#F7F4EB] hover:bg-white text-neutral-950 font-bold text-sm shadow-[0_2px_16px_rgba(247,244,235,0.2)] hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
            >
              Take the tour
            </button>

            <button
              type="button"
              onClick={onSkipTour}
              className="w-full sm:w-auto h-11 px-5 rounded-xl border border-[#2B3448] bg-transparent hover:bg-[#161B28] text-xs font-semibold text-[#D1D5DB] transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
