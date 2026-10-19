import type { CSSProperties } from 'react';
import { READINESS_PAGE } from '../../data/product-fixtures';

// Copied and adapted from:
// - frontend/src/features/readiness/readiness-page.tsx
// - frontend/src/features/readiness/components/readiness-rings-row.tsx
// - frontend/src/features/readiness/components/weak-spot-list.tsx
// - frontend/src/features/readiness/components/judge-simulator-panel.tsx

const RING_SIZE = 56;
const STROKE = 3;
const RADIUS = RING_SIZE / 2 - STROKE * 2;
const CIRCUMFERENCE = RADIUS * 2 * Math.PI;

const SEVERITY_CONFIG = {
  high: { label: 'High', icon: '⚠', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  medium: { label: 'Medium', icon: '●', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  low: { label: 'Low', icon: '○', badgeClass: 'bg-surface text-ink-3' },
};

const TILE_PASTELS = [
  'var(--pastel-peach)',
  'var(--pastel-amber)',
  'var(--pastel-lavender)',
];

export function ProductReadinessPage() {
  const { rings, weakSpots, simulator } = READINESS_PAGE;

  return (
    <div className="w-full flex flex-col gap-6 p-7 max-w-[1240px] mx-auto font-sans">
      {/* 1. Page Heading */}
      <div
        className="l-ps-rise flex items-center justify-between pb-2 border-b border-border/60"
        style={{ '--l-i': 0 } as CSSProperties}
      >
        <div>
          <div className="text-3xl font-display font-normal tracking-tight text-foreground leading-none">
            {READINESS_PAGE.title}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {READINESS_PAGE.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600">
            Audit complete
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border border-border bg-surface text-ink-2">
            6 of 6 checks
          </span>
        </div>
      </div>

      {/* 2. Six Readiness Rings Row */}
      <div
        className="l-ps-rise p-4 rounded-[18px] bg-card border border-border shadow-xs"
        style={{ '--l-i': 1 } as CSSProperties}
      >
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-3 px-1">
          <span className="font-bold uppercase tracking-wider">Readiness Checkpoints</span>
          <span>Overall: 94% ready</span>
        </div>

        <div className="grid grid-cols-6 gap-3">
          {rings.map((ring, idx) => {
            const offset = CIRCUMFERENCE * (1 - ring.progress);
            return (
              <div
                key={ring.id}
                className="l-ps-rise flex flex-col items-center justify-center p-2 rounded-xl bg-surface/50 border border-border/50 text-center"
                style={{ '--l-i': 2 + idx } as CSSProperties}
              >
                <div className="relative size-14 flex items-center justify-center">
                  <svg
                    width={RING_SIZE}
                    height={RING_SIZE}
                    className="-rotate-90"
                    aria-hidden="true"
                  >
                    <circle
                      stroke="var(--border)"
                      fill="transparent"
                      strokeWidth={STROKE}
                      r={RADIUS}
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                    />
                    <circle
                      stroke="var(--success-fg)"
                      fill="transparent"
                      strokeWidth={STROKE}
                      strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      r={RADIUS}
                      cx={RING_SIZE / 2}
                      cy={RING_SIZE / 2}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-semibold text-ink tabular-nums">
                    {ring.valueText}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-ink-muted text-center leading-tight mt-2 line-clamp-2">
                  {ring.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Two-Column Layout: Weak Spots (Left) & Judge Simulator (Right) */}
      <div className="grid grid-cols-2 gap-6 items-start">
        {/* Left Column: Weak Spots */}
        <div
          className="l-ps-rise rounded-[18px] bg-card border border-border shadow-xs overflow-hidden"
          style={{ '--l-i': 8 } as CSSProperties}
        >
          <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Weak spots</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Areas that need attention before judging, most severe first.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
              1 action needed
            </span>
          </div>

          <div className="divide-y divide-border/50">
            {weakSpots.map((spot, idx) => {
              const sev = SEVERITY_CONFIG[spot.severity];
              return (
                <div
                  key={spot.id}
                  className="flex items-center gap-3 px-4 py-3 bg-surface/30 hover:bg-hover-row transition-colors"
                >
                  <div
                    className="size-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-ink"
                    style={{ backgroundColor: TILE_PASTELS[idx % TILE_PASTELS.length] }}
                    aria-hidden="true"
                  >
                    {spot.code}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">
                      {spot.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Assigned: {spot.owner}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono ${sev.badgeClass}`}
                    >
                      <span aria-hidden="true">{sev.icon}</span>
                      {sev.label}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                      {spot.percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Judge Simulator */}
        <div
          className="l-ps-rise rounded-[18px] bg-card border border-border shadow-xs p-5 space-y-4"
          style={{ '--l-i': 9 } as CSSProperties}
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Judge Simulator</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                AI evaluation against hackathon scoring rubric
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {simulator.disclaimer}
            </span>
          </div>

          {/* Score bars */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
              Estimated Rubric Scores
            </span>
            <div className="space-y-2">
              {simulator.scores.map((s) => (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">{s.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      {s.score} / {s.max}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden border border-border/40">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${(s.score / s.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono pt-0.5">
              No total score is shown. Scores are estimates only.
            </p>
          </div>

          {/* Likely questions */}
          <div className="border-t border-border/60 pt-3 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
              Likely Judge Questions
            </span>
            <div className="space-y-1.5 text-xs text-foreground">
              {simulator.likelyQuestions.map((q, qIdx) => (
                <div key={q} className="flex items-start gap-2 p-2 rounded-lg bg-surface/40">
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    0{qIdx + 1}.
                  </span>
                  <span className="line-clamp-1">{q}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
