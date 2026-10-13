import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, Unlock, FileText, Sparkles } from 'lucide-react';
import { PLAN_STEPS } from '../fixtures';
import type { SceneProps } from '../types';

export function PlanScene({ active, isReducedMotion = false }: SceneProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [docsStack, setDocsStack] = useState<string[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [lockShake, setLockShake] = useState(false);

  useEffect(() => {
    if (!active) {
      setCurrentStepIdx(0);
      setDocsStack([]);
      setIsUnlocked(false);
      setLockShake(false);
      return;
    }

    if (isReducedMotion) {
      setCurrentStepIdx(PLAN_STEPS.length);
      setDocsStack(PLAN_STEPS.map((s) => s.file));
      setIsUnlocked(true);
      return;
    }

    // Step sequence timer
    const timers: ReturnType<typeof setTimeout>[] = [];
    PLAN_STEPS.forEach((step, idx) => {
      const t = setTimeout(() => {
        setCurrentStepIdx(idx + 1);
        setDocsStack((prev) => [...prev, step.file]);
        if (idx === PLAN_STEPS.length - 1) {
          // Trigger padlock shake, cracking, and unlock
          setTimeout(() => setLockShake(true), 500);
          setTimeout(() => {
            setLockShake(false);
            setIsUnlocked(true);
          }, 1100);
        }
      }, (idx + 1) * 1000);
      timers.push(t);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [active, isReducedMotion]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full h-full text-xs">
      {/* Left: Stepper Rail with 5 Steps */}
      <div className="md:col-span-7 flex flex-col justify-between py-1">
        <div className="flex flex-col relative">
          {/* Vertical Connecting Rail Line */}
          <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-neutral-200 -z-0" />

          {PLAN_STEPS.map((s, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div key={s.id} className="flex items-center gap-3 py-1.5 z-10">
                <div
                  className={`size-7 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                      : 'bg-neutral-100 text-neutral-400 border border-neutral-300'
                  }`}
                >
                  {isCompleted ? <Check className="size-3.5 stroke-[3]" /> : idx + 1}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`font-semibold text-xs transition-colors ${
                      isCompleted ? 'text-neutral-900' : 'text-neutral-500'
                    }`}
                  >
                    {s.step}
                  </span>
                  <span className="text-[10px] text-neutral-400 line-clamp-1">{s.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Docs Stack & Padlock Burst */}
      <div className="md:col-span-5 flex flex-col justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
        <div>
          <span className="text-[10px] font-mono font-semibold text-neutral-500 block mb-2 uppercase">
            Validated Docs Vault ({docsStack.length}/5)
          </span>

          <div className="flex flex-col gap-1.5 min-h-[140px]">
            <AnimatePresence>
              {docsStack.map((fileName) => (
                <motion.div
                  key={fileName}
                  initial={isReducedMotion ? undefined : { x: -30, opacity: 0, scale: 0.8 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-neutral-200 shadow-xs font-mono text-[11px] text-neutral-800"
                >
                  <FileText className="size-3 text-blue-600" />
                  <span>{fileName}</span>
                  <Check className="size-3 text-emerald-600 ml-auto" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Padlock Unlocked Banner */}
        <div className="pt-2 border-t border-neutral-200/90 flex items-center justify-between">
          <div
            className={`flex items-center gap-2 transition-transform ${
              lockShake ? 'animate-bounce' : ''
            }`}
          >
            <div
              className={`p-2 rounded-xl transition-all ${
                isUnlocked
                  ? 'bg-amber-100 text-amber-700 ring-4 ring-amber-200/60 shadow-md'
                  : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {isUnlocked ? <Unlock className="size-4" /> : <Lock className="size-4" />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-neutral-500 uppercase">Phase Gate</span>
              <span className="text-xs font-bold text-neutral-900">
                {isUnlocked ? 'Build Unlocked' : 'Build Locked'}
              </span>
            </div>
          </div>

          {isUnlocked && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm"
            >
              <Sparkles className="size-3" /> READY
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
}
