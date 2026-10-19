import type { CSSProperties } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { BRIEF_FIXTURE } from '../../data/product-fixtures';

// Copied and adapted from:
// - frontend/src/features/brief/brief-page.tsx
// - frontend/src/features/brief/components/brief-fields-list.tsx

export function ProductBriefPage() {
  const { rubric, deadlines } = BRIEF_FIXTURE;

  return (
    <div className="w-full flex flex-col gap-5 p-7 max-w-[1240px] mx-auto font-sans">
      {/* 1. Page Header */}
      <div
        className="l-ps-rise flex items-center justify-between gap-4 pb-2 border-b border-border/60"
        style={{ '--l-i': 0 } as CSSProperties}
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-display font-normal tracking-tight text-foreground leading-none">
              {BRIEF_FIXTURE.title}
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              {BRIEF_FIXTURE.status}
            </span>
            <span className="text-xs font-mono text-emerald-600">Saved</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Every rule, rubric weight, and deadline in one verified source of truth.
          </p>
        </div>

        <div className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-xs font-semibold text-foreground">
          <RefreshCw className="size-3.5" />
          <span>Replace brief</span>
        </div>
      </div>

      {/* 2. Review Section: Two-column grid (7 cols fields list, 5 cols source text) */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Left Column: Extracted Rules (7 cols) */}
        <div
          className="l-ps-rise col-span-7 rounded-[24px] bg-card border border-border shadow-xs overflow-hidden"
          style={{ '--l-i': 1 } as CSSProperties}
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
            <div className="text-sm font-semibold text-foreground">Extracted Rules & Fields</div>
            <span className="text-xs text-muted-foreground font-mono">
              {BRIEF_FIXTURE.confirmedCount} of {BRIEF_FIXTURE.totalCount} confirmed
            </span>
          </div>

          <div className="divide-y divide-border/50 text-xs">
            {/* 1. Problem Statement */}
            <div
              className="l-ps-rise p-3.5 flex items-start justify-between gap-3"
              style={{ '--l-i': 2 } as CSSProperties}
            >
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Problem Statement <span className="text-danger">*</span>
                </span>
                <p className="text-xs text-foreground leading-relaxed">
                  {BRIEF_FIXTURE.problemStatement}
                </p>
              </div>
              <div className="size-5 rounded flex items-center justify-center bg-ink text-card shrink-0">
                <Check className="size-3 stroke-[3]" />
              </div>
            </div>

            {/* 2. Judging Rubric */}
            <div
              data-callout="Rubric weights"
              className="l-ps-rise p-3.5 flex flex-col gap-2.5"
              style={{ '--l-i': 3 } as CSSProperties}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Judging Rubric
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600">
                    Total 100%
                  </span>
                </div>
                <div className="size-5 rounded flex items-center justify-center bg-ink text-card shrink-0">
                  <Check className="size-3 stroke-[3]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {rubric.map((r) => (
                  <div
                    key={r.criterion}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface border border-border text-xs"
                  >
                    <span className="text-foreground font-medium">{r.criterion}</span>
                    <span className="font-mono font-bold text-ink">{r.weight}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Deadlines */}
            <div
              className="l-ps-rise p-3.5 flex items-start justify-between gap-3"
              style={{ '--l-i': 4 } as CSSProperties}
            >
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Key Deadlines
                </span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="p-2 rounded-lg bg-surface border border-border">
                    <span className="text-[10px] text-muted-foreground block">Submission Deadline</span>
                    <span className="font-mono font-semibold text-foreground">{deadlines.submission}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-border">
                    <span className="text-[10px] text-muted-foreground block">Start Rule</span>
                    <span className="font-mono font-semibold text-foreground">{BRIEF_FIXTURE.startRule}</span>
                  </div>
                </div>
              </div>
              <div className="size-5 rounded flex items-center justify-center bg-ink text-card shrink-0">
                <Check className="size-3 stroke-[3]" />
              </div>
            </div>

            {/* 4. Tech & AI Policies */}
            <div
              className="l-ps-rise p-3.5 flex items-start justify-between gap-3"
              style={{ '--l-i': 5 } as CSSProperties}
            >
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Tech & Rules
                </span>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-foreground font-medium">
                    {BRIEF_FIXTURE.techRules}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-foreground font-medium">
                    AI: {BRIEF_FIXTURE.aiPolicy}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-foreground font-medium">
                    {BRIEF_FIXTURE.eligibility}
                  </span>
                </div>
              </div>
              <div className="size-5 rounded flex items-center justify-center bg-ink text-card shrink-0">
                <Check className="size-3 stroke-[3]" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Source Text Card (5 cols) */}
        <div
          className="l-ps-rise col-span-5 rounded-[24px] bg-card border border-border shadow-xs overflow-hidden"
          style={{ '--l-i': 6 } as CSSProperties}
        >
          <div className="px-5 pt-4 pb-3 border-b border-border/60 flex items-center justify-between">
            <div className="text-sm font-semibold text-foreground">Source Text</div>
            <span className="text-xs text-muted-foreground font-mono">{BRIEF_FIXTURE.sourceType}</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="p-3.5 rounded-xl bg-surface border border-border/60 text-xs font-mono leading-relaxed text-foreground">
              {BRIEF_FIXTURE.rawSnippet}
            </div>

            <div
              data-callout="Leader confirms"
              className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2.5"
            >
              <div className="size-6 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="size-3.5 stroke-[3]" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-foreground">Brief confirmed by leader</p>
                <p className="text-muted-foreground text-[11px]">{BRIEF_FIXTURE.confirmedText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
