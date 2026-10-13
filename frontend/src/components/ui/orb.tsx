import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type OrbVariant = 'S1' | 'S2' | 'S3' | 'default';

export interface OrbProps {
  variant?: OrbVariant;
  label?: string;
  className?: string;
}

export function Orb({ variant = 'default', label, className }: OrbProps) {
  const getGradient = () => {
    switch (variant) {
      case 'S3':
        // Understanding the context / neural purple & indigo
        return 'from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/40';
      case 'S2':
        // Gathering sources / cyan & emerald
        return 'from-sky-400 via-teal-400 to-emerald-400 shadow-teal-500/40';
      case 'S1':
      default:
        // Default warm violet & amber
        return 'from-violet-500 via-indigo-400 to-purple-600 shadow-violet-500/40';
    }
  };

  return (
    <div
      role="status"
      aria-label={label ?? 'AI processing'}
      className={cn('relative flex items-center justify-center size-5 shrink-0', className)}
    >
      {/* Outer pulsing ring */}
      <motion.span
        className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-tr opacity-60 blur-[3px]',
          getGradient()
        )}
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.5, 0.85, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Rotating core */}
      <motion.span
        className={cn(
          'relative size-3.5 rounded-full bg-gradient-to-tr shadow-xs',
          getGradient()
        )}
        animate={{
          rotate: [0, 360],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          rotate: { duration: 4, repeat: Infinity, ease: 'linear' },
          scale: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <span className="absolute inset-0.5 rounded-full bg-white/30 backdrop-blur-[1px]" />
      </motion.span>
    </div>
  );
}
