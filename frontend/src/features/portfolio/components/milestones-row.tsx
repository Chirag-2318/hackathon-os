import React from 'react';
import { Compass, Ship, Shield, Sparkles, CheckCircle2, Hammer, GitCommit, Award, Crown, Flame, Lock } from 'lucide-react';
import type { MilestoneDto } from '../types';

interface MilestonesRowProps {
  milestones: MilestoneDto[];
}

export const MilestonesRow: React.FC<MilestonesRowProps> = ({ milestones }) => {
  if (!milestones || milestones.length === 0) return null;

  const renderIcon = (icon: string, earned: boolean) => {
    const props = { className: `h-5 w-5 ${earned ? 'text-amber-500' : 'text-muted-foreground'}` };
    switch (icon) {
      case 'compass': return <Compass {...props} />;
      case 'ship': return <Ship {...props} />;
      case 'shield': return <Shield {...props} />;
      case 'sparkle': return <Sparkles {...props} />;
      case 'check-circle': return <CheckCircle2 {...props} />;
      case 'hammer': return <Hammer {...props} />;
      case 'git-commit': return <GitCommit {...props} />;
      case 'crown': return <Crown {...props} />;
      case 'flame': return <Flame {...props} />;
      default: return <Award {...props} />;
    }
  };

  return (
    <section className="space-y-4 px-4 sm:px-6 pt-6 pb-8">
      <div>
        <h2 className="text-[22px] font-display font-normal tracking-tight text-foreground flex items-center gap-2">
          <span>Earned Milestones</span>
          <span className="font-mono text-xs text-muted-foreground">
            ({milestones.filter((m) => m.earned).length} achieved)
          </span>
        </h2>
        <p className="text-xs text-muted-foreground">Verified milestones achieved across hackathon challenges</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {milestones.map((m) => {
          if (m.earned) {
            return (
              <div
                key={m.id}
                className="flex flex-col items-center text-center rounded-[14px] border border-border bg-surface p-4 space-y-2.5 transition-colors hover:border-border-strong"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 shadow-xs">
                  {renderIcon(m.icon, true)}
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">{m.title}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-tight">{m.description}</div>
                </div>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  Earned
                </span>
              </div>
            );
          }

          // Next achievable locked milestone
          return (
            <div
              key={m.id}
              className="flex flex-col items-center text-center rounded-[14px] border border-dashed border-border bg-surface p-4 space-y-2.5 opacity-60 hover:opacity-85 transition-opacity"
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted/40">
                {renderIcon(m.icon, false)}
                <div className="absolute -bottom-1 -right-1 rounded-full bg-surface p-0.5 border border-border">
                  <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">{m.title}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-tight">{m.description}</div>
              </div>
              <div className="w-full space-y-1">
                <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
                  <span>Progress</span>
                  <span>{m.progress}/{m.target}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.round((m.progress / m.target) * 100))}%` }}
                    className="h-full bg-muted-foreground rounded-full"
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
