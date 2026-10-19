import React from 'react';
import { cn } from '@/lib/utils';
import type { RehearsalDetail } from '../api/pitch-kit-api';

export interface RehearsalTimelineProps {
  rehearsal: RehearsalDetail;
  selectedBeatId: string | null;
  onSelectBeat: (beatId: string) => void;
}

function fmtSec(ms: number) {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RehearsalTimeline({
  rehearsal,
  selectedBeatId,
  onSelectBeat,
}: RehearsalTimelineProps) {
  const totalPlannedMs = Math.max(
    rehearsal.plannedMs || 180000,
    rehearsal.beatTimings.reduce((s, t) => s + t.plannedMs, 0)
  );
  const totalActualMs = Math.max(
    rehearsal.durationMs,
    rehearsal.beatTimings.reduce((s, t) => s + t.actualMs, 0)
  );
  const maxScaleMs = Math.max(totalPlannedMs, totalActualMs);

  return (
    <div className="space-y-3 border border-border rounded-xl bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Beat timeline & stumbles
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          Click beat to inspect script & spoken transcript
        </span>
      </div>

      <div className="space-y-2">
        {/* Stumbles row */}
        <div className="relative h-3 w-full">
          {rehearsal.stumbles?.map((stumble, idx) => {
            const leftPct = Math.min(100, Math.max(0, (stumble.atMs / maxScaleMs) * 100));
            return (
              <div
                key={idx}
                style={{ left: `${leftPct}%` }}
                className="absolute top-0 -translate-x-1/2 w-1.5 h-3 bg-amber-500 rounded-xs"
                title={`Stumble at ${fmtSec(stumble.atMs)}`}
              />
            );
          })}
        </div>

        {/* Planned vs Actual dual-track timeline */}
        <div className="space-y-1">
          {/* Planned track */}
          <div className="h-6 w-full bg-muted/40 rounded flex overflow-hidden border border-border/60">
            {rehearsal.beatTimings.map((t, i) => {
              const widthPct = (t.plannedMs / maxScaleMs) * 100;
              const beat = rehearsal.beats?.find((b) => b.id === t.beatId);
              return (
                <div
                  key={t.beatId}
                  style={{ width: `${widthPct}%` }}
                  onClick={() => onSelectBeat(t.beatId)}
                  className={cn(
                    'h-full border-r border-background/80 flex items-center justify-center text-[10px] font-mono px-1 transition-colors cursor-pointer select-none truncate',
                    t.beatId === selectedBeatId
                      ? 'bg-foreground text-background font-medium'
                      : 'bg-muted/80 text-muted-foreground hover:bg-muted'
                  )}
                  title={`Planned: ${beat?.title || `Beat ${i + 1}`} (${fmtSec(t.plannedMs)})`}
                >
                  {fmtSec(t.plannedMs)}
                </div>
              );
            })}
          </div>

          {/* Actual track */}
          <div className="h-6 w-full bg-muted/20 rounded flex overflow-hidden border border-border/40">
            {rehearsal.beatTimings.map((t, i) => {
              const widthPct = (t.actualMs / maxScaleMs) * 100;
              const deltaMs = t.actualMs - t.plannedMs;
              const isOver = deltaMs > 2000;
              const isUnder = deltaMs < -2000;

              return (
                <div
                  key={t.beatId}
                  style={{ width: `${widthPct}%` }}
                  onClick={() => onSelectBeat(t.beatId)}
                  className={cn(
                    'h-full border-r border-background/80 flex items-center justify-between text-[10px] font-mono px-1 transition-colors cursor-pointer select-none truncate',
                    isOver
                      ? 'bg-destructive/20 text-destructive border-destructive/40'
                      : isUnder
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-muted/60 text-foreground',
                    t.beatId === selectedBeatId && 'ring-1 ring-foreground'
                  )}
                  title={`Actual: ${fmtSec(t.actualMs)} (${deltaMs >= 0 ? '+' : ''}${fmtSec(deltaMs)})`}
                >
                  <span className="truncate">{fmtSec(t.actualMs)}</span>
                  <span className="text-[9px] tabular-nums shrink-0">
                    {deltaMs >= 0 ? `+${Math.round(deltaMs / 1000)}s` : `${Math.round(deltaMs / 1000)}s`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1">
          <span>Top: planned · Bottom: actual</span>
          <span>Red = overtime · Green = under budget · Amber tick = stumble</span>
        </div>
      </div>
    </div>
  );
}
