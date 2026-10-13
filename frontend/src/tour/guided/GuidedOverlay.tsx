import React from 'react';
import { motion } from 'framer-motion';

interface GuidedOverlayProps {
  targetRect: DOMRect | null;
  isReducedMotion?: boolean;
}

export function GuidedOverlay({ targetRect, isReducedMotion = false }: GuidedOverlayProps) {
  const hasTarget = Boolean(targetRect);

  return (
    <svg
      className="fixed inset-0 size-full z-40 pointer-events-auto select-none"
      aria-hidden="true"
    >
      <defs>
        <mask id="guided-tour-cutout-mask">
          {/* Base white mask (reveals dim layer) */}
          <rect x="0" y="0" width="100%" height="100%" fill="white" />

          {/* Black cutout (punches transparent hole through mask) */}
          {hasTarget && targetRect && (
            <motion.rect
              initial={
                isReducedMotion
                  ? {
                      x: targetRect.left,
                      y: targetRect.top,
                      width: targetRect.width,
                      height: targetRect.height,
                    }
                  : false
              }
              animate={{
                x: targetRect.left,
                y: targetRect.top,
                width: targetRect.width,
                height: targetRect.height,
              }}
              transition={
                isReducedMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 220, damping: 26, mass: 0.8 }
              }
              rx={14}
              ry={14}
              fill="black"
            />
          )}
        </mask>
      </defs>

      {/* Dim layer (ink at 45%) with cutout hole */}
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(11, 13, 18, 0.45)"
        mask="url(#guided-tour-cutout-mask)"
      />

      {/* Cream glow ring that pulses once on arrival */}
      {hasTarget && targetRect && (
        <motion.rect
          key={`${targetRect.left}-${targetRect.top}`}
          initial={
            isReducedMotion
              ? {
                  x: targetRect.left,
                  y: targetRect.top,
                  width: targetRect.width,
                  height: targetRect.height,
                  opacity: 0.8,
                }
              : {
                  x: targetRect.left,
                  y: targetRect.top,
                  width: targetRect.width,
                  height: targetRect.height,
                  opacity: 0,
                  scale: 0.98,
                }
          }
          animate={{
            x: targetRect.left,
            y: targetRect.top,
            width: targetRect.width,
            height: targetRect.height,
            opacity: [0.3, 1, 0.7],
            scale: 1,
          }}
          transition={
            isReducedMotion
              ? { duration: 0 }
              : { duration: 0.55, ease: 'easeOut' }
          }
          rx={14}
          ry={14}
          fill="none"
          stroke="rgba(247, 244, 235, 0.9)"
          strokeWidth="2"
          className="pointer-events-none drop-shadow-[0_0_14px_rgba(247,244,235,0.45)]"
        />
      )}
    </svg>
  );
}
