import type { CSSProperties } from 'react';
import { Check, Clock, ExternalLink, ShieldCheck, Crown } from 'lucide-react';
import { LAUNCH_FIXTURE } from '../../data/product-fixtures';

// Copied and adapted from:
// - frontend/src/features/submission/submission-page.tsx
// - frontend/src/features/submission/components/submission-state-a.tsx

export function ProductLaunchPage() {
  const { checklist, deliverables } = LAUNCH_FIXTURE;

  return (
    <div className="w-full max-w-[840px] mx-auto p-8 font-sans pb-16 flex flex-col items-center">
      {/* 1. Header & Headline */}
      <div
        className="l-ps-rise text-center flex flex-col items-center max-w-[620px]"
        style={{ '--l-i': 0 } as CSSProperties}
      >
        <div
          className="text-[44px] font-normal tracking-tight text-foreground leading-[1.1]"
          style={{ fontFamily: 'var(--font-display, serif)' }}
        >
          {LAUNCH_FIXTURE.title}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2.5">
          {LAUNCH_FIXTURE.subtitle}
        </p>
      </div>

      {/* 2. Big Countdown Block */}
      <div
        data-callout="Countdown"
        className="l-ps-rise mt-6 w-full max-w-[520px] p-4 rounded-[18px] bg-card border border-border shadow-xs flex items-center justify-between"
        style={{ '--l-i': 1 } as CSSProperties}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="size-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
              Submission Window
            </span>
            <span className="text-xs font-medium text-foreground">
              Deadline: {LAUNCH_FIXTURE.deadlineAt}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono text-2xl font-bold tracking-tight text-foreground tabular-nums block">
            {LAUNCH_FIXTURE.countdownText}
          </span>
          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
            {LAUNCH_FIXTURE.countdownSubtext}
          </span>
        </div>
      </div>

      {/* 3. Pre-Flight Checklist */}
      <div
        className="l-ps-rise mt-6 w-full max-w-[680px] rounded-[20px] bg-card border border-border shadow-xs overflow-hidden"
        style={{ '--l-i': 2 } as CSSProperties}
      >
        <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pre-Flight Checklist
            </span>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-600">
            5 of 5 verified
          </span>
        </div>

        <div className="divide-y divide-border/50 text-xs">
          {checklist.map((item, idx) => (
            <div
              key={item.id}
              className="l-ps-rise px-5 py-3 flex items-center justify-between gap-3 bg-surface/40"
              style={{ '--l-i': 3 + idx } as CSSProperties}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-5 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="size-3.5 stroke-[2.5]" />
                </div>
                <span className="text-foreground font-medium truncate">
                  {item.label}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold shrink-0">
                Ready
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Deliverables Links */}
      <div
        className="l-ps-rise mt-5 w-full max-w-[680px] grid grid-cols-3 gap-3"
        style={{ '--l-i': 8 } as CSSProperties}
      >
        {deliverables.map((del) => (
          <div
            key={del.label}
            className="p-3 rounded-[14px] bg-card border border-border flex flex-col justify-between gap-1 text-xs"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-semibold text-[11px] uppercase tracking-wider">
                {del.label}
              </span>
              <ExternalLink className="size-3 text-ink-3" />
            </div>
            <span className="font-mono text-[11px] text-foreground truncate mt-1">
              {del.value}
            </span>
          </div>
        ))}
      </div>

      {/* 5. Mark as Submitted Control (Leader only, ready state) */}
      <div
        data-callout="Leader only"
        className="l-ps-rise mt-8 flex flex-col items-center gap-2.5"
        style={{ '--l-i': 9 } as CSSProperties}
      >
        <div className="min-h-[44px] px-8 py-3 text-base font-semibold rounded-lg bg-foreground text-background shadow-xs flex items-center gap-2">
          <span>{LAUNCH_FIXTURE.buttonLabel}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
          <Crown className="size-3 text-amber-500" />
          <span>Leader control: {LAUNCH_FIXTURE.leaderHandle}</span>
        </div>
      </div>
    </div>
  );
}
