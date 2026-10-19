import type { CSSProperties } from 'react';
import { ShieldAlert, Check, X, Lock, CheckCircle2, ThumbsUp } from 'lucide-react';
import { IDEATE_FIXTURE } from '../../data/product-fixtures';

// Copied and adapted from:
// - frontend/src/features/ideate/ideate-page.tsx
// - frontend/src/features/ideate/components/stress-test-stage.tsx
// - frontend/src/features/ideate/components/vote-stage.tsx
// - frontend/src/features/ideate/components/decide-stage.tsx

export function ProductIdeatePage() {
  const { ideas, stressTest } = IDEATE_FIXTURE;

  return (
    <div className="w-full flex flex-col gap-5 p-7 max-w-[1240px] mx-auto font-sans">
      {/* 1. Header bar */}
      <div
        className="l-ps-rise flex items-center justify-between pb-2 border-b border-border/60"
        style={{ '--l-i': 0 } as CSSProperties}
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-display font-normal tracking-tight text-foreground leading-none">
              {IDEATE_FIXTURE.title}
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border shrink-0 bg-blue-500/10 text-blue-600 border-blue-500/20">
              {IDEATE_FIXTURE.silentChip}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              4 of 4 voted
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {IDEATE_FIXTURE.problemStatement}
          </p>
        </div>

        {/* Lock Idea Control (Ready state, leader only) */}
        <div
          className="flex items-center gap-2"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
            <Lock className="size-3.5 text-muted-foreground" />
            <span className="text-[11px] font-mono text-muted-foreground">
              {IDEATE_FIXTURE.leaderLockNote}
            </span>
            <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-foreground text-background text-xs font-semibold shadow-xs">
              <span>Lock idea</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Layout: Left Ideas Feed with Votes (5 cols), Right AI Stress Test (7 cols) */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Left: Ideas List with Anonymous Votes */}
        <div
          data-callout="Silent votes"
          className="col-span-5 rounded-[20px] bg-card border border-border shadow-xs p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Silent Round · Votes Revealed
            </span>
            <span className="text-xs font-mono font-semibold text-foreground">
              3 ideas submitted
            </span>
          </div>

          <div className="space-y-3">
            {ideas.map((idea, idx) => {
              const isChosen = idea.isChosen;
              return (
                <div
                  key={idea.id}
                  className={`l-ps-rise p-4 rounded-[14px] border transition-all text-left flex flex-col gap-2 ${
                    isChosen
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-surface border-border'
                  }`}
                  style={{ '--l-i': 1 + idx } as CSSProperties}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-[14px] font-bold text-foreground truncate">
                        {idea.title}
                      </p>
                      {isChosen && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20 shrink-0">
                          Top voted
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono shrink-0 ${
                        idea.badge === 'Pass'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}
                    >
                      {idea.badge}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {idea.identity}
                  </p>

                  <div className="mt-1 pt-2 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ThumbsUp className="size-3 text-ink-3" />
                      <span>{idea.votes} anonymous votes</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {idea.votePct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: AI Stress Test Analysis Panel */}
        <div
          data-callout="Stress test"
          className="col-span-7 rounded-[20px] bg-card border border-border shadow-xs p-6 flex flex-col gap-5"
        >
          {/* Stress test header */}
          <div
            className="l-ps-rise flex items-center justify-between border-b border-border/60 pb-4"
            style={{ '--l-i': 4 } as CSSProperties}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-[12px] text-blue-600">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <div className="text-base font-bold text-foreground">
                  {stressTest.selectedIdeaTitle}
                </div>
                <p className="text-xs text-muted-foreground">
                  AI Stress Test Analysis · Campus Build Sprint rubric
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">
                Overall:
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {stressTest.overallBadge}
              </span>
            </div>
          </div>

          {/* Stress test rows */}
          <div className="space-y-3">
            {stressTest.rows.map((row, idx) => (
              <div
                key={row.label}
                className={`l-ps-rise p-3.5 border rounded-[12px] flex items-center justify-between gap-3 ${
                  row.passed
                    ? 'bg-surface border-border'
                    : 'bg-amber-500/5 border-amber-500/20'
                }`}
                style={{ '--l-i': 5 + idx } as CSSProperties}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {row.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        row.verdict === 'strong'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {row.score}%
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {row.note}
                  </p>
                </div>

                <div className="shrink-0">
                  {row.passed ? (
                    <div className="size-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Check className="size-3.5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="size-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                      <X className="size-3.5 stroke-[2.5]" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Callout */}
          <div
            className="l-ps-rise pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground font-mono"
            style={{ '--l-i': 9 } as CSSProperties}
          >
            <span>Ready for planning stage</span>
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <CheckCircle2 className="size-3.5" />
              <span>Criteria validated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
