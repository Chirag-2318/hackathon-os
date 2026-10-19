import * as React from 'react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';

export interface PhaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhaseKey?: string;
  nextPhaseKey?: string;
}

const STEPS = [
  {
    num: 1,
    title: 'Top phase rail',
    desc: 'The top bar shows all phases. You start on Phase 1 (P1). Other phases remain locked until P1 finishes.',
  },
  {
    num: 2,
    title: 'Generate TASKS.md',
    desc: 'Copy the prompt or click Generate with AI to assemble tasks for this phase, then validate & import.',
  },
  {
    num: 3,
    title: 'Automatic task assignment',
    desc: 'Imported tasks are automatically assigned to team members with estimates, roles, and acceptance checks.',
  },
  {
    num: 4,
    title: 'Advance to Phase 2',
    desc: 'Complete Phase 1 tasks, then click "Phase 1 completed. Jump into Phase 2" to unlock the next phase.',
  },
];

export function PhaseGuideModal({
  isOpen,
  onClose,
  currentPhaseKey = 'P1',
  nextPhaseKey = 'P2',
}: PhaseGuideModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const gotItBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleClose = () => {
    onClose();
  };

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Focus management
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

  // Keyboard navigation
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
        aria-labelledby="phase-guide-modal-title"
      >
        {/* Backdrop: blur, not black */}
        <div
          onClick={handleClose}
          className="fixed inset-0 -z-10 bg-[var(--backdrop-fallback,#0a0a0b80)] backdrop-blur-[3px] supports-[backdrop-filter]:bg-[var(--backdrop,#0a0a0b66)] transition-opacity"
          style={{
            backdropFilter: 'var(--backdrop-blur, blur(3px))',
            WebkitBackdropFilter: 'var(--backdrop-blur, blur(3px))',
          }}
          aria-hidden="true"
        />

        {/* Modal card: centered in viewport */}
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
          style={{ width: 'min(920px, 94vw)' }}
          className="bg-card border border-border text-foreground rounded-[20px] p-6 md:p-7 shadow-2xl relative flex flex-col justify-between gap-5 select-text"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            data-sound="close"
            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1.5 rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="size-4" />
          </button>

          {/* Header */}
          <div className="flex flex-col gap-0.5 pr-8">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
              Sprint Workflow
            </span>
            <h2
              id="phase-guide-modal-title"
              className="text-[32px] font-normal leading-tight text-foreground tracking-tight"
              style={{ fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }}
            >
              How each phase works
            </h2>
            <p className="text-[13px] font-normal text-muted-foreground leading-normal">
              Execute each phase sequentially. All other phases remain locked until the active phase is done.
            </p>
          </div>

          {/* Steps Strip: 28px numbered circles, connected on desktop */}
          <div className="relative pt-1">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4 relative">
              {STEPS.map((s, idx) => {
                const isLast = idx === STEPS.length - 1;
                return (
                  <div
                    key={s.num}
                    className="flex md:flex-col items-start gap-3 md:gap-3 relative"
                  >
                    {!isLast && (
                      <div
                        className="hidden md:block absolute h-[1px] bg-border overflow-hidden pointer-events-none"
                        style={{
                          left: '38px',
                          width: 'calc(100% - 32px)',
                          top: '14px',
                        }}
                      >
                        <motion.div
                          initial={prefersReducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 + idx * 0.08 }}
                          style={{ transformOrigin: 'left' }}
                          className="w-full h-full bg-border"
                        />
                      </div>
                    )}

                    <div className="size-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 text-foreground text-xs font-semibold relative z-10 shadow-xs">
                      {s.num}
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[14px] font-semibold text-foreground leading-snug">
                        {s.title}
                      </span>
                      <span className="text-[12px] font-normal text-muted-foreground leading-relaxed">
                        {s.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Under-strip prompt recommendation */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-[12px] font-normal text-muted-foreground pt-2 border-t border-border/50">
            <span>
              Generate with AI directly or copy prompt into <span className="font-semibold text-foreground">Claude</span> or <span className="font-semibold text-foreground">ChatGPT</span> to create TASKS_{currentPhaseKey}.md.
            </span>
            <div className="inline-flex items-center gap-3 text-xs font-normal">
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground inline-flex items-center gap-1 transition-colors underline underline-offset-[3px]"
              >
                Open Claude
                <ExternalLink className="size-3" />
              </a>
              <a
                href="https://chatgpt.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground inline-flex items-center gap-1 transition-colors underline underline-offset-[3px]"
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
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-3 cursor-pointer rounded-md"
            >
              Skip
            </button>
            <button
              ref={gotItBtnRef}
              type="button"
              onClick={onClose}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs md:text-sm px-6 h-10 max-md:h-[44px] rounded-full transition-opacity cursor-pointer outline-none shadow-xs"
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
