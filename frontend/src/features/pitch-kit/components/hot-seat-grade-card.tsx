import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAiAction } from '@/features/ai-gate';
import { aiGradeQnaAnswer, type AiGradeResponse } from '../api/qna-api';
import { cn } from '@/lib/utils';

interface HotSeatGradeCardProps {
  roomId: string;
  hash: string;
  answerText: string;
  roomAiAllowed: boolean;
}

export function HotSeatGradeCard({
  roomId,
  hash,
  answerText,
  roomAiAllowed,
}: HotSeatGradeCardProps) {
  const [grade, setGrade] = useState<AiGradeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { guard, tooltip, isAvailable, handleAiError } = useAiAction({ aiAllowed: roomAiAllowed });

  const handleGrade = guard(async () => {
    try {
      setLoading(true);
      const res = await aiGradeQnaAnswer(roomId, hash, answerText);
      setGrade(res);
    } catch (err: any) {
      handleAiError(err);
    } finally {
      setLoading(false);
    }
  });

  if (!grade) {
    return (
      <div className="pt-2">
        <Button
          size="sm"
          variant="outline"
          disabled={loading || !isAvailable || !answerText.trim()}
          onClick={handleGrade}
          className="text-xs font-mono h-7 border-white/20 text-[#F4F1EA]/80 hover:bg-white/10 hover:text-white"
          title={!answerText.trim() ? 'Provide or speak an answer first' : tooltip}
        >
          {loading ? 'Grading answer...' : 'Grade my answer (AI)'}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/15 bg-white/5 p-4 space-y-3 text-left">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
          AI Judge Verdict
        </span>
        <span className={cn(
          'text-xs font-mono font-medium px-2 py-0.5 rounded',
          grade.score >= 8 ? 'bg-emerald-500/20 text-emerald-400' : grade.score >= 5 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
        )}>
          Score: {grade.score}/10
        </span>
      </div>

      <p className="text-xs text-[#F4F1EA] font-normal leading-relaxed">
        {grade.verdict}
      </p>

      {grade.missed && grade.missed.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase text-rose-400 block">Missed points:</span>
          <ul className="text-xs text-white/70 list-disc list-inside space-y-0.5">
            {grade.missed.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {grade.better && (
        <div className="border-t border-white/10 pt-2">
          <span className="text-[10px] font-mono uppercase text-white/50 block">Better one-liner:</span>
          <p className="text-xs text-white/90 italic font-serif mt-0.5">
            "{grade.better}"
          </p>
        </div>
      )}
    </div>
  );
}
