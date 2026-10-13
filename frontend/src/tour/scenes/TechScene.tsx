import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, GitPullRequest, Radio } from 'lucide-react';
import { SAMPLE_TECH_BRANCHES, SAMPLE_APIS } from '../fixtures';
import type { SceneProps } from '../types';

export function TechScene({ active, isReducedMotion = false }: SceneProps) {
  const [activeApiCount, setActiveApiCount] = useState(0);

  useEffect(() => {
    if (!active) {
      setActiveApiCount(0);
      return;
    }
    if (isReducedMotion) {
      setActiveApiCount(SAMPLE_APIS.length);
      return;
    }

    const t1 = setTimeout(() => setActiveApiCount(1), 800);
    const t2 = setTimeout(() => setActiveApiCount(2), 1600);
    const t3 = setTimeout(() => setActiveApiCount(3), 2400);
    const t4 = setTimeout(() => setActiveApiCount(4), 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [active, isReducedMotion]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full h-full text-xs">
      {/* Left: SVG Branch Map with Drawn Lines */}
      <div className="md:col-span-6 p-3.5 bg-neutral-900 text-neutral-100 rounded-xl border border-neutral-800 flex flex-col justify-between shadow-inner">
        <div>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800 text-[10px] font-mono text-neutral-400">
            <span className="flex items-center gap-1.5 text-neutral-300 font-semibold">
              <GitBranch className="size-3.5 text-blue-400" /> Git Branch Purpose Map
            </span>
            <span>repo: team-orbit-app</span>
          </div>

          <div className="relative pl-6 py-2 flex flex-col gap-5">
            {/* SVG Connecting Branch Lines with stroke-dashoffset */}
            <svg className="absolute left-1 top-0 bottom-0 w-6 h-full overflow-visible pointer-events-none">
              {/* Main Line */}
              <motion.line
                x1="6"
                y1="12"
                x2="6"
                y2="110"
                stroke="#3B82F6"
                strokeWidth="2"
                initial={isReducedMotion ? undefined : { pathLength: 0 }}
                animate={{ pathLength: active ? 1 : 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
              {/* Fork 1 to demo-safe */}
              <motion.path
                d="M 6 45 C 16 45, 16 65, 24 65"
                stroke="#10B981"
                strokeWidth="2"
                fill="none"
                initial={isReducedMotion ? undefined : { pathLength: 0 }}
                animate={{ pathLength: active ? 1 : 0 }}
                transition={{ duration: 1.2, delay: 0.4 }}
              />
              {/* Fork 2 to feature-auth */}
              <motion.path
                d="M 6 85 C 16 85, 16 105, 24 105"
                stroke="#F59E0B"
                strokeWidth="2"
                fill="none"
                initial={isReducedMotion ? undefined : { pathLength: 0 }}
                animate={{ pathLength: active ? 1 : 0 }}
                transition={{ duration: 1.2, delay: 0.8 }}
              />
            </svg>

            {SAMPLE_TECH_BRANCHES.map((b) => (
              <div key={b.name} className="flex flex-col gap-0.5 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                    {b.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-900/60 text-blue-300 border border-blue-700 flex items-center gap-0.5">
                    <GitPullRequest className="size-2.5" /> {b.badge}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 pl-0.5">{b.purpose}</span>
              </div>
            ))}
          </div>
        </div>

        <span className="text-[9px] font-mono text-neutral-500 pt-2 border-t border-neutral-800">
          Clean commit tree verified · No unstaged demo surprises
        </span>
      </div>

      {/* Right: API List with Flipping Status Dots */}
      <div className="md:col-span-6 p-3.5 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100">
            <span className="font-semibold text-neutral-900 text-xs flex items-center gap-1.5">
              <Radio className="size-3.5 text-emerald-600" /> API Health & Fallbacks
            </span>
            <span className="text-[10px] font-mono text-neutral-500">
              {activeApiCount}/{SAMPLE_APIS.length} LIVE
            </span>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            {SAMPLE_APIS.map((api, idx) => {
              const isLive = idx < activeApiCount;

              return (
                <div
                  key={api.path}
                  className="p-2 rounded-lg bg-neutral-50 border border-neutral-200/80 flex items-center justify-between gap-2"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-[10px] font-semibold text-neutral-800 truncate">
                      {api.path}
                    </span>
                    <span className="text-[10px] text-neutral-500 truncate">{api.label}</span>
                  </div>

                  {/* Status dot flipping red to green */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`size-2.5 rounded-full transition-all duration-300 ${
                        isLive
                          ? 'bg-emerald-500 shadow-[0_0_8px_#10B981]'
                          : 'bg-red-500 opacity-60'
                      }`}
                    />
                    <span
                      className={`font-mono text-[9px] font-bold ${
                        isLive ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {isLive ? '200 OK' : 'CHECK'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 flex items-center justify-between mt-2">
          <span>Stage Fallback: Offline Mock Ready</span>
          <span className="font-mono font-bold">100%</span>
        </div>
      </div>
    </div>
  );
}
