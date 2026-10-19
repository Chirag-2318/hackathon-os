import React from 'react';
import { Button } from '@/components/ui/button';
import { HotSeatGradeCard } from './hot-seat-grade-card';
import type { QnaItem } from '../api/qna-api';

interface HotSeatRevealViewProps {
  roomId: string;
  item: QnaItem;
  keyPoints: string[];
  checkedPoints: Set<number>;
  onTogglePoint: (idx: number) => void;
  pressure: boolean;
  typeAnswer: string;
  transcribedText: string;
  roomAiAllowed: boolean;
  onRate: (rating: number) => void;
}

export function HotSeatRevealView({
  roomId,
  item,
  keyPoints,
  checkedPoints,
  onTogglePoint,
  pressure,
  typeAnswer,
  transcribedText,
  roomAiAllowed,
  onRate,
}: HotSeatRevealViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Key points checklist */}
      <div className="space-y-2 border-t border-white/10 pt-4">
        <span className="text-[11px] font-mono uppercase tracking-wider text-white/50 block">
          Key Points (Tick what you covered)
        </span>
        <div className="space-y-1.5">
          {keyPoints.map((point, idx) => (
            <label
              key={idx}
              onClick={() => onTogglePoint(idx)}
              className="flex items-start gap-3 p-2 rounded hover:bg-white/5 cursor-pointer text-sm text-[#F4F1EA]/90"
            >
              <input
                type="checkbox"
                checked={checkedPoints.has(idx)}
                onChange={() => {}}
                className="mt-1 h-3.5 w-3.5 accent-white rounded"
              />
              <span>{point}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Pressure follow-up */}
      {pressure && item.followup && (
        <div className="border-l-2 border-white/30 pl-4 py-2 space-y-1">
          <span className="text-[10px] font-mono uppercase text-white/40 block">Judge pushes</span>
          <p className="text-base italic font-serif text-[#F4F1EA]">"{item.followup}"</p>
          {item.counter && (
            <p className="text-xs text-white/70 font-mono pt-1">
              <strong className="text-white/90">Counter:</strong> {item.counter}
            </p>
          )}
        </div>
      )}

      {/* AI Grade card if available */}
      <HotSeatGradeCard
        roomId={roomId}
        hash={item.hash}
        answerText={typeAnswer || transcribedText}
        roomAiAllowed={roomAiAllowed}
      />

      {/* Rating Buttons */}
      <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <span className="text-xs font-mono text-white/50">
          Rate your response:
        </span>
        <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onRate(1)}
            className="border-rose-500/40 text-rose-300 hover:bg-rose-500/20 font-mono text-xs h-11"
          >
            Missed (1)
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onRate(2)}
            className="border-amber-500/40 text-amber-300 hover:bg-amber-500/20 font-mono text-xs h-11"
          >
            Shaky (2)
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onRate(3)}
            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 font-mono text-xs h-11"
          >
            Solid (3)
          </Button>
        </div>
      </div>
    </div>
  );
}
