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
    { label: 'Building', count: fingerprint.builderTasks, pct: builderPct, color: 'bg-emerald-500', text: 'text-emerald-400' },
    { label: 'Leadership', count: fingerprint.leaderActions, pct: leaderPct, color: 'bg-amber-500', text: 'text-amber-400' },
    { label: 'Product & Ideas', count: fingerprint.productIdeas, pct: productPct, color: 'bg-sky-500', text: 'text-sky-400' },
    { label: 'Pitch & Demo', count: fingerprint.pitchPresence, pct: pitchPct, color: 'bg-indigo-500', text: 'text-indigo-400' },
  ].filter((s) => s.count > 0 || fingerprint.total === 0);

  return (
    <section className="space-y-3 px-4 sm:px-6 pt-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-neutral-100 flex items-center gap-2">
          <span>Contribution Fingerprint</span>
        </h2>
        <p className="text-xs text-neutral-400">Distribution of actions taken across development stages</p>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-4 space-y-4">
        {/* Stacked percentage bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-neutral-950 p-0.5 border border-neutral-800">
          {segments.map((s, idx) => (
            <div
              key={idx}
              style={{ width: `${Math.max(s.pct, 4)}%` }}
              className={`h-full ${s.color} transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
              title={`${s.label}: ${s.pct}% (${s.count})`}
            />
          ))}
        </div>

        {/* Legend / Metrics breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {segments.map((s, idx) => (
            <div key={idx} className="flex flex-col rounded border border-neutral-800/80 bg-neutral-950/40 p-2.5">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
                <span className={`h-2 w-2 rounded-full ${s.color}`} />
                <span>{s.label}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between font-mono">
                <span className="text-lg font-semibold text-neutral-100">{s.count}</span>
                <span className={`text-xs ${s.text}`}>{s.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
