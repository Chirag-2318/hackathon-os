import React from 'react';
import { Compass, Ship, Shield, Sparkles, CheckCircle, Hammer, GitCommit, Award, Crown, Flame, Lock } from 'lucide-react';
import type { MilestoneDto } from '../types';

interface MilestonesRowProps {
  milestones: MilestoneDto[];
}

export const MilestonesRow: React.FC<MilestonesRowProps> = ({ milestones }) => {
  if (!milestones || milestones.length === 0) return null;

  const renderIcon = (icon: string, earned: boolean) => {
    const props = { className: `h-5 w-5 ${earned ? 'text-amber-400' : 'text-neutral-500'}` };
    switch (icon) {
      case 'compass': return <Compass {...props} />;
      case 'ship': return <Ship {...props} />;
      case 'shield': return <Shield {...props} />;
      case 'sparkle': return <Sparkles {...props} />;
      case 'check-circle': return <CheckCircle {...props} />;
      case 'hammer': return <Hammer {...props} />;
      case 'git-commit': return <GitCommit {...props} />;
      case 'crown': return <Crown {...props} />;
      case 'flame': return <Flame {...props} />;
      default: return <Award {...props} />;
    }
  };

  return (
    <section className="space-y-3 px-4 sm:px-6 pt-6 pb-8">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-neutral-100 flex items-center gap-2">
          <span>Earned Milestones</span>
          <span className="font-mono text-xs text-neutral-400">
            ({milestones.filter((m) => m.earned).length} achieved)
          </span>
        </h2>
        <p className="text-xs text-neutral-400">Verified milestones achieved across hackathon challenges</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {milestones.map((m) => {
          if (m.earned) {
            return (
              <div
                key={m.id}
                className="flex flex-col items-center text-center rounded-lg border border-neutral-800 bg-neutral-900/60 p-3.5 space-y-2 hover:border-neutral-700 transition-colors"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-500/30 bg-amber-950/20 shadow-xs">
                  {renderIcon(m.icon, true)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-100">{m.title}</div>
                  <div className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5 leading-tight">{m.description}</div>
                </div>
                <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-emerald-400">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  Earned
                </span>
              </div>
            );
          }

          // Next achievable locked milestone
          return (
            <div
              key={m.id}
              className="flex flex-col items-center text-center rounded-lg border border-dashed border-neutral-800/80 bg-neutral-950/30 p-3.5 space-y-2 opacity-65 hover:opacity-90 transition-opacity"
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/50">
                {renderIcon(m.icon, false)}
                <div className="absolute -bottom-1 -right-1 rounded-full bg-neutral-950 p-0.5 border border-neutral-800">
                  <Lock className="h-2.5 w-2.5 text-neutral-500" />
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-neutral-300">{m.title}</div>
                <div className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5 leading-tight">{m.description}</div>
              </div>
              <div className="w-full space-y-1">
                <div className="flex justify-between font-mono text-[9px] text-neutral-400">
                  <span>Progress</span>
                  <span>{m.progress}/{m.target}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.round((m.progress / m.target) * 100))}%` }}
                    className="h-full bg-neutral-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
