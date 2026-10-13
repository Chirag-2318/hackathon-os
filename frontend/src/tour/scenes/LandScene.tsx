import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, PlaneLanding } from 'lucide-react';

interface LandSceneProps {
  onContinue: () => void;
  isReducedMotion?: boolean;
}

export function LandScene({ onContinue, isReducedMotion = false }: LandSceneProps) {
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center px-6 py-12 z-10 select-none">
      <motion.div
        initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, translateY: 24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="size-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg">
          <PlaneLanding className="size-7" />
        </div>

        <span
          className="text-xs font-mono tracking-widest text-[#EAB308] uppercase px-3 py-1 rounded-full bg-[#1A1F2C] border border-[#2B3448]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Flight Complete · Hour 36
        </span>

        <h2
          className="text-4xl sm:text-6xl md:text-7xl font-normal text-[#F7F4EB] leading-[1.05] tracking-tight max-w-2xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          That's the whole flight. Now it's your turn.
        </h2>

        <p
          className="text-base sm:text-lg text-[#B3AD9F] font-normal max-w-lg leading-relaxed"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          Your badge is printed, your seat is reserved, and your room is waiting.
        </p>

        <motion.button
          type="button"
          onClick={onContinue}
          whileHover={isReducedMotion ? undefined : { scale: 1.03 }}
          whileTap={isReducedMotion ? undefined : { scale: 0.98 }}
          className="px-8 py-3.5 rounded-2xl bg-[#F7F4EB] text-neutral-950 text-sm font-semibold hover:bg-white transition-all shadow-[0_4px_24px_rgba(247,244,235,0.25)] cursor-pointer inline-flex items-center gap-2 mt-4"
        >
          Continue <ArrowRight className="size-4" />
        </motion.button>
      </motion.div>
    </div>
  );
}
