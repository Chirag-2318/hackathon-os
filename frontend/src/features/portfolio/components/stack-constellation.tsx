import React, { useState } from 'react';
import type { StackItemDto } from '../types';

interface StackConstellationProps {
  stack: StackItemDto[];
}

export const StackConstellation: React.FC<StackConstellationProps> = ({ stack }) => {
  const [activeItem, setActiveItem] = useState<StackItemDto | null>(null);

  if (!stack || stack.length === 0) return null;

  const maxProjects = Math.max(...stack.map((s) => s.projectCount), 1);

  // Group by category if available
  const categories = Array.from(new Set(stack.map((s) => s.category || 'General')));

  return (
    <section className="space-y-4 px-4 sm:px-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-neutral-100 flex items-center gap-2">
            <span>Stack Constellation</span>
            <span className="font-mono text-xs text-neutral-400">({stack.length} technologies)</span>
          </h2>
          <p className="text-xs text-neutral-400">Derived from room architecture docs and shipped projects</p>
        </div>

        {activeItem && (
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-neutral-400">
            <span>Used in:</span>
            <span className="text-neutral-200">{activeItem.projectNames.join(', ')}</span>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-5">
        <div className="flex flex-wrap items-center gap-2.5">
          {stack.map((item) => {
            const ratio = item.projectCount / maxProjects;
            // Size scale: from text-xs to text-base with proportional padding
            const isTop = ratio >= 0.75;
            const isMid = ratio >= 0.4 && ratio < 0.75;

            return (
              <div
                key={item.name}
                onMouseEnter={() => setActiveItem(item)}
                onMouseLeave={() => setActiveItem(null)}
                className={`group relative inline-flex items-center gap-2 rounded-full border transition-all duration-150 cursor-pointer ${
                  activeItem?.name === item.name
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-md scale-105'
                    : isTop
                    ? 'border-neutral-700 bg-neutral-800/90 text-neutral-100'
                    : isMid
                    ? 'border-neutral-800 bg-neutral-900/80 text-neutral-300'
                    : 'border-neutral-800/60 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200'
                } ${
                  isTop ? 'px-3.5 py-1.5 text-sm font-medium' : isMid ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]'
                }`}
              >
                <span className="font-mono">{item.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono ${
                    isTop ? 'bg-neutral-700 text-neutral-200' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {item.projectCount}
                </span>

                {/* Mobile / Inline tooltip for hovered node */}
                {activeItem?.name === item.name && (
                  <div className="sm:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 whitespace-nowrap rounded bg-neutral-950 border border-neutral-700 px-2 py-1 text-[10px] text-neutral-200 shadow-lg">
                    {item.projectNames.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Category breakdown tags */}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-neutral-800/80 pt-3 text-[11px] font-mono text-neutral-400">
          <span>Categories:</span>
          {categories.map((cat) => (
            <span key={cat} className="rounded bg-neutral-950 px-2 py-0.5 border border-neutral-800/60 text-neutral-400">
              {cat}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
