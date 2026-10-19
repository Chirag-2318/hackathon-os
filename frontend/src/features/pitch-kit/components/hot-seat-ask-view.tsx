import React from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface HotSeatAskViewProps {
  answerMode: 'THINK' | 'SPEAK' | 'TYPE';
  typeAnswer: string;
  onTypeAnswerChange: (val: string) => void;
  onReveal: () => void;
}

export function HotSeatAskView({
  answerMode,
  typeAnswer,
  onTypeAnswerChange,
  onReveal,
}: HotSeatAskViewProps) {
  return (
    <div className="space-y-4 pt-4">
      {answerMode === 'THINK' && (
        <div className="text-sm font-mono text-white/40 py-8">
          Say it out loud. Press Space or click Reveal when ready.
        </div>
      )}

      {answerMode === 'SPEAK' && (
        <div className="flex items-center gap-3 py-6 font-mono text-xs text-white/60">
          <Mic className="h-4 w-4 text-rose-500 animate-pulse" />
          <span>Recording voice answer... Speak clearly.</span>
        </div>
      )}

      {answerMode === 'TYPE' && (
        <Textarea
          placeholder="Type your response here..."
          value={typeAnswer}
          onChange={(e) => onTypeAnswerChange(e.target.value)}
          className="bg-white/5 border-white/20 text-[#F4F1EA] text-sm h-28 focus:border-white resize-none font-mono"
          autoFocus
        />
      )}

      <div>
        <Button
          size="lg"
          onClick={onReveal}
          className="bg-[#F4F1EA] text-[#070708] hover:bg-white font-mono text-xs px-6 h-10 tracking-wider uppercase font-semibold"
        >
          Reveal Answer (Space)
        </Button>
      </div>
    </div>
  );
}
