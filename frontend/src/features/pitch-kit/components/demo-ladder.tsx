import React, { useState } from 'react';
import type { DemoLadderRung } from '../api/pitch-kit-api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DemoLadderProps {
  ladder: DemoLadderRung[];
  onUpdateSayText: (rung: string, sayText: string) => Promise<void>;
  onMarkAsTested: (rung: string) => Promise<void>;
}

function formatTestedAgo(dateStr: string | null, userName: string | null): string {
  if (!dateStr) return '';
  const who = userName || '@teammate';
  try {
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return `Tested by ${who} · just now`;
    const min = Math.floor(diffSec / 60);
    if (min < 60) return `Tested by ${who} · ${min}m ago`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Tested by ${who} · ${h}h ago`;
    const d = Math.floor(h / 24);
    return `Tested by ${who} · ${d}d ago`;
  } catch {
    return `Tested by ${who}`;
  }
}

export function DemoLadder({ ladder, onUpdateSayText, onMarkAsTested }: DemoLadderProps) {
  const [editingRung, setEditingRung] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [testingRung, setTestingRung] = useState<string | null>(null);

  const handleStartEdit = (rung: string, currentText: string) => {
    setEditingRung(rung);
    setEditValues((prev) => ({ ...prev, [rung]: currentText }));
  };

  const handleSaveSay = async (rung: string) => {
    const val = (editValues[rung] || '').trim().slice(0, 160);
    setEditingRung(null);
    try {
      await onUpdateSayText(rung, val);
    } catch (err: any) {
      toast.error('Failed to update line');
    }
  };

  const handleTest = async (rung: string) => {
    setTestingRung(rung);
    try {
      await onMarkAsTested(rung);
      toast.success(`Rung ${rung} marked as tested`);
    } catch (err: any) {
      toast.error('Failed to mark as tested');
    } finally {
      setTestingRung(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-border/60 pb-2">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
          If it breaks
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Four-rung failure ladder for stage confidence
        </p>
      </div>

      {/* Ladder connected by thin vertical line */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[1px] before:bg-border/80">
        {ladder.map((item) => {
          const isEditing = editingRung === item.rung;
          const currentSay = isEditing ? editValues[item.rung] ?? item.sayText : item.sayText;
          const testedLine = formatTestedAgo(item.testedAt, item.testedByName);
          const isReady = item.status === 'READY';
          const isUntested = item.status === 'UNTESTED';

          return (
            <div key={item.rung} className="relative space-y-1.5 text-left">
              {/* Rung node dot on vertical line */}
              <div
                className={cn(
                  'absolute -left-[24px] top-1 w-5 h-5 rounded-full border flex items-center justify-center font-mono text-[10px] font-semibold bg-background transition-colors',
                  isReady
                    ? 'border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400'
                    : isUntested
                    ? 'border-amber-600 dark:border-amber-400 text-amber-600 dark:text-amber-400'
                    : 'border-border text-muted-foreground'
                )}
              >
                {item.rung}
              </div>

              {/* Rung title + status */}
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {item.name}
                </span>

                <span
                  className={cn(
                    'font-mono text-xs tabular-nums',
                    isReady
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isUntested
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.status === 'READY' ? 'Ready' : item.status === 'UNTESTED' ? 'Untested' : 'Missing'}
                </span>
              </div>

              {/* What we say line */}
              <div className="space-y-1">
                {isEditing ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      maxLength={160}
                      value={currentSay}
                      onChange={(e) => setEditValues((p) => ({ ...p, [item.rung]: e.target.value }))}
                      onBlur={() => handleSaveSay(item.rung)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveSay(item.rung);
                        if (e.key === 'Escape') setEditingRung(null);
                      }}
                      autoFocus
                      className="w-full text-xs font-mono px-2 py-1 border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                      <span>Press Enter to save</span>
                      <span>{currentSay.length}/160</span>
                    </div>
                  </div>
                ) : (
                  <p
                    onClick={() => handleStartEdit(item.rung, item.sayText)}
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors italic leading-relaxed py-0.5 border border-transparent hover:border-dashed hover:border-border/60 rounded px-1 -mx-1"
                    title="Click to edit what you say"
                  >
                    &ldquo;{item.sayText || 'Click to set what we say if this fails...'}&rdquo;
                  </p>
                )}
              </div>

              {/* Footer actions: Tested stamp or Mark as tested */}
              <div className="flex items-center justify-between text-[11px] font-mono pt-0.5">
                <span className="text-muted-foreground/80 tabular-nums">
                  {testedLine || 'Not tested yet'}
                </span>

                <button
                  type="button"
                  onClick={() => handleTest(item.rung)}
                  disabled={testingRung === item.rung}
                  className="text-accent hover:underline focus-visible:outline-none disabled:opacity-50"
                >
                  {testingRung === item.rung ? 'Stamping...' : 'Mark as tested'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
