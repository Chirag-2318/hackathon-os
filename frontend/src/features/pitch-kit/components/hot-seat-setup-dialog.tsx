import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAiAction } from '@/features/ai-gate';
import { cn } from '@/lib/utils';
import type { StartSessionRequest } from '../api/qna-api';

interface HotSeatSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criteria: string[];
  roomAiAllowed: boolean;
  initialFocus?: StartSessionRequest['focus'];
  initialCriterion?: string;
  initialSize?: number;
  onLaunch: (config: StartSessionRequest) => void;
}

let lastConfig: StartSessionRequest = {
  size: 5,
  focus: 'WEIGHTED',
  pressure: true,
  answerMode: 'THINK',
  timerSec: 45,
  persona: 'SKEPTICAL_ENGINEER',
};

export function HotSeatSetupDialog({
  open,
  onOpenChange,
  criteria,
  roomAiAllowed,
  initialFocus,
  initialCriterion,
  initialSize,
  onLaunch,
}: HotSeatSetupDialogProps) {
  const { hasKey, isAvailable, tooltip } = useAiAction({ aiAllowed: roomAiAllowed });

  const [size, setSize] = useState<number>(initialSize || lastConfig.size || 5);
  const [focus, setFocus] = useState<StartSessionRequest['focus']>(initialFocus || lastConfig.focus || 'WEIGHTED');
  const [criterion, setCriterion] = useState<string>(initialCriterion || lastConfig.criterion || criteria[0] || '');
  const [pressure, setPressure] = useState<boolean>(lastConfig.pressure ?? true);
  const [answerMode, setAnswerMode] = useState<StartSessionRequest['answerMode']>(lastConfig.answerMode || 'THINK');
  const [timerSec, setTimerSec] = useState<number>(lastConfig.timerSec ?? 45);
  const [persona, setPersona] = useState<StartSessionRequest['persona']>(lastConfig.persona || 'SKEPTICAL_ENGINEER');
  const [micPermission, setMicPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (initialFocus) setFocus(initialFocus);
    if (initialCriterion) setCriterion(initialCriterion);
    if (initialSize) setSize(initialSize);
  }, [initialFocus, initialCriterion, initialSize]);

  useEffect(() => {
    if (answerMode === 'SPEAK') {
      navigator.mediaDevices
        ?.getUserMedia({ audio: true })
        .then((s) => {
          s.getTracks().forEach((t) => t.stop());
          setMicPermission(true);
        })
        .catch(() => {
          setMicPermission(false);
        });
    }
  }, [answerMode]);

  const canUseVoice = hasKey && isAvailable && micPermission !== false;

  const handleStart = () => {
    const config: StartSessionRequest = {
      size,
      focus,
      criterion: focus === 'CRITERION' ? criterion : undefined,
      pressure,
      answerMode: answerMode === 'SPEAK' && !canUseVoice ? 'THINK' : answerMode,
      timerSec,
      persona,
    };
    lastConfig = config;
    onLaunch(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">
            Enter the hot seat
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-mono">
            High-pressure defence drills with judges who push back.
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          {/* Size */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Session Size</Label>
            <div className="grid grid-cols-3 gap-2 font-mono">
              {[5, 10, 20].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={cn(
                    'py-1.5 border rounded-md transition-colors',
                    size === s ? 'border-primary bg-primary/10 text-foreground font-medium' : 'border-border text-muted-foreground hover:bg-muted/40'
                  )}
                >
                  {s} drills
                </button>
              ))}
            </div>
          </div>

          {/* Focus */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Drill Focus</Label>
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value as any)}
              className="w-full border border-input rounded-md bg-background px-3 py-1.5 font-mono text-xs"
            >
              <option value="WEIGHTED">Weighted (Prioritize weak & high-rubric)</option>
              <option value="WEAKEST">Weakest first (Lowest mastery)</option>
              <option value="ALL">All questions (Balanced)</option>
              <option value="MINE">My owned questions only</option>
              <option value="CRITERION">Specific criterion...</option>
            </select>
            {focus === 'CRITERION' && (
              <select
                value={criterion}
                onChange={(e) => setCriterion(e.target.value)}
                className="w-full mt-2 border border-input rounded-md bg-background px-3 py-1.5 font-mono text-xs"
              >
                {criteria.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Answer Mode */}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Answer Mode</Label>
            <div className="grid grid-cols-3 gap-2 font-mono">
              {(['THINK', 'SPEAK', 'TYPE'] as const).map((m) => {
                const disabled = m === 'SPEAK' && (!hasKey || !isAvailable);
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => setAnswerMode(m)}
                    title={disabled ? (tooltip || 'Voice answer requires Groq API key in Settings') : undefined}
                    className={cn(
                      'py-1.5 border rounded-md transition-colors flex flex-col items-center justify-center',
                      answerMode === m ? 'border-primary bg-primary/10 text-foreground font-medium' : 'border-border text-muted-foreground hover:bg-muted/40',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span>{m === 'THINK' ? 'Think' : m === 'SPEAK' ? 'Speak' : 'Type'}</span>
                  </button>
                );
              })}
            </div>
            {answerMode === 'SPEAK' && !canUseVoice && (
              <p className="text-[11px] text-amber-500 font-mono mt-1">
                {!hasKey ? 'Bring-your-own Groq key required for voice transcription.' : 'Microphone permission needed.'}
              </p>
            )}
          </div>

          {/* Timer & Pressure */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Timer</Label>
              <select
                value={timerSec}
                onChange={(e) => setTimerSec(parseInt(e.target.value, 10))}
                className="w-full border border-input rounded-md bg-background px-3 py-1.5 font-mono text-xs"
              >
                <option value={0}>Untimed (Relaxed)</option>
                <option value={30}>30 seconds (Speed)</option>
                <option value={45}>45 seconds (Standard)</option>
                <option value={60}>60 seconds (Deep)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Judge Persona</Label>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value as any)}
                className="w-full border border-input rounded-md bg-background px-3 py-1.5 font-mono text-xs"
              >
                <option value="SKEPTICAL_ENGINEER">Skeptical Engineer</option>
                <option value="BUSINESS">Business Judge</option>
                <option value="DOMAIN_EXPERT">Domain Expert</option>
                <option value="FRIENDLY_MENTOR">Friendly Mentor</option>
              </select>
            </div>
          </div>

          {/* Pressure Switch */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="space-y-0.5">
              <Label htmlFor="pressure-mode" className="text-xs font-mono font-medium">Pressure Mode</Label>
              <p className="text-[11px] text-muted-foreground">Auto-reveals judge follow-up after your response.</p>
            </div>
            <Switch
              id="pressure-mode"
              checked={pressure}
              onCheckedChange={setPressure}
            />
          </div>
        </div>

        <DialogFooter className="pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-mono"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleStart}
            className="text-xs font-mono px-4"
          >
            Start Drill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
