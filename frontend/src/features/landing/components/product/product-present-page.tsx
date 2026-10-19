import type { CSSProperties } from 'react';
import { Mic, Play } from 'lucide-react';
import { PRESENT_FIXTURE } from '../../data/product-fixtures';
import { Waveform } from '../waveform';

// Copied and adapted from:
// - frontend/src/features/pitch-kit/pitch-kit-page.tsx
// - frontend/src/features/pitch-kit/components/pitch-doc-panel.tsx

const SPK_COLORS = ['var(--chart-4)', 'var(--chart-1)', 'var(--chart-2)', 'var(--chart-5)', 'var(--brand-from)'];

type ProductPresentPageProps = {
  current?: number;
  levelRef?: { current: number };
  animate?: boolean;
};

export function ProductPresentPage({ current, levelRef, animate = false }: ProductPresentPageProps = {}) {
  const { lines, currentLineIndex, segments, readout, readinessPct, targetTime } = PRESENT_FIXTURE;
  const activeLineIndex = current ?? currentLineIndex;
  const activeSegmentIndex = Math.min(segments.length - 1, Math.max(0, activeLineIndex));

  return (
    <div className="w-full flex flex-col gap-4 p-7 max-w-[1240px] mx-auto font-sans">
      {/* 1. Page Header */}
      <div
        className="l-ps-rise flex items-center justify-between pb-2 border-b border-border/60"
        style={{ '--l-i': 0 } as CSSProperties}
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-display font-normal tracking-tight text-foreground leading-none">
              {PRESENT_FIXTURE.title}
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border bg-surface border-border text-ink-2">
              {PRESENT_FIXTURE.rehearsalSub}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {PRESENT_FIXTURE.subtitle}
          </p>
        </div>

        {/* Readiness circular badge */}
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
                  strokeDashoffset={2 * Math.PI * 11 * (1 - readinessPct / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-ink">
                {readinessPct}%
              </span>
            </div>
            <div className="text-left text-xs">
              <span className="font-semibold text-foreground block">Ready</span>
              <span className="text-[10px] text-muted-foreground">Rehearsal validated</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Pitch Rehearsal Layout: Left Teleprompter, Right Mic & Waveform Card */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Left Column: Teleprompter & Run of Show (7 cols) */}
        <div
          className="l-ps-rise col-span-7 rounded-[20px] bg-card border border-border shadow-xs p-5 space-y-4"
          style={{ '--l-i': 1 } as CSSProperties}
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pitch Run of Show
              </span>
              <p className="text-[11px] text-muted-foreground">5 scripted beats from DEMO_SCRIPT.md</p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {targetTime} target
            </span>
          </div>

          {/* Run of show colored strip */}
          <div
            data-callout="Run of show"
            className="flex rounded-xl overflow-hidden h-7 border border-border/40"
          >
            {segments.map((seg, i) => {
              const isCurrent = i === activeSegmentIndex;
              const color = SPK_COLORS[i % SPK_COLORS.length];
              return (
                <div
                  key={seg.label}
                  style={{ flexGrow: seg.seconds, backgroundColor: color }}
                  className={`flex items-center justify-center text-[10px] text-white font-mono font-bold px-1 transition-all ${
                    isCurrent ? 'ring-2 ring-ink ring-offset-1' : 'opacity-85'
                  }`}
                  title={`${seg.label} (${seg.time})`}
                >
                  {seg.label}
                </div>
              );
            })}
          </div>

          {/* Teleprompter text lines */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
              Teleprompter
            </span>
            <div className="space-y-2 text-sm leading-relaxed">
              {lines.map((line, idx) => {
                const isCurrent = idx === activeLineIndex;
                return (
                  <div
                    key={line}
                    className={`l-ps-rise p-2.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-hover-surface border-border-strong text-ink font-semibold ring-1 ring-border-strong'
                        : 'bg-surface/50 border-transparent text-ink-2'
                    }`}
                    style={{ '--l-i': 2 + idx } as CSSProperties}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-[11px] text-ink-3 size-4 shrink-0 flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="flex-1">{line}</p>
                      {isCurrent && (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-ink text-card shrink-0">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Simulated Microphone & Waveform (5 cols) */}
        <div
          data-callout="Waveform"
          className="l-ps-rise col-span-5 rounded-[20px] bg-card border border-border shadow-xs p-5 space-y-4"
          style={{ '--l-i': 7 } as CSSProperties}
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Mic className="size-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Live Microphone Rehearsal
              </span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600">
              Active
            </span>
          </div>

          {/* Waveform card */}
          <div className="p-4 rounded-xl bg-surface border border-border flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-full flex items-center justify-center h-16">
              <Waveform bars={PRESENT_FIXTURE.audioBars} level={PRESENT_FIXTURE.audioLevel} levelRef={levelRef} animate={animate} />
            </div>

            <div className="space-y-1">
              <span className="font-mono text-2xl font-bold tracking-tight text-ink tabular-nums">
                02:48
              </span>
              <p className="font-mono text-[11px] text-muted-foreground">
                {readout}
              </p>
            </div>

            <div className="w-full flex items-center justify-center gap-2 pt-2">
              <div className="inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-full bg-ink text-card text-xs font-semibold shadow-xs">
                <Play className="size-3 fill-current" />
                <span>Rehearse beat</span>
              </div>
            </div>
          </div>

          {/* Judge’s Chair Teaser */}
          <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Judge’s Chair Q&A</span>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold">Answer ready</span>
            </div>
            <p className="text-xs text-foreground font-medium italic">
              “{PRESENT_FIXTURE.judgeQuestion.question}”
            </p>
            <p className="text-[11px] text-muted-foreground">
              {PRESENT_FIXTURE.judgeQuestion.why}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
