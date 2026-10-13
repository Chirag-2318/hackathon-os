import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TargetRect } from './types';

interface GhostCursorProps {
  targetRect: TargetRect | null;
  isReducedMotion?: boolean;
  isMobile?: boolean;
}

export function GhostCursor({ targetRect, isReducedMotion = false, isMobile = false }: GhostCursorProps) {
  const [rippleKey, setRippleKey] = useState(0);

  useEffect(() => {
    if (targetRect) {
      // Trigger ripple shortly after arriving
      const timer = setTimeout(() => {
        setRippleKey((k) => k + 1);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [targetRect?.left, targetRect?.top]);

  if (isReducedMotion || isMobile || !targetRect) {
    return null;
  }

  // Position near the top-left or center-left of the target rect
  const targetX = targetRect.left + Math.min(28, targetRect.width * 0.4);
  const targetY = targetRect.top + Math.min(22, targetRect.height * 0.5);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute top-0 left-0"
        initial={{ x: targetX - 60, y: targetY + 40, opacity: 0 }}
        animate={{
          x: targetX,
          y: targetY,
          opacity: 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 220,
          damping: 26,
          mass: 0.9,
        }}
      >
        {/* Ripple effect */}
        <AnimatePresence>
          {rippleKey > 0 && (
            <motion.div
              key={rippleKey}
              className="absolute -top-3 -left-3 size-8 rounded-full border border-amber-300/80 bg-amber-400/20"
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* Cursor arrow + Guide pill */}
        <div className="relative flex items-center space-x-1.5 select-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
          {/* Dark Arrow Cursor */}
          <svg
            className="w-5 h-5 text-zinc-950 dark:text-zinc-100"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="white"
            strokeWidth="1.5"
          >
            <path d="M4.5 3.5l14 7-6.5 2-2 6.5-5.5-15.5z" />
          </svg>

          {/* Guide Pill */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.2 }}
            className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-mono font-medium tracking-wide text-zinc-100 shadow-md border border-zinc-700/60"
          >
            Guide
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
