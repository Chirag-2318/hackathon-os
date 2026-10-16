import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface SubmittedStampProps {
  className?: string;
}

export function SubmittedStamp({ className }: SubmittedStampProps) {
  const prefersReducedMotion = useReducedMotion();
  const isReduced = Boolean(prefersReducedMotion);

  return (
    <motion.div
      initial={isReduced ? false : { scale: 1.15, opacity: 0, rotate: -4 }}
      animate={
        isReduced
          ? { rotate: -4 }
          : {
              scale: 1,
              opacity: 1,
              rotate: -4,
              boxShadow: [
                '0 0 0 rgba(16,185,129,0)',
                '0 0 16px rgba(16,185,129,0.35)',
                '0 0 0 rgba(16,185,129,0)',
              ],
            }
      }
      transition={
        isReduced
          ? { duration: 0 }
          : { duration: 0.24, ease: [0.16, 1, 0.3, 1] }
      }
      className={`inline-flex items-center justify-center px-3 py-1 rounded-md border-2 border-primary/90 outline outline-1 outline-offset-2 outline-primary/90 text-primary/90 font-mono text-xs sm:text-sm font-bold tracking-widest uppercase select-none shrink-0 ${
        className || ''
      }`}
    >
      SUBMITTED
    </motion.div>
  );
}
