import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAiAction } from '@/features/ai-gate';
import { aiGenerateMoreQna } from '../api/qna-api';
import { toast } from 'sonner';

interface QnaAiMorePopoverProps {
  roomId: string;
  roomAiAllowed: boolean;
  criteria: string[];
  onGenerated: () => void;
}

export function QnaAiMorePopover({
  roomId,
  roomAiAllowed,
  criteria,
  onGenerated,
}: QnaAiMorePopoverProps) {
  const [open, setOpen] = useState(false);
  const [persona, setPersona] = useState('SKEPTICAL_ENGINEER');
  const [criterion, setCriterion] = useState('');
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);

  const { guard, tooltip, isAvailable, handleAiError } = useAiAction({ aiAllowed: roomAiAllowed });

  const handleGenerate = guard(async () => {
    try {
      setLoading(true);
      const items = await aiGenerateMoreQna(roomId, {
        persona,
        criterion: criterion || undefined,
        count,
      });
      toast.success(`Generated ${items.length} AI draft questions`);
      onGenerated();
      setOpen(false);
    } catch (err: any) {
      handleAiError(err);
    } finally {
      setLoading(false);
    }
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-mono h-8"
          title={tooltip}
        >
          More questions with AI
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 space-y-4" align="end">
        <div className="space-y-1">
          <h4 className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">
            Generate AI Questions
          </h4>
          <p className="text-xs text-muted-foreground">
            Anticipate pushback grounded in your PRD, MVP, and rubric.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs font-mono">Judge Persona</Label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full mt-1 border border-input rounded-md bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-ring focus:outline-none font-mono"
            >
              <option value="SKEPTICAL_ENGINEER">Skeptical Engineer (Architecture/Tradeoffs)</option>
              <option value="BUSINESS">Business Judge (Market/Traction/Cost)</option>
              <option value="DOMAIN_EXPERT">Domain Expert (Implementation depth)</option>
              <option value="FRIENDLY_MENTOR">Friendly Mentor (Vision & Clarity)</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-mono">Target Criterion (Optional)</Label>
            <select
              value={criterion}
              onChange={(e) => setCriterion(e.target.value)}
              className="w-full mt-1 border border-input rounded-md bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-ring focus:outline-none font-mono"
            >
              <option value="">All / Balanced</option>
              {criteria.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono">Count</Label>
              <span className="text-xs font-mono text-muted-foreground">{count}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10))}
              className="w-full mt-1 accent-primary"
            />
          </div>
        </div>

        <Button
          size="sm"
          className="w-full text-xs font-mono"
          disabled={loading || !isAvailable}
          onClick={handleGenerate}
        >
          {loading ? 'Generating...' : `Generate ${count} questions`}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
