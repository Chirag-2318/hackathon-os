import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Lock, Check, Sparkles, ArrowRight } from 'lucide-react';
import type { SceneProps } from '../types';

const STAGE_NODES = [
  { id: 'brief', label: 'Brief', unlocked: true },
  { id: 'ideate', label: 'Ideate', unlocked: true },
  { id: 'plan', label: 'Plan', unlocked: true },
  { id: 'build', label: 'Build', unlocked: false },
  { id: 'tech', label: 'Tech', unlocked: false },
  { id: 'present', label: 'Present', unlocked: false },
  { id: 'review', label: 'Review', unlocked: false },
];

export function OverviewScene({ active, isReducedMotion = false }: SceneProps) {
  const [litNodeIndex, setLitNodeIndex] = useState(-1);
  const [seconds, setSeconds] = useState(59);

  useEffect(() => {
    if (!active) {
      setLitNodeIndex(-1);
      setSeconds(59);
      return;
    }

    if (isReducedMotion) {
      setLitNodeIndex(STAGE_NODES.length);
      return;
    }

    // Tick countdown
    const clockInterval = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 59));
    }, 1000);

    // Light up nodes sequentially
    const timeouts = STAGE_NODES.map((_, i) => {
      return setTimeout(() => {
        setLitNodeIndex(i);
      }, 500 + i * 400);
    });

    return () => {
      clearInterval(clockInterval);
      timeouts.forEach(clearTimeout);
    };
  }, [active, isReducedMotion]);

  return (
    <div className="w-full h-full flex flex-col justify-between text-xs text-neutral-800 select-none gap-3">
      {/* 1. Clock strip with LIVE chip and ticking countdown */}
      <div className="p-3 bg-neutral-900 text-neutral-100 rounded-xl border border-neutral-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
          <span className="text-[11px] text-neutral-300 font-medium">Smart India Hackathon</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-300">
            <Clock className="size-3 text-neutral-400" />
            <span>35h {seconds < 10 ? `0${seconds}` : seconds}m left</span>
          </div>
          <div className="h-2 w-24 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700/60 hidden sm:block">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 w-[15%]" />
          </div>
        </div>
      </div>

      {/* 2. Horizontal stage rail where nodes light up one by one */}
      <div className="p-3 bg-white rounded-xl border border-neutral-200/90 shadow-sm flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
          <span>Hackathon Stage Journey</span>
          <span className="font-mono text-[10px]">Hour 0 of 36</span>
        </div>

        <div className="flex items-center justify-between relative py-2">
          {/* Track line behind nodes */}
          <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2px] bg-neutral-200 z-0" />

          {STAGE_NODES.map((node, i) => {
            const isLit = isReducedMotion || i <= litNodeIndex;
            const isCurrent = i === 0;

            return (
              <div key={node.id} className="flex flex-col items-center gap-1 relative z-10">
                <motion.div
                  animate={{
                    scale: isLit ? [1, 1.15, 1] : 1,
                  }}
                  transition={{ duration: 0.25 }}
                  className={`size-6 rounded-full flex items-center justify-center border text-[10px] font-bold transition-colors ${
                    isCurrent
                      ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
                      : isLit
                      ? node.unlocked
                        ? 'bg-neutral-900 border-neutral-900 text-white'
                        : 'bg-neutral-100 border-neutral-300 text-neutral-500'
                      : 'bg-white border-neutral-200 text-neutral-400'
                  }`}
                >
                  {node.unlocked ? (
                    isCurrent ? (
                      <span className="size-1.5 rounded-full bg-white" />
                    ) : (
                      <Check className="size-2.5 stroke-[3]" />
                    )
                  ) : (
                    <Lock className="size-2.5 text-neutral-400" />
                  )}
                </motion.div>
                <span
                  className={`text-[9px] font-semibold uppercase tracking-wider ${
                    isCurrent ? 'text-amber-600' : isLit ? 'text-neutral-800' : 'text-neutral-400'
                  }`}
                >
                  {node.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. "Next up: Add the event brief" block that pulses */}
      <motion.div
        animate={
          isReducedMotion
            ? undefined
            : {
                boxShadow: [
                  '0 0 0 0 rgba(234, 179, 8, 0)',
                  '0 0 0 4px rgba(234, 179, 8, 0.2)',
                  '0 0 0 0 rgba(234, 179, 8, 0)',
                ],
              }
        }
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        className="p-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-xl border border-amber-500/30 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="size-6 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center">
            <Sparkles className="size-3.5" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700">
              Next Up
            </p>
            <p className="font-semibold text-xs text-neutral-900">
              Add the event brief &amp; extract the rubric
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-[10px] font-semibold flex items-center gap-1 shadow-xs">
          Open brief <ArrowRight className="size-3" />
        </span>
      </motion.div>
    </div>
  );
}
