import type { CSSProperties } from 'react';
import { Check, Copy, ArrowRight, FileText, CheckCircle2, Download } from 'lucide-react';
import { PLAN_FIXTURE } from '../../data/product-fixtures';

// Copied and adapted from:
// - frontend/src/features/plan/plan-page.tsx
// - frontend/src/features/plan/components/plan-stepper.tsx
// - frontend/src/features/plan/components/plan-locked-view.tsx
// - frontend/src/features/docs/components/docs-list-pane.tsx

export function ProductPlanPage() {
  const { steps, docs } = PLAN_FIXTURE;

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
              {PLAN_FIXTURE.title}
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold border shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              {PLAN_FIXTURE.stepsDone} of {PLAN_FIXTURE.stepsTotal} steps validated
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-surface border border-border text-ink-2">
              Board seeded
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Structured architecture, PRD, phases and task breakdown generated from your brief.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-xs font-semibold text-foreground">
            <Copy className="size-3.5" />
            <span>Copy prompt</span>
          </div>
          <div className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-ink text-card text-xs font-semibold shadow-xs">
            <span>Open build workspace</span>
            <ArrowRight className="size-3.5" />
          </div>
        </div>
      </div>

      {/* 2. Main Layout: Left Stepper Pipeline (4 cols), Right Docs Vault (8 cols) */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Left Column: Pipeline Stepper (4 cols) */}
        <div
          data-callout="Four steps"
          className="l-ps-rise col-span-4 rounded-[20px] bg-card border border-border shadow-xs p-5 space-y-4"
          style={{ '--l-i': 1 } as CSSProperties}
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Plan Pipeline
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-600">
              100% complete
            </span>
          </div>

          <div className="flex flex-col select-none">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className="l-ps-rise flex h-[62px] relative group"
                style={{ '--l-i': 2 + idx } as CSSProperties}
              >
                {/* Left column: circle + connector */}
                <div className="w-7 relative flex flex-col items-center shrink-0 mr-3">
                  <div className="size-7 rounded-full flex items-center justify-center relative z-10 shrink-0 bg-emerald-500/10 border-2 border-emerald-500 text-emerald-600">
                    <Check className="size-3.5 stroke-[3]" />
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="w-0.5 bg-emerald-500 flex-1 min-h-[34px]" />
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0 pr-1 pt-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {step.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground block">
                    Step {step.id} · Validated
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Locked summary callout */}
          <div className="p-3 rounded-xl bg-surface border border-border/80 flex items-center gap-3">
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Check className="size-4 stroke-[2.5]" />
            </div>
            <div className="text-xs min-w-0 flex-1">
              <p className="font-semibold text-foreground">Specifications locked</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {PLAN_FIXTURE.docsCount} docs · {PLAN_FIXTURE.phasesCount} phases · {PLAN_FIXTURE.tasksCount} tasks
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Generated Documents Vault (8 cols) */}
        <div
          data-callout="Nine docs"
          className="l-ps-rise col-span-8 rounded-[20px] bg-card border border-border shadow-xs overflow-hidden"
          style={{ '--l-i': 6 } as CSSProperties}
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-ink-2" />
              <div className="text-sm font-semibold text-foreground">Generated Documents Vault</div>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {docs.length} markdown files
            </span>
          </div>

          {/* Docs Table Rows */}
          <div className="divide-y divide-border/50 text-xs">
            {docs.map((doc, idx) => (
              <div
                key={doc.name}
                className="l-ps-rise w-full h-11 px-4 flex items-center justify-between gap-3 text-left transition-colors hover:bg-surface/60"
                style={{ '--l-i': 7 + Math.min(idx, 6) } as CSSProperties}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <FileText className="size-3.5 text-ink-2 shrink-0" />
                  <span className="font-mono text-xs font-semibold text-foreground truncate">
                    {doc.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate inline">
                    — {doc.description}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface border border-border text-muted-foreground">
                    v{doc.version}
                  </span>
                  <div className="size-6 rounded flex items-center justify-center text-muted-foreground hover:bg-surface">
                    <Download className="size-3" />
                  </div>
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
