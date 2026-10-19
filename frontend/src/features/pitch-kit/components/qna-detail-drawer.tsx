import React, { useState, useEffect, useMemo } from 'react';
import { X, Play, Share2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  updateMyQnaAnswer,
  updateQnaMastery,
  type QnaItem,
  type QnaTeammateAnswer,
} from '../api/qna-api';
import { toast } from 'sonner';

interface QnaDetailDrawerProps {
  roomId: string;
  item: QnaItem | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onPracticeSingle: (item: QnaItem) => void;
}

export function QnaDetailDrawer({
  roomId,
  item,
  open,
  onClose,
  onUpdated,
  onPracticeSingle,
}: QnaDetailDrawerProps) {
  const [ownAnswer, setOwnAnswer] = useState('');
  const [shared, setShared] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [activeMastery, setActiveMastery] = useState<number>(0);

  useEffect(() => {
    if (item) {
      setOwnAnswer(item.myOwnAnswer || '');
      setShared(item.myShared || false);
      setActiveMastery(item.myMastery || 0);
    }
  }, [item]);

  const wordCount = useMemo(() => {
    if (!item?.answer) return 0;
    return item.answer.trim().split(/\s+/).filter(Boolean).length;
  }, [item?.answer]);

  const speakingTimeSec = useMemo(() => {
    if (wordCount === 0) return 0;
    return Math.max(1, Math.round((wordCount / 130) * 60));
  }, [wordCount]);

  if (!open || !item) return null;

  const handleSaveNote = async () => {
    try {
      setSavingNote(true);
      await updateMyQnaAnswer(roomId, item.hash, { ownAnswer, shared });
      toast.success('Your version saved');
      onUpdated();
    } catch {
      toast.error('Failed to save your version');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSetMastery = async (level: number) => {
    try {
      setActiveMastery(level);
      await updateQnaMastery(roomId, item.hash, level);
      onUpdated();
    } catch {
      toast.error('Failed to update mastery');
    }
  };

  const renderSmartProof = (proof: string) => {
    const tokens = proof.split(/(\s+)/);
    return tokens.map((tok, idx) => {
      const lower = tok.toLowerCase();
      if (lower.includes('deck') || lower.includes('slide')) {
        return (
          <a
            key={idx}
            href={`/app/room/${roomId}/deck`}
            className="text-foreground underline underline-offset-2 hover:text-primary font-mono inline-flex items-center gap-0.5"
          >
            {tok} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        );
      }
      if (lower.includes('demo')) {
        return (
          <a
            key={idx}
            href={`/app/room/${roomId}/pitch-kit?station=demo`}
            className="text-foreground underline underline-offset-2 hover:text-primary font-mono inline-flex items-center gap-0.5"
          >
            {tok} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        );
      }
      if (tok.endsWith('.md') || tok.endsWith('.MD')) {
        return (
          <a
            key={idx}
            href={`/app/room/${roomId}/docs?doc=${tok}`}
            className="text-foreground underline underline-offset-2 hover:text-primary font-mono inline-flex items-center gap-0.5"
          >
            {tok} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        );
      }
      if (tok.startsWith('http://') || tok.startsWith('https://')) {
        return (
          <a
            key={idx}
            href={tok}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-2 hover:text-primary font-mono inline-flex items-center gap-0.5"
          >
            {tok} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        );
      }
      return tok;
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span>{item.criterion || 'General'}</span>
          {item.category && <span>· {item.category}</span>}
          {item.source === 'AI' && <span className="uppercase text-[10px] text-muted-foreground">AI draft</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPracticeSingle(item)}
            className="text-xs font-mono h-8"
          >
            <Play className="h-3 w-3 mr-1 fill-current" />
            Practise this one
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Exchange: Judge */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            Judge
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-foreground leading-snug">
            {item.question}
          </h2>
        </div>

        {/* Exchange: Your answer */}
        {item.answer && (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span className="uppercase tracking-wider">Your answer</span>
              <span>
                {wordCount} words · about {speakingTimeSec}s to say
              </span>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-foreground font-normal">
              {item.answer}
            </p>
          </div>
        )}

        {/* Exchange: Judge pushes */}
        {item.followup && (
          <div className="space-y-2 border-l-2 border-border pl-4 py-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
              Judge pushes
            </span>
            <p className="text-sm sm:text-base italic text-foreground/90 font-serif">
              "{item.followup}"
            </p>
          </div>
        )}

        {/* Exchange: Your counter */}
        {item.counter && (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
              You (Counter)
            </span>
            <p className="text-sm sm:text-base leading-relaxed text-foreground font-normal">
              {item.counter}
            </p>
          </div>
        )}

        {/* Show or open line from Proof */}
        {item.proof && (
          <div className="border-t border-border/60 pt-4 text-xs font-mono text-muted-foreground space-y-1">
            <span className="uppercase tracking-wider text-[11px] block">Show or open</span>
            <div className="text-xs">{renderSmartProof(item.proof)}</div>
          </div>
        )}

        {/* Your version (editable private note with share toggle) */}
        <div className="border-t border-border/60 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Your version
            </span>
            <div className="flex items-center gap-2">
              <Switch
                id="share-switch"
                checked={shared}
                onCheckedChange={setShared}
              />
              <Label htmlFor="share-switch" className="text-xs font-mono cursor-pointer">
                Share with team
              </Label>
            </div>
          </div>

          <Textarea
            placeholder="Write your personal phrasing or notes..."
            value={ownAnswer}
            onChange={(e) => setOwnAnswer(e.target.value)}
            className="text-xs resize-none h-20"
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              disabled={savingNote}
              onClick={handleSaveNote}
              className="text-xs font-mono h-7"
            >
              {savingNote ? 'Saving...' : 'Save note'}
            </Button>
          </div>

          {/* Teammates' shared versions */}
          {item.sharedAnswers && item.sharedAnswers.length > 0 && (
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-mono text-muted-foreground block">
                Teammates' versions:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {item.sharedAnswers.map((tm) => (
                  <Popover key={tm.userId}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="rounded-full ring-1 ring-border hover:ring-primary transition-all focus:outline-none"
                        title={`@${tm.handle}'s version`}
                      >
                        <UserAvatar user={{ name: tm.userName, username: tm.handle }} size={24} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-3 space-y-1.5" align="start">
                      <div className="flex items-center gap-2 text-xs font-mono text-foreground font-medium">
                        <UserAvatar user={{ name: tm.userName, username: tm.handle }} size={16} />
                        @{tm.handle}
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {tm.ownAnswer || 'No notes added.'}
                      </p>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Mastery Ratings */}
      <div className="p-4 border-t border-border bg-card/40 flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground">Rating:</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeMastery === 1 ? 'default' : 'outline'}
            className={cn(
              'text-xs font-mono h-8 px-3',
              activeMastery === 1 && 'bg-rose-600 hover:bg-rose-700 text-white'
            )}
            onClick={() => handleSetMastery(1)}
          >
            Missed
          </Button>
          <Button
            size="sm"
            variant={activeMastery === 2 ? 'default' : 'outline'}
            className={cn(
              'text-xs font-mono h-8 px-3',
              activeMastery === 2 && 'bg-amber-600 hover:bg-amber-700 text-white'
            )}
            onClick={() => handleSetMastery(2)}
          >
            Shaky
          </Button>
          <Button
            size="sm"
            variant={activeMastery === 3 ? 'default' : 'outline'}
            className={cn(
              'text-xs font-mono h-8 px-3',
              activeMastery === 3 && 'bg-emerald-600 hover:bg-emerald-700 text-white'
            )}
            onClick={() => handleSetMastery(3)}
          >
            Solid
          </Button>
        </div>
      </div>
    </div>
  );
}
