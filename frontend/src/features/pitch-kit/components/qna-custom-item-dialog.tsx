import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createCustomQnaItem, type QnaItem } from '../api/qna-api';
import { toast } from 'sonner';

interface QnaCustomItemDialogProps {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  criteria: string[];
}

export function QnaCustomItemDialog({
  roomId,
  open,
  onOpenChange,
  onCreated,
  criteria,
}: QnaCustomItemDialogProps) {
  const [kind, setKind] = useState<'QUESTION' | 'CODE' | 'TRUTH' | 'ASK'>('QUESTION');
  const [category, setCategory] = useState('');
  const [criterion, setCriterion] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [followup, setFollowup] = useState('');
  const [counter, setCounter] = useState('');
  const [proof, setProof] = useState('');
  const [ownerHandle, setOwnerHandle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      toast.error('Question is required');
      return;
    }

    try {
      setSaving(true);
      await createCustomQnaItem(roomId, {
        kind,
        category: category.trim() || 'General',
        criterion: criterion || null,
        question: question.trim(),
        answer: answer.trim() || null,
        followup: followup.trim() || null,
        counter: counter.trim() || null,
        proof: proof.trim() || null,
        ownerHandle: ownerHandle.trim().replace(/^@/, '') || null,
      });
      toast.success('Question added');
      onCreated();
      onOpenChange(false);
      // Reset form
      setQuestion('');
      setAnswer('');
      setFollowup('');
      setCounter('');
      setProof('');
      setOwnerHandle('');
      setCategory('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-normal">
            Add custom defense question
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-mono">Kind</Label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as any)}
                className="w-full mt-1 border border-input rounded-md bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-ring focus:outline-none font-mono"
              >
                <option value="QUESTION">General Question</option>
                <option value="CODE">Code Defense Drill</option>
                <option value="TRUTH">Hard Truth</option>
                <option value="ASK">Question to Ask Judges</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-mono">Rubric Criterion</Label>
              <select
                value={criterion}
                onChange={(e) => setCriterion(e.target.value)}
                className="w-full mt-1 border border-input rounded-md bg-background px-3 py-1.5 text-xs focus:ring-1 focus:ring-ring focus:outline-none font-mono"
              >
                <option value="">None / Unmapped</option>
                {criteria.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-mono">Category</Label>
              <Input
                placeholder="e.g. Architecture"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-mono">Owner Handle</Label>
              <Input
                placeholder="e.g. @sam"
                value={ownerHandle}
                onChange={(e) => setOwnerHandle(e.target.value)}
                className="text-xs mt-1 font-mono"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-mono">Question</Label>
            <Input
              placeholder="What will judges ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="text-xs mt-1"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-mono">Recommended Answer</Label>
            <Textarea
              placeholder="Key answer points..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="text-xs mt-1 h-20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-mono">Judge Push / Follow-up</Label>
              <Input
                placeholder="Where judges push..."
                value={followup}
                onChange={(e) => setFollowup(e.target.value)}
                className="text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-mono">Counter Answer</Label>
              <Input
                placeholder="Your direct counter..."
                value={counter}
                onChange={(e) => setCounter(e.target.value)}
                className="text-xs mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-mono">Proof / Artifact</Label>
            <Input
              placeholder="e.g. See Deck slide 4 or ARCHITECTURE.md"
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              className="text-xs mt-1"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-mono"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="text-xs font-mono"
            >
              {saving ? 'Adding...' : 'Save Question'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
