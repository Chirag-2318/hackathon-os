import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export interface MvpJudgePrepProps {
  differentiation: string;
  breaksFirst: string;
  onUpdate: (updates: { differentiation?: string; breaksFirst?: string }) => void;
}

export function MvpJudgePrep({ differentiation, breaksFirst, onUpdate }: MvpJudgePrepProps) {
  const [diffText, setDiffText] = useState(differentiation);
  const [breaksText, setBreaksText] = useState(breaksFirst);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}`);
  };

  return (
    <div className="bg-card rounded-[24px] border border-border p-5 shadow-xs flex flex-col gap-4">
      <h3 className="text-base font-semibold text-foreground">
        Judge prep
      </h3>

      {/* Differentiation area */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-foreground">
            How is this different from the obvious version?
          </label>
          <button
            onClick={() => copyText(diffText, 'differentiation response')}
            className="text-muted-foreground hover:text-foreground p-1 rounded"
            title="Copy answer"
          >
            <Copy className="size-3.5" />
          </button>
        </div>
        <textarea
          value={diffText}
          onChange={(e) => setDiffText(e.target.value.slice(0, 240))}
          onBlur={() => onUpdate({ differentiation: diffText.trim() })}
          rows={2}
          placeholder="State your unique insight..."
          className="w-full text-xs bg-muted/40 p-2.5 rounded-xl border border-border focus:border-blue-500 focus:outline-none resize-none"
        />
        <div className="flex justify-end text-[10px] text-muted-foreground font-mono">
          {diffText.length}/240
        </div>
      </div>

      {/* What breaks first area */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-foreground">
            What breaks first?
          </label>
          <button
            onClick={() => copyText(breaksText, 'break response')}
            className="text-muted-foreground hover:text-foreground p-1 rounded"
            title="Copy answer"
          >
            <Copy className="size-3.5" />
          </button>
        </div>
        <textarea
          value={breaksText}
          onChange={(e) => setBreaksText(e.target.value.slice(0, 240))}
          onBlur={() => onUpdate({ breaksFirst: breaksText.trim() })}
          rows={2}
          placeholder="State your known vulnerability..."
          className="w-full text-xs bg-muted/40 p-2.5 rounded-xl border border-border focus:border-blue-500 focus:outline-none resize-none"
        />
        <div className="flex justify-end text-[10px] text-muted-foreground font-mono">
          {breaksText.length}/240
        </div>
      </div>
    </div>
  );
}
