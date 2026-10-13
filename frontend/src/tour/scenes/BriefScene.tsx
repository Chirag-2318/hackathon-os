import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Sparkles } from 'lucide-react';
import { RAW_EVENT_RULES, RUBRIC_CRITERIA, RULES_CHECKLIST } from '../fixtures';
import type { SceneProps } from '../types';

export function BriefScene({ active, isReducedMotion = false }: SceneProps) {
  const [tickedCount, setTickedCount] = useState(0);

  useEffect(() => {
    if (!active) {
      setTickedCount(0);
      return;
    }
    if (isReducedMotion) {
      setTickedCount(RULES_CHECKLIST.length);
      return;
    }

    const t1 = setTimeout(() => setTickedCount(1), 1000);
    const t2 = setTimeout(() => setTickedCount(2), 2000);
    const t3 = setTimeout(() => setTickedCount(3), 3200);
    const t4 = setTimeout(() => setTickedCount(4), 4400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [active, isReducedMotion]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full h-full text-xs">
      {/* Left: Raw Event Text with Scanning Light Bar */}
      <div className="md:col-span-5 bg-neutral-900 text-neutral-300 rounded-xl p-3.5 border border-neutral-800 flex flex-col relative overflow-hidden font-mono shadow-inner">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-[10px] text-neutral-400">
          <span>RAW_EVENT_BRIEF.TXT</span>
          <span className="text-amber-400 font-semibold">PARSING</span>
        </div>

        <p className="text-[11px] leading-relaxed line-clamp-10 text-neutral-400 whitespace-pre-wrap select-none">
          {RAW_EVENT_RULES}
        </p>

        {/* Vertical Scanning Light Bar */}
        {!isReducedMotion && active && (
          <motion.div
            initial={{ top: '-10%' }}
            animate={{ top: ['0%', '110%'] }}
            transition={{
              repeat: Infinity,
              duration: 2.4,
              ease: 'linear',
            }}
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#F59E0B] pointer-events-none"
          />
        )}
      </div>

      {/* Right: Extracted Structured Cards */}
      <div className="md:col-span-7 flex flex-col gap-3 justify-between">
        {/* 1. Rubric Card with Animated Weight Bars */}
        <div className="p-3 bg-white rounded-xl border border-neutral-200/90 shadow-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-900 text-xs flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500" /> Extracted Rubric
            </span>
            <span className="text-[10px] font-mono text-neutral-500 font-medium">100% TOTAL</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            {RUBRIC_CRITERIA.map((crit, idx) => (
              <div key={crit.name} className="flex flex-col gap-1 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                <div className="flex justify-between text-[11px] text-neutral-700">
                  <span>{crit.name}</span>
                  <span className="font-mono font-bold text-neutral-900">{crit.weight}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: active ? `${crit.weight * 2.5}%` : 0 }}
                    transition={{
                      duration: isReducedMotion ? 0.2 : 0.8,
                      delay: isReducedMotion ? 0 : idx * 0.15,
                    }}
                    className={`h-full ${crit.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Deadlines Chip Row with Live-feeling Countdown */}
        <div className="p-2.5 bg-white rounded-xl border border-neutral-200/90 shadow-sm flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-700 shrink-0">
            <Clock className="size-3.5 text-blue-600" /> Key Checkpoints
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-[10px] font-semibold border border-blue-200">
              PRD T-5h
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-mono text-[10px] font-semibold border border-amber-200">
              Freeze T-25h
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-semibold border border-emerald-200">
              Final T-35h
            </span>
          </div>
        </div>

        {/* 3. Rules Checklist with Draw-on Checkmarks */}
        <div className="p-3 bg-white rounded-xl border border-neutral-200/90 shadow-sm flex flex-col gap-1.5">
          <span className="font-semibold text-neutral-900 text-xs mb-1">
            Rules Checklist ({tickedCount}/{RULES_CHECKLIST.length})
          </span>
          {RULES_CHECKLIST.map((item, idx) => {
            const isTicked = idx < tickedCount;
            return (
              <div key={item.id} className="flex items-center gap-2 text-[11px] text-neutral-700">
                <div
                  className={`size-4 rounded flex items-center justify-center transition-all ${
                    isTicked ? 'bg-emerald-600 text-white' : 'border border-neutral-300 bg-neutral-100'
                  }`}
                >
                  {isTicked && <Check className="size-3 stroke-[3]" />}
                </div>
                <span className={isTicked ? 'line-through text-neutral-400 transition-colors' : ''}>
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
