import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { planService, briefService } from '@/services';
import type { PlanContextSummary } from '@/services/types';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Lightbulb, Sparkles, Upload, Loader2, ArrowRight, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeWePlanProps {
  roomId: string;
  contextSummary?: PlanContextSummary;
  initialNotes?: string;
  onPlanStarted: () => void;
}

export function BeforeWePlan({ roomId, contextSummary, initialNotes = '', onPlanStarted }: BeforeWePlanProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(initialNotes);
  const [isStarting, setIsStarting] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateTab, setUpdateTab] = useState<'text' | 'file'>('text');
  const [pastedText, setPastedText] = useState('');
  const [isUpdatingBrief, setIsUpdatingBrief] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNotes(initialNotes || '');
  }, [initialNotes]);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await planService.updatePlanNotes(roomId, val);
      } catch (e: any) {
        toast.error('Failed to save planner notes');
      }
    }, 600);
  };

  const handleStartPlanning = async () => {
    setIsStarting(true);
    try {
      if (notes.trim()) {
        await planService.updatePlanNotes(roomId, notes.trim());
      }
      await planService.startPlan(roomId);
      toast.success('Planning phase started!');
      queryClient.invalidateQueries({ queryKey: ['plan', roomId] });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      onPlanStarted();
    } catch (e: any) {
      toast.error(e.message || 'Failed to start planning');
      setIsStarting(false);
    }
  };

  const handleUpdateText = async () => {
    const trimmed = pastedText.trim();
    if (trimmed.length < 50) {
      setUpdateError('Text must be at least 50 characters.');
      return;
    }
    setIsUpdatingBrief(true);
    setUpdateError('');
    try {
      await briefService.setTextSource(roomId, trimmed);
      toast.success('Brief updated');
      queryClient.invalidateQueries({ queryKey: ['plan', roomId] });
      queryClient.invalidateQueries({ queryKey: ['brief', roomId] });
      setUpdateDialogOpen(false);
      setPastedText('');
    } catch (e: any) {
      setUpdateError(e.message || 'Failed to update brief');
    } finally {
      setIsUpdatingBrief(false);
    }
  };

  const handleUpdateFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const file = files[0];
    const isDoc = file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.txt');

    setIsUpdatingBrief(true);
    setUpdateError('');
    try {
      if (isDoc) {
        await briefService.setPdfSource(roomId, file);
      } else {
        await briefService.setImagesSource(roomId, files);
      }
      toast.success('Brief file updated');
      queryClient.invalidateQueries({ queryKey: ['plan', roomId] });
      queryClient.invalidateQueries({ queryKey: ['brief', roomId] });
      setUpdateDialogOpen(false);
    } catch (e: any) {
      setUpdateError(e.message || 'Failed to upload brief files');
    } finally {
      setIsUpdatingBrief(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold w-fit">
          <Sparkles className="size-3.5" />
          <span>Plan Gate</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Before we plan</h1>
        <p className="text-sm text-muted-foreground">
          Confirm the project context and feed the AI planner any constraints before unlocking the 5-step blueprint.
        </p>
      </div>

      {/* Grid of Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Brief Statement */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="size-4 text-primary" /> Brief Statement
                </span>
                {!contextSummary?.briefConfirmed && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    unconfirmed
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUpdateDialogOpen(true)}
                className="h-7 text-xs gap-1"
              >
                <Edit3 className="size-3" /> Update
              </Button>
            </div>
            <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto rounded-lg p-3 bg-muted/30">
              {contextSummary?.briefStatement?.trim() || 'No brief statement confirmed yet.'}
            </p>
          </div>
          {contextSummary?.eventHours ? (
            <div className="text-[11px] text-muted-foreground">
              Event duration: <strong className="text-foreground">{contextSummary.eventHours} hours</strong>
            </div>
          ) : null}
        </div>

        {/* Card 2: Approved Ideas */}
        <div className="p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lightbulb className="size-4 text-amber-500" /> Approved Ideas ({contextSummary?.approvedIdeas?.length || 0})
            </span>
          </div>
          <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto">
            {contextSummary?.approvedIdeas && contextSummary.approvedIdeas.length > 0 ? (
              contextSummary.approvedIdeas.map((idea) => (
                <div key={idea.id} className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-foreground">{idea.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    by <span className="font-medium text-foreground">{idea.authorName || 'Team member'}</span>
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No approved ideas found for this room.</p>
            )}
          </div>
          {contextSummary?.memberSkills && contextSummary.memberSkills.length > 0 && (
            <div className="pt-2 border-t border-border/60">
              <span className="text-[11px] text-muted-foreground block mb-1.5">Team Skills:</span>
              <div className="flex flex-wrap gap-1">
                {contextSummary.memberSkills.map((s, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px] py-0 px-2">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Additional Notes */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-xs flex flex-col gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Anything else the AI should know about this project?
        </label>
        <Textarea
          rows={4}
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="e.g. team strengths, tech choices already made, off-limits ideas, time constraints."
          className="text-xs resize-none"
        />
        <span className="text-[11px] text-muted-foreground">
          Autosaves automatically. This context will be injected into all 5 plan steps.
        </span>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          onClick={handleStartPlanning}
          disabled={isStarting}
          className="px-8 font-semibold text-sm gap-2 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {isStarting ? <Loader2 className="size-4 animate-spin" /> : null}
          Start planning
          <ArrowRight className="size-4" />
        </Button>
      </div>

      {/* Update Brief Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Update Hackathon Brief</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Paste replacement brief text or upload a new PDF/image file.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 border-b border-border pb-2">
            <Button
              type="button"
              variant={updateTab === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setUpdateTab('text')}
              className="text-xs h-8"
            >
              Paste Text
            </Button>
            <Button
              type="button"
              variant={updateTab === 'file' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setUpdateTab('file')}
              className="text-xs h-8"
            >
              Upload File
            </Button>
          </div>

          {updateTab === 'text' ? (
            <div className="flex flex-col gap-3">
              <Textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the updated brief statement text (min 50 chars)..."
                className="text-xs font-mono"
              />
              {updateError && <span className="text-xs text-red-500">{updateError}</span>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setUpdateDialogOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpdateText}
                  disabled={isUpdatingBrief || pastedText.trim().length < 50}
                  className="text-xs"
                >
                  {isUpdatingBrief ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                  Save Text
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/30">
                <input
                  type="file"
                  accept=".pdf,.md,.txt,image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleUpdateFiles}
                  disabled={isUpdatingBrief}
                  className="hidden"
                />
                <Upload className="size-6 text-muted-foreground mb-2" />
                <span className="text-xs font-semibold text-foreground">Select .md, .txt, .pdf or images</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">Max 10MB per file</span>
              </label>
              {updateError && <span className="text-xs text-red-500">{updateError}</span>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
