import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ShieldCheck } from 'lucide-react';
import { ConfettiBurst } from '../canvas/ConfettiBurst';
import type { SceneProps } from '../types';

export function SubmitScene({ active, isReducedMotion = false }: SceneProps) {
  const [checklistProgress, setChecklistProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const items = [
    'Clean GitHub repository URL & commit hash verified',
    'Hosted frontend demo container healthy',
    '3-minute pitch video & Canva deck attached',
    'Final team declaration signed off',
  ];

  useEffect(() => {
    if (!active) {
      setChecklistProgress(0);
      setIsSubmitted(false);
      return;
    }

    if (isReducedMotion) {
      setChecklistProgress(items.length);
      setIsSubmitted(true);
      return;
    }

    const t1 = setTimeout(() => setChecklistProgress(1), 600);
    const t2 = setTimeout(() => setChecklistProgress(2), 1200);
    const t3 = setTimeout(() => setChecklistProgress(3), 1800);
    const t4 = setTimeout(() => {
      setChecklistProgress(4);
      setIsSubmitted(true);
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [active, isReducedMotion]);

  return (
    <div className="flex flex-col gap-4 w-full text-xs relative">
      {/* Restrained Confetti Burst (1.2s) */}
      {!isReducedMotion && isSubmitted && <ConfettiBurst duration={1200} />}

      {/* Big Mono Clock Stop Banner */}
      <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
          Official Final Sprint Timer
        </span>

        <div className="flex items-baseline gap-2 my-1">
          <span
            className="text-3xl sm:text-4xl font-mono font-bold text-neutral-900 tracking-wider tabular-nums"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            35:41
          </span>
          <span className="text-sm font-mono text-neutral-400">/ 36:00</span>
        </div>

        {/* Small italic buffer line */}
        <p className="text-[11px] text-neutral-500 italic mt-0.5">
          "Yes, we left buffer. That's the point."
        </p>

        {/* "SUBMITTED" Impact Stamp */}
        {isSubmitted && (
          <motion.div
            initial={isReducedMotion ? undefined : { scale: 2.2, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: -4 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="absolute right-4 top-3 px-3 py-1 rounded-md border-2 border-emerald-600 bg-emerald-50 text-emerald-700 font-mono text-xs font-black tracking-widest uppercase shadow-sm select-none"
          >
            SUBMITTED
          </motion.div>
        )}
      </div>

      {/* Submission Checklist */}
      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col gap-2">
        <span className="text-[10px] font-mono font-semibold text-neutral-500 uppercase flex items-center gap-1">
          <ShieldCheck className="size-3 text-emerald-600" /> SIH Final Rule Compliance
        </span>

        {items.map((item, idx) => {
          const isDone = idx < checklistProgress;
          return (
            <div key={item} className="flex items-center gap-2 text-[11px] text-neutral-700">
              <div
                className={`size-4 rounded flex items-center justify-center transition-all ${
                  isDone ? 'bg-emerald-600 text-white' : 'border border-neutral-300 bg-white'
                }`}
              >
                {isDone && <Check className="size-3 stroke-[3]" />}
              </div>
              <span className={isDone ? 'font-medium text-neutral-900' : 'text-neutral-500'}>
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
