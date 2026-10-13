import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, ExternalLink, HelpCircle, ShieldCheck } from 'lucide-react';
import { PRESENT_SAMPLE } from '../fixtures';
import type { SceneProps } from '../types';

export function PresentScene({ active, isReducedMotion = false }: SceneProps) {
  const [rehearsalCount, setRehearsalCount] = useState(1);
  const [showJudgeBubble, setShowJudgeBubble] = useState(false);
  const [showCounterCard, setShowCounterCard] = useState(false);

  useEffect(() => {
    if (!active) {
      setRehearsalCount(1);
      setShowJudgeBubble(false);
      setShowCounterCard(false);
      return;
    }

    if (isReducedMotion) {
      setRehearsalCount(3);
      setShowJudgeBubble(true);
      setShowCounterCard(true);
      return;
    }

    const tRehearse2 = setTimeout(() => setRehearsalCount(2), 1000);
    const tRehearse3 = setTimeout(() => setRehearsalCount(3), 2000);
    const tJudge = setTimeout(() => setShowJudgeBubble(true), 1500);
    const tAnswer = setTimeout(() => setShowCounterCard(true), 2800);

    return () => {
      clearTimeout(tRehearse2);
      clearTimeout(tRehearse3);
      clearTimeout(tJudge);
      clearTimeout(tAnswer);
    };
  }, [active, isReducedMotion]);

  return (
    <div className="flex flex-col gap-3.5 w-full text-xs">
      {/* Audio Waveform & Rehearsal Counter Header */}
      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
            <Mic className="size-3.5" />
          </div>
          <div className="flex items-center gap-1 h-5">
            {[14, 22, 10, 26, 18, 12, 24, 16].map((h, i) => (
              <motion.div
                key={i}
                animate={
                  isReducedMotion || !active
                    ? {}
                    : { height: [h * 0.4, h, h * 0.5] }
                }
                transition={{
                  repeat: Infinity,
                  duration: 0.8 + (i % 3) * 0.2,
                  ease: 'easeInOut',
                }}
                className="w-1 bg-red-500 rounded-full"
                style={{ height: h }}
              />
            ))}
          </div>
          <span className="text-[11px] text-neutral-500 font-medium pl-1">3-Minute Pitch Simulator</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 border border-neutral-200 font-mono text-neutral-800 font-bold">
          <span className="text-[10px] text-neutral-500 font-normal">RUN</span>
          <span>#{rehearsalCount}</span>
        </div>
      </div>

      {/* Judge Simulation Q&A */}
      <div className="flex flex-col gap-2.5 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
        {/* Judge Question Bubble */}
        {showJudgeBubble && (
          <motion.div
            initial={isReducedMotion ? undefined : { opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="p-3 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-950 flex items-start gap-2.5 shadow-sm"
          >
            <HelpCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold text-amber-700 uppercase">
                Judge Interrogation Drill
              </span>
              <p className="text-xs font-semibold leading-snug mt-0.5">
                "{PRESENT_SAMPLE.judgeQuestion}"
              </p>
            </div>
          </motion.div>
        )}

        {/* Counter Answer Card */}
        {showCounterCard && (
          <motion.div
            initial={isReducedMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-white border border-emerald-200/90 text-neutral-800 flex items-start gap-2.5 shadow-sm"
          >
            <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">
                Prepared Counter-Defense
              </span>
              <p className="text-[11px] text-neutral-700 leading-relaxed mt-0.5">
                {PRESENT_SAMPLE.counterAnswer}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Canva Deck Link Row */}
      <div className="p-2.5 bg-white rounded-xl border border-neutral-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-purple-600" />
          <span className="font-semibold text-neutral-900 text-xs">{PRESENT_SAMPLE.deckTitle}</span>
          <span className="text-[10px] text-neutral-400 font-mono">10 slides · Canva Live</span>
        </div>
        <span
          className="text-xs font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
          title="Open slide deck"
        >
          View Deck <ExternalLink className="size-3" />
        </span>
      </div>
    </div>
  );
}
