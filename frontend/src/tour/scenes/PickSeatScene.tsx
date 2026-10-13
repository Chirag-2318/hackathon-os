import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Ticket, ArrowRight } from 'lucide-react';
import type { TourPath } from '../types';

interface PickSeatSceneProps {
  onSelectPath: (path: TourPath) => void;
  isReducedMotion?: boolean;
}

export function PickSeatScene({ onSelectPath, isReducedMotion = false }: PickSeatSceneProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 z-10 select-none">
      {/* Two role choice cards */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {/* LEADER CARD */}
        <motion.button
          type="button"
          onClick={() => onSelectPath('LEADER')}
          whileHover={isReducedMotion ? undefined : { translateY: -3, scale: 1.02 }}
          whileTap={isReducedMotion ? undefined : { scale: 0.98 }}
          className="group flex flex-col items-start p-4 rounded-xl bg-[var(--tour-surface)] hover:bg-[var(--tour-surface-2)] border border-[var(--tour-border)] hover:border-amber-400/60 transition-all text-left cursor-pointer shadow-lg relative overflow-hidden"
        >
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3 group-hover:bg-amber-500/20 transition-colors">
            <Crown className="size-5" />
          </div>
          <span className="text-base font-semibold text-[var(--tour-text)] tracking-tight mb-1">
            I'm leading a team
          </span>
          <p className="text-[11px] text-[var(--tour-text-muted)] leading-relaxed mb-4">
            Create rooms, share an 8-character invite code, arbitrate team ideas, and lock the final execution plan.
          </p>
          <span className="mt-auto text-[11px] font-medium text-amber-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Fly as Leader <ArrowRight className="size-3" />
          </span>
        </motion.button>

        {/* MEMBER CARD */}
        <motion.button
          type="button"
          onClick={() => onSelectPath('MEMBER')}
          whileHover={isReducedMotion ? undefined : { translateY: -3, scale: 1.02 }}
          whileTap={isReducedMotion ? undefined : { scale: 0.98 }}
          className="group flex flex-col items-start p-4 rounded-xl bg-[var(--tour-surface)] hover:bg-[var(--tour-surface-2)] border border-[var(--tour-border)] hover:border-pink-400/60 transition-all text-left cursor-pointer shadow-lg relative overflow-hidden"
        >
          <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 mb-3 group-hover:bg-pink-500/20 transition-colors">
            <Ticket className="size-5" />
          </div>
          <span className="text-base font-semibold text-[var(--tour-text)] tracking-tight mb-1">
            I'm joining one
          </span>
          <p className="text-[11px] text-[var(--tour-text-muted)] leading-relaxed mb-4">
            Enter with your teammate's code, pitch your solution block, claim sprint tasks, and sync on the shared board.
          </p>
          <span className="mt-auto text-[11px] font-medium text-pink-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Fly as Teammate <ArrowRight className="size-3" />
          </span>
        </motion.button>
      </div>
    </div>
  );
}
