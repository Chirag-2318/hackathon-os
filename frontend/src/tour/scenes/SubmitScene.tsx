import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { SceneProps } from '../types';

export function SubmitScene({ active, isReducedMotion = false }: SceneProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!active) {
      setIsSubmitted(false);
      return;
    }

    if (isReducedMotion) {
      setIsSubmitted(true);
      return;
    }

    const t = setTimeout(() => {
      setIsSubmitted(true);
    }, 1800);

    return () => clearTimeout(t);
  }, [active, isReducedMotion]);

  return (
    <div className="w-full text-xs relative flex flex-col items-center justify-center min-h-[220px] p-6 rounded-lg border border-border bg-card text-card-foreground">
      {!isSubmitted ? (
        <div className="flex flex-col items-center text-center max-w-[380px] space-y-3">
          <h3
            className="text-2xl font-normal tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-display, serif)' }}
          >
            Have you submitted?
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Submit your project on the event&apos;s own platform. When that&apos;s done, mark it here to close out this room.
          </p>
          <div className="pt-2">
            <div className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-md bg-foreground text-background shadow-sm">
              Yes, we&apos;ve submitted
            </div>
          </div>
          <p className="text-[11px] font-mono text-muted-foreground pt-1">
            Submissions close in 11h 24m
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center max-w-[380px] space-y-3">
          <div className="text-[11px] font-mono text-muted-foreground tracking-wider uppercase">
            SUBMITTED, Oct 24, 6:12 PM
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <h3
              className="text-3xl font-normal tracking-tight text-foreground"
              style={{ fontFamily: 'var(--font-display, serif)' }}
            >
              Project complete.
            </h3>
            <motion.div
              initial={isReducedMotion ? undefined : { scale: 1.15, opacity: 0, rotate: -4 }}
              animate={{ scale: 1, opacity: 1, rotate: -4 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="inline-block px-2.5 py-0.5 rounded border-2 border-primary/90 text-primary font-mono text-[11px] font-bold tracking-widest uppercase select-none shadow-[0_0_12px_rgba(var(--primary-rgb,16,185,129),0.25)]"
              style={{ outline: '1px solid currentColor', outlineOffset: '2px' }}
            >
              SUBMITTED
            </motion.div>
          </div>
          <p className="text-xs text-muted-foreground">
            Congratulations. Sample Room is submitted.
          </p>
        </div>
      )}
    </div>
  );
}

