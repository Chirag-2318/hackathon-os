import React from 'react';
import { ArrowRight, Compass, Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export const GhostPassport: React.FC = () => {
  return (
    <div className="space-y-6 px-4 sm:px-6 pt-6 pb-12">
      {/* Unfilled Stat Strip with 0s */}
      <div className="border border-neutral-800/80 rounded-lg bg-neutral-950/40 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="font-mono text-2xl font-semibold text-neutral-400">0</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mt-0.5">Hackathons</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-neutral-400">0</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mt-0.5">Projects Shipped</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-neutral-400">0</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mt-0.5">Tasks Completed</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-semibold text-neutral-400">0</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mt-0.5">Teammates</div>
          </div>
        </div>
      </div>

      {/* 3 Dashed, Faded Empty Stamps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className="relative flex flex-col justify-between rounded-md border border-dashed border-neutral-800 bg-neutral-900/20 p-5 min-h-[170px] opacity-45"
          >
            {/* Cutout notches */}
            <div className="absolute -left-2 top-1/2 -mt-2 h-4 w-4 rounded-full bg-neutral-950 border border-neutral-800" />
            <div className="absolute -right-2 top-1/2 -mt-2 h-4 w-4 rounded-full bg-neutral-950 border border-neutral-800" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-neutral-400">STAMP #{num}</span>
                <span className="font-mono text-[10px] text-neutral-400">AWAITING MISSION</span>
              </div>
              <div className="h-4 w-28 rounded bg-neutral-800/40" />
              <div className="h-3 w-40 rounded bg-neutral-800/30" />
            </div>

            <div className="border-t border-dashed border-neutral-800 pt-3">
              <span className="text-[11px] font-mono text-neutral-400">Your first build will be recorded here</span>
            </div>
          </div>
        ))}
      </div>

      {/* Human, Encouraging CTA */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6 text-center max-w-xl mx-auto space-y-3">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950/40 border border-emerald-800/60 text-emerald-400">
            <Compass className="h-6 w-6" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-neutral-100">Your builder passport is waiting for its first stamp</h3>
        <p className="text-xs text-neutral-400 leading-relaxed max-w-md mx-auto">
          Every room you join, task you complete, and project you submit will automatically craft your case studies, milestone medals, and verified timeline.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link
            to="/app/create-room"
            className="inline-flex items-center gap-2 rounded bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create a room</span>
          </Link>
          <Link
            to="/app/home"
            className="inline-flex items-center gap-2 rounded border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
          >
            <span>Explore live events</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
