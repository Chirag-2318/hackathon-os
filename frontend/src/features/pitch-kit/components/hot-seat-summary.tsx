import React from 'react';
import { Button } from '@/components/ui/button';
import type { SessionSummary } from '../api/qna-api';

interface HotSeatSummaryProps {
  summary: SessionSummary;
  totalCount: number;
  onBackToMap: () => void;
  onDrillRevisit: (revisitHashes: string[]) => void;
}

export function HotSeatSummary({
  summary,
  totalCount,
  onBackToMap,
  onDrillRevisit,
}: HotSeatSummaryProps) {
  const avgSec = Math.round(summary.avgAnswerMs / 1000);
  const longestSec = Math.round(summary.longestHesitation / 1000);

  return (
    <div className="fixed inset-0 z-50 bg-[#070708] text-[#F4F1EA] flex flex-col justify-between overflow-y-auto select-none p-6 sm:p-12">
      <div className="max-w-2xl w-full mx-auto space-y-8 my-auto">
        <div className="space-y-2 border-b border-white/10 pb-6">
          <span className="font-mono text-xs uppercase tracking-wider text-white/50">
            Hot Seat Complete
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-normal text-[#F4F1EA]">
            Drill Summary
          </h1>
        </div>

        {/* Counts Grid */}
        <div className="grid grid-cols-3 gap-4 border border-white/10 rounded-lg p-4 bg-white/5 font-mono">
          <div className="text-center space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-white/50 block">Solid</span>
            <span className="text-3xl font-normal text-emerald-400">
              {summary.counts.solid}
            </span>
          </div>
          <div className="text-center space-y-1 border-x border-white/10">
            <span className="text-[11px] uppercase tracking-wider text-white/50 block">Shaky</span>
            <span className="text-3xl font-normal text-amber-400">
              {summary.counts.shaky}
            </span>
          </div>
          <div className="text-center space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-white/50 block">Missed</span>
            <span className="text-3xl font-normal text-rose-400">
              {summary.counts.missed}
            </span>
          </div>
        </div>

        {/* Timing & Criteria stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="border border-white/10 rounded-lg p-3.5 bg-white/5 space-y-1">
            <span className="text-white/50 uppercase block text-[10px]">Average Response</span>
            <span className="text-lg text-white font-medium">{avgSec}s</span>
          </div>
          <div className="border border-white/10 rounded-lg p-3.5 bg-white/5 space-y-1">
            <span className="text-white/50 uppercase block text-[10px]">Longest Hesitation</span>
            <span className="text-lg text-white font-medium">{longestSec}s</span>
          </div>
          <div className="border border-white/10 rounded-lg p-3.5 bg-white/5 space-y-1">
            <span className="text-white/50 uppercase block text-[10px]">Weakest Area</span>
            <span className="text-lg text-white font-medium truncate block" title={summary.weakestCriterion}>
              {summary.weakestCriterion || 'Balanced'}
            </span>
          </div>
        </div>

        {/* Revisit List */}
        {summary.revisit && summary.revisit.length > 0 && (
          <div className="border border-white/10 rounded-lg p-4 bg-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-medium">
                {summary.revisit.length} Question{summary.revisit.length === 1 ? '' : 's'} to Revisit
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDrillRevisit(summary.revisit)}
                className="text-xs font-mono h-7 border-amber-400/40 text-amber-300 hover:bg-amber-400/10"
              >
                Drill these
              </Button>
            </div>
            <p className="text-xs text-white/60 font-mono">
              These questions were rated Missed or Shaky during the session and need extra reinforcement.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <Button
            size="lg"
            variant="ghost"
            onClick={onBackToMap}
            className="text-xs font-mono text-white/70 hover:text-white hover:bg-white/10"
          >
            Back to the map
          </Button>

          {summary.revisit && summary.revisit.length > 0 ? (
            <Button
              size="lg"
              onClick={() => onDrillRevisit(summary.revisit)}
              className="bg-[#F4F1EA] text-[#070708] hover:bg-white font-mono text-xs px-6 font-semibold"
            >
              Drill weak questions ({summary.revisit.length})
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={onBackToMap}
              className="bg-[#F4F1EA] text-[#070708] hover:bg-white font-mono text-xs px-6 font-semibold"
            >
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
