import React from 'react';
import type { RoleFingerprintDto } from '../types';

interface RoleFingerprintProps {
  fingerprint: RoleFingerprintDto;
}

export const RoleFingerprint: React.FC<RoleFingerprintProps> = ({ fingerprint }) => {
  const total = Math.max(fingerprint.total, 1);

  const builderPct = Math.round((fingerprint.builderTasks / total) * 100);
  const leaderPct = Math.round((fingerprint.leaderActions / total) * 100);
  const productPct = Math.round((fingerprint.productIdeas / total) * 100);
  const pitchPct = Math.max(0, 100 - builderPct - leaderPct - productPct);

  const segments = [
    { label: 'Building', count: fingerprint.builderTasks, pct: builderPct, color: 'bg-emerald-500', text: 'text-emerald-500' },
    { label: 'Leadership', count: fingerprint.leaderActions, pct: leaderPct, color: 'bg-amber-500', text: 'text-amber-500' },
    { label: 'Product & Ideas', count: fingerprint.productIdeas, pct: productPct, color: 'bg-sky-500', text: 'text-sky-500' },
    { label: 'Pitch & Demo', count: fingerprint.pitchPresence, pct: pitchPct, color: 'bg-indigo-500', text: 'text-indigo-500' },
  ].filter((s) => s.count > 0 || fingerprint.total === 0);

  return (
    <section className="space-y-4 px-4 sm:px-6 pt-6">
      <div>
        <h2 className="text-[22px] font-display font-normal tracking-tight text-foreground flex items-center gap-2">
          <span>Contribution Fingerprint</span>
          <span className="font-mono text-xs text-muted-foreground">({fingerprint.total} actions)</span>
        </h2>
        <p className="text-xs text-muted-foreground">Distribution of actions taken across development stages</p>
      </div>

      <div className="rounded-[14px] border border-border bg-transparent p-5 space-y-5">
        {/* One segmented bar with token colours */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-foreground/[0.06] p-0.5 border border-border">
          {segments.map((s, idx) => (
            <div
              key={idx}
              style={{ width: `${Math.max(s.pct, 4)}%` }}
              className={`h-full ${s.color} transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
              title={`${s.label}: ${s.pct}% (${s.count})`}
            />
          ))}
        </div>

        {/* Stats in hairline-separated columns (no filled boxes) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border pt-1">
          {segments.map((s, idx) => (
            <div key={idx} className="flex flex-col py-2 sm:py-0 px-4 first:pl-0 last:pr-0">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${s.color}`} />
                <span>{s.label}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2 font-mono">
                <span className="text-2xl font-semibold text-foreground">{s.count}</span>
                <span className={`text-xs ${s.text}`}>{s.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
