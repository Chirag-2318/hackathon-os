import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, Copy } from 'lucide-react';
import type { SceneProps } from '../types';

const TEMPLATES = [
  { id: 'sih', name: 'SIH-Style', members: '6 members', dur: '36h' },
  { id: 'hackmit', name: 'HackMIT', members: '4 members', dur: '24h' },
  { id: 'mlh', name: 'MLH Local', members: '4 members', dur: '24h' },
  { id: 'internal', name: 'Internal Hack', members: '3 members', dur: '12h' },
  { id: 'aisprint', name: 'AI Sprint', members: '5 members', dur: '48h' },
  { id: 'open', name: 'Open Track', members: '6 members', dur: '36h' },
];

export function CreateRoomScene({ active, isReducedMotion = false }: SceneProps) {
  const [typedName, setTypedName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [btnPressed, setBtnPressed] = useState(false);
  const [createdCardVisible, setCreatedCardVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setTypedName('');
      setSelectedTemplate(null);
      setBtnPressed(false);
      setCreatedCardVisible(false);
      return;
    }

    if (isReducedMotion) {
      setTypedName('Team Orbit');
      setSelectedTemplate('sih');
      setBtnPressed(true);
      setCreatedCardVisible(true);
      return;
    }

    // Sequence:
    // 0.2s - 1.2s: typing name
    const fullName = 'Team Orbit';
    let charIndex = 0;
    const typeInterval = setInterval(() => {
      charIndex++;
      setTypedName(fullName.slice(0, charIndex));
      if (charIndex >= fullName.length) {
        clearInterval(typeInterval);
      }
    }, 90);

    // 1.5s: select SIH template with stamp
    const t1 = setTimeout(() => {
      setSelectedTemplate('sih');
    }, 1500);

    // 2.8s: press button
    const t2 = setTimeout(() => {
      setBtnPressed(true);
    }, 2800);

    // 3.4s: room card slides up
    const t3 = setTimeout(() => {
      setCreatedCardVisible(true);
    }, 3400);

    return () => {
      clearInterval(typeInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [active, isReducedMotion]);

  return (
    <div className="w-full h-full flex flex-col justify-between text-xs text-neutral-800 select-none relative overflow-hidden">
      {/* Dialog box frame */}
      <div className="p-3 bg-white rounded-xl border border-neutral-200/90 shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
          <span className="font-semibold text-neutral-900 text-xs flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-500" /> Create a Hackathon Room
          </span>
          <span className="text-[10px] font-mono text-neutral-400">Step 1 of 1</span>
        </div>

        {/* Room name input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-neutral-500">Room Name</label>
          <div className="h-8 px-2.5 rounded-lg border border-neutral-300 bg-neutral-50/50 flex items-center text-xs font-semibold text-neutral-900">
            <span>{typedName}</span>
            {active && typedName.length < 10 && !isReducedMotion && (
              <span className="w-1.5 h-3.5 bg-amber-500 ml-0.5 animate-pulse" />
            )}
          </div>
        </div>

        {/* Event template 2x3 grid */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-neutral-500">Event Template</label>
          <div className="grid grid-cols-3 gap-1.5">
            {TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  className={`p-1.5 rounded-lg border text-left transition-all relative ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <p className="font-semibold text-[11px] text-neutral-900 truncate">{tmpl.name}</p>
                  <p className="text-[9px] text-neutral-500 font-mono">
                    {tmpl.members} · {tmpl.dur}
                  </p>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="absolute top-1 right-1 size-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs"
                    >
                      <Check className="size-2 stroke-[3]" />
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Start-time toggle + Create button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-neutral-500">Start time:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-300">
              Starting now
            </span>
          </div>

          <motion.div
            animate={{ scale: btnPressed ? [1, 0.94, 1] : 1 }}
            transition={{ duration: 0.2 }}
            className="px-3 py-1 rounded-lg bg-neutral-900 text-white text-[11px] font-medium shadow-sm"
          >
            Create room
          </motion.div>
        </div>
      </div>

      {/* Room Card slides up with 8-character mono code */}
      {createdCardVisible && (
        <motion.div
          initial={isReducedMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="p-3 bg-neutral-900 text-neutral-100 rounded-xl border border-neutral-800 shadow-xl flex items-center justify-between mt-2"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white">Team Orbit</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-mono font-semibold">
                LEADER
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-0.5">SIH-Style · 36 hours</p>
          </div>

          <div className="flex items-center gap-2 bg-neutral-800/80 px-2.5 py-1.5 rounded-lg border border-neutral-700/80">
            <span className="text-[10px] text-neutral-400 uppercase font-mono">CODE:</span>
            <span
              className="text-xs font-mono font-bold tracking-wider text-amber-300"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              ORBIT36X
            </span>
            <Copy className="size-3 text-neutral-400 ml-0.5" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
