import * as React from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
interface PlanGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    num: 1,
    title: 'Copy the prompt',
    desc: 'Press Copy. It already contains your brief, team and ideas.',
  },
  {
    num: 2,
    title: 'Paste it into Claude',
    desc: 'Attach context.md to the same message, then send.',
  },
  {
    num: 3,
    title: 'Download the file',
    desc: 'Claude creates one .md file. Download it.',
  },
  {
    num: 4,
    title: 'Upload it here',
    desc: 'Drop the file in the upload box and press Validate.',
  },
];

export function PlanGuideModal({ isOpen, onClose }: PlanGuideModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const gotItBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleClose = () => {
    onClose();
  };

  // Lock body scroll while open and restore on close
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Save active element and focus "Got it"
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => {
        gotItBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
    }
  }, [isOpen]);

  // Trap focus & handle Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-guide-modal-title"
      >
        {/* Backdrop: blur, not black. Token --backdrop with fallback */}
        <div
          onClick={handleClose}
          className="fixed inset-0 -z-10 bg-[var(--backdrop-fallback)] backdrop-blur-[3px] supports-[backdrop-filter]:bg-[var(--backdrop)] transition-opacity"
          style={{
            backdropFilter: 'var(--backdrop-blur, blur(3px))',
            WebkitBackdropFilter: 'var(--backdrop-blur, blur(3px))',
          }}
          aria-hidden="true"
        />

        {/* Modal card: centered in viewport at every zoom and scroll, width min(900px, 94vw) */}
        <motion.div
          ref={modalRef}
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.98, y: 6 }
          }
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.98, y: 6 }
          }
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: 'min(900px, 94vw)' }}
          className="bg-card border border-border text-ink rounded-[20px] p-6 md:p-7 shadow-2xl relative flex flex-col justify-between gap-5 select-text"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            data-sound="close"
            className="absolute top-5 right-5 text-ink-3 hover:text-ink p-1.5 rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            <X className="size-4" />
          </button>

          {/* Header */}
          <div className="flex flex-col gap-0.5 pr-8">
            <h2
              id="plan-guide-modal-title"
              className="text-[32px] font-normal leading-tight text-ink tracking-tight"
              style={{ fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }}
            >
              How each step works
            </h2>
            <p className="text-[13px] font-normal text-ink-2 leading-normal">
              The same four moves, every step.
            </p>
          </div>

          {/* Steps Strip: 28px numbered circles, separate segments between circles only */}
          <div className="relative pt-1">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4 relative">
              {STEPS.map((s, idx) => {
                const isLast = idx === STEPS.length - 1;
                return (
                  <div
                    key={s.num}
                    className="flex md:flex-col items-start gap-3 md:gap-3 relative"
                  >
                    {/* Connecting line segment to next step: desktop only, separate segment between circles with 10px spacing */}
                    {!isLast && (
                      <div
                        className="hidden md:block absolute h-[1px] bg-border overflow-hidden pointer-events-none"
                        style={{
                          left: '38px', // 28px circle + 10px spacing
                          width: 'calc(100% - 32px)', // spans to 10px before next circle (100% + 16px gap - 10px = 100% + 6px from 0; minus 38px start = 100% - 32px)
                          top: '14px', // vertical center of 28px circle
                        }}
                      >
                        <motion.div
                          initial={prefersReducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 + idx * 0.08 }}
                          style={{ transformOrigin: 'left' }}
                          className="w-full h-full bg-ink-3"
                        />
                      </div>
                    )}

                    {/* 28px numbered circle */}
                    <div className="size-7 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 text-ink text-xs font-medium relative z-10 shadow-xs">
                      {s.num}
                    </div>

                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[15px] font-medium text-ink leading-snug">
                        {s.title}
                      </span>
                      <span className="text-[13px] font-normal text-ink-2 leading-relaxed">
                        {s.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Under-strip recommendation: one plain line with Claude at weight 500 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-normal text-ink-2 pt-1 border-t border-border/50">
            <span>
              We recommend <span className="font-medium text-ink">Claude</span>, because it follows the file format most reliably. ChatGPT and Gemini also work.
            </span>
            <div className="inline-flex items-center gap-3 text-xs font-normal">
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-2 hover:text-ink inline-flex items-center gap-1 transition-colors underline underline-offset-[3px]"
              >
                Open Claude
                <ExternalLink className="size-3" />
              </a>
              <a
                href="https://chatgpt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-2 hover:text-ink inline-flex items-center gap-1 transition-colors underline underline-offset-[3px]"
              >
                Open ChatGPT
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="text-xs font-normal text-ink-2 hover:text-ink transition-colors py-2 px-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-md"
            >
              Skip
            </button>
            <button
              ref={gotItBtnRef}
              type="button"
              onClick={onClose}
              className="bg-ink text-surface hover:opacity-90 font-medium text-xs md:text-sm px-6 h-10 max-md:h-[44px] rounded-lg transition-opacity cursor-pointer outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
