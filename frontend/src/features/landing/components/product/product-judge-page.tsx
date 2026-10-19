import type { CSSProperties } from 'react';
import { Search, Flame, Plus, Play, ExternalLink, AlertTriangle } from 'lucide-react';
import { JUDGE_PAGE } from '../../data/product-fixtures';

// Copied and adapted from:
// - frontend/src/features/pitch-kit/pitch-kit-page.tsx
// - frontend/src/features/pitch-kit/components/pitch-kit-header.tsx
// - frontend/src/features/pitch-kit/components/qna-station.tsx
// - frontend/src/features/pitch-kit/components/qna-library.tsx
// - frontend/src/features/pitch-kit/components/qna-detail-drawer.tsx

export function ProductJudgePage() {
  const activeQuestion = JUDGE_PAGE.questions[0];

  return (
    <div className="w-full flex flex-col gap-4 p-7 max-w-[1240px] mx-auto font-sans">
      {/* 1. Page Header with Tabs and Readiness Badge */}
      <div
        className="l-ps-rise flex items-center justify-between pb-2 border-b border-border/60"
        style={{ '--l-i': 0 } as CSSProperties}
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-display font-normal tracking-tight text-foreground leading-none">
              {JUDGE_PAGE.title}
            </div>
            <div className="flex items-center rounded-lg bg-surface border border-border p-0.5 text-xs font-medium">
              <span className="px-2.5 py-1 rounded text-ink-3">Demo</span>
              <span className="px-2.5 py-1 rounded text-ink-3">Pitch</span>
              <span className="px-2.5 py-1 rounded bg-hover-surface text-ink font-semibold shadow-xs">
                {JUDGE_PAGE.station}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {JUDGE_PAGE.subtitle}
          </p>
        </div>

        {/* Readiness indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border shadow-xs">
            <div className="relative size-7 flex items-center justify-center">
              <svg className="size-7 -rotate-90" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="11" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                <circle
                  cx="14"
                  cy="14"
                  r="11"
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth="2.5"
                  strokeDasharray={2 * Math.PI * 11}
                  strokeDashoffset={2 * Math.PI * 11 * 0.12}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-ink">
                88%
              </span>
            </div>
            <div className="text-left text-xs">
              <span className="font-semibold text-foreground block">Ready</span>
              <span className="text-[10px] text-muted-foreground">{JUDGE_PAGE.progressText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Action Rail */}
      <div
        className="l-ps-rise flex items-center justify-between gap-3 text-xs"
        style={{ '--l-i': 1 } as CSSProperties}
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-card text-ink-2 w-56">
            <Search className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Filter questions…</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-ink text-card">
              All (3)
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border border-border bg-surface text-ink-2">
              Technical Execution
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border border-border bg-surface text-ink-2">
              User Experience
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border border-border bg-surface text-ink-2">
              Vision
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-foreground font-medium">
            <Flame className="size-3.5 text-amber-500" />
            <span>Practise Hot Seat</span>
          </div>
          <div className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-foreground font-medium">
            <Plus className="size-3.5" />
            <span>Custom</span>
          </div>
        </div>
      </div>

      {/* 3. Main Two-Column Layout: Question Deck (5 cols) & Active Question Detail (7 cols) */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Left Column: Question Deck */}
        <div
          className="l-ps-rise col-span-5 flex flex-col gap-3"
          style={{ '--l-i': 2 } as CSSProperties}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono px-1">
            <span className="font-bold uppercase tracking-wider">Anticipated Questions</span>
            <span>3 questions</span>
          </div>

          {JUDGE_PAGE.questions.map((q, idx) => {
            const isSelected = idx === 0;
            return (
              <div
                key={q.id}
                className={`l-ps-rise p-4 rounded-[16px] border transition-all ${
                  isSelected
                    ? 'bg-hover-surface border-border-strong ring-1 ring-border-strong shadow-xs'
                    : 'bg-card border-border/70 hover:bg-surface/60'
                }`}
                style={{ '--l-i': 3 + idx } as CSSProperties}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-ink-2 font-semibold">{q.criterion}</span>
                    <span>·</span>
                    <span>{q.category}</span>
                  </div>
                  <div className="flex items-center gap-1" aria-label={`Difficulty ${q.difficulty} of ${q.difficultyMax}`}>
                    {Array.from({ length: q.difficultyMax }, (_, dIdx) => (
                      <span
                        key={dIdx}
                        className={`size-1.5 rounded-full ${
                          dIdx < q.difficulty ? 'bg-amber-500' : 'bg-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-sm font-medium text-foreground leading-snug mb-3">
                  {q.question}
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-mono font-semibold">
                    Answer ready
                  </span>
                  {q.risk ? (
                    <span className="text-ink-3 font-mono truncate max-w-[180px]">
                      Risk: {q.risk}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Question Defense Card */}
        <div
          className="l-ps-rise col-span-7 rounded-[20px] bg-card border border-border shadow-xs p-6 space-y-5"
          style={{ '--l-i': 6 } as CSSProperties}
        >
          {/* Header row with criterion and difficulty */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="font-semibold text-foreground">{activeQuestion.criterion}</span>
              <span>·</span>
              <span>{activeQuestion.category}</span>
              <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-surface border border-border text-muted-foreground">
                {activeQuestion.source}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <span className="text-[11px]">Difficulty</span>
                <div className="flex items-center gap-1 ml-1">
                  {Array.from({ length: activeQuestion.difficultyMax }, (_, dIdx) => (
                    <span
                      key={dIdx}
                      className={`size-2 rounded-full ${
                        dIdx < activeQuestion.difficulty ? 'bg-amber-500' : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="inline-flex items-center gap-1 text-xs font-mono h-7 px-2.5 rounded-md border border-border bg-surface text-foreground font-medium">
                <Play className="size-3 fill-current" />
                <span>Practise</span>
              </div>
            </div>
          </div>

          {/* Judge Question */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
              Judge’s question
            </span>
            <div className="font-display text-2xl font-normal text-foreground leading-snug">
              {activeQuestion.question}
            </div>
          </div>

          {/* Why asked & Risk Line */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface border border-border/70 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
                Why asked
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {activeQuestion.why}
              </p>
            </div>
            <div className="space-y-1 border-l border-border/60 pl-3">
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3" />
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
                  Identified risk
                </span>
              </div>
              <p className="text-foreground font-medium leading-relaxed">
                {activeQuestion.risk}
              </p>
            </div>
          </div>

          {/* Prepared Answer */}
          <div className="space-y-2 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span className="uppercase tracking-wider font-semibold text-foreground">Prepared answer</span>
              <span>
                {activeQuestion.words} words · about {activeQuestion.speakingTimeSec}s to say
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground font-normal">
              {activeQuestion.answer}
            </p>
          </div>

          {/* Judge pushes & Counter */}
          <div className="space-y-2 border-l-2 border-border pl-4 py-1 text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
              Judge pushes back
            </span>
            <p className="italic text-foreground/90 font-serif text-sm">
              “{activeQuestion.followup}”
            </p>
            <p className="text-muted-foreground pt-1">
              {activeQuestion.counter}
            </p>
          </div>

          {/* Proof link */}
          <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="uppercase tracking-wider text-[10px]">Show or open:</span>
              <span className="text-foreground underline underline-offset-2 inline-flex items-center gap-1">
                {activeQuestion.proof}
                <ExternalLink className="size-3" />
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold text-[10px]">
              Ready to defend
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
