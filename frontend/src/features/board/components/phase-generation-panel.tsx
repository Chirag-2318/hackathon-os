import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Copy, Check, ExternalLink, Download, Upload, Sparkles,
  AlertCircle, AlertTriangle, FileText, CheckCircle2, Loader2, ArrowRight, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { phaseService, type PhaseSummary, type PhaseTaskPromptResponse, type PhaseTaskImportSummary } from '@/services/phaseService';
import { PhaseGuideModal } from './phase-guide-modal';
import { planService } from '@/services/planService';
import { ideaService } from '@/services/ideaService';
import { playSound } from '@/shared/sound/sound-effects';
import { AiGate, useAiAction } from '@/features/ai-gate';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { apiFetch } from '@/api/client';

export interface PhaseGenerationPanelProps {
  roomId: string;
  phase: PhaseSummary;
  isLeader: boolean;
  mode?: 'FRESH' | 'APPEND';
  onImportSuccess: (summary: PhaseTaskImportSummary) => void;
  onCancel?: () => void;
}

export function PhaseGenerationPanel({
  roomId,
  phase,
  isLeader,
  mode = 'FRESH',
  onImportSuccess,
  onCancel,
}: PhaseGenerationPanelProps) {
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.id ? String(currentUser.id) : '';

  const [promptData, setPromptData] = useState<PhaseTaskPromptResponse | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Auto-trigger Phase Guide Modal only the first time the user ever sees a phase generation panel, in any room
  useEffect(() => {
    if (!userId) return;
    const hasSeenHotspot = Boolean(currentUser?.hotspotsSeen?.includes('phase_guide_v1'));
    const hasSeenLocal = typeof window !== 'undefined' ? Boolean(localStorage.getItem(`phase_guide_done_${userId}`)) : false;

    if (!hasSeenHotspot && !hasSeenLocal) {
      const timer = setTimeout(() => {
        setIsGuideOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [userId, currentUser?.hotspotsSeen]);

  const handleCloseGuide = () => {
    setIsGuideOpen(false);
    if (userId) {
      try {
        localStorage.setItem(`phase_guide_done_${userId}`, 'true');
      } catch {}
      apiFetch('/api/v1/users/me/hotspots', {
        method: 'POST',
        body: JSON.stringify({ key: 'phase_guide_v1' }),
      }).catch(() => null);
    }
  };

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [validationResult, setValidationResult] = useState<PhaseTaskImportSummary | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successSummary, setSuccessSummary] = useState<PhaseTaskImportSummary | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load prompt data only when phase key is present
  const fetchPrompt = React.useCallback(() => {
    if (!roomId || !phase?.key) return;
    setLoadingPrompt(true);
    setPromptError(null);
    phaseService.getPhaseTaskPrompt(roomId, phase.key, mode)
      .then((data) => {
        setPromptData(data);
        setLoadingPrompt(false);
      })
      .catch((err) => {
        console.error('Failed to load phase prompt:', err);
        setPromptError(err?.message || 'Failed to load phase prompt');
        setLoadingPrompt(false);
      });
  }, [roomId, phase?.key, mode]);

  useEffect(() => {
    fetchPrompt();
  }, [fetchPrompt]);

  const handleCopyPrompt = async () => {
    if (!promptData?.prompt) return;
    try {
      await navigator.clipboard.writeText(promptData.prompt);
      playSound('copy');
      setCopied(true);
      toast.success('Prompt copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy prompt');
    }
  };

  const handleDownloadContextPack = () => {
    const url = phaseService.getContextPackUrl(roomId);
    window.open(url, '_blank');
  };

  const handleDownloadIdeas = () => {
    ideaService.exportIdeasMarkdown(roomId).catch(() => {
      toast.error('Failed to export ideas.md');
    });
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLeader) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectFile = (file: File) => {
    if (file.size > 400 * 1024) {
      toast.error('File size exceeds 400 KB limit');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'md' && ext !== 'markdown' && ext !== 'txt') {
      toast.error('Please upload a .md, .markdown, or .txt file');
      return;
    }
    setSelectedFile(file);
    setValidationResult(null);
    setValidationError(null);
  };

  const handleValidate = async (confirmRegenerate = false) => {
    if (!selectedFile) return;
    setIsValidating(true);
    setValidationError(null);
    try {
      const summary = await phaseService.validateAndImportTasks(
        roomId,
        phase.key,
        [selectedFile],
        mode,
        confirmRegenerate
      );
      if (summary.ok && !summary.needsConfirmation) {
        playSound('success');
        setSuccessSummary(summary);
        toast.success(`Imported ${summary.tasksCreated} tasks for ${phase.key}`);
      } else {
        setValidationResult(summary);
      }
    } catch (err: any) {
      const msg = err?.message || err?.details?.message || (err?.code ? `The server returned an error (code ${err.code}, request ${err.requestId || 'unknown'})` : 'The server returned an error');
      setValidationError(msg);
      if (err?.code === 'TASKS_ALREADY_STARTED') {
        toast.error('Tasks in this phase have already started and cannot be regenerated.');
      } else if (err?.code === 'PHASE_TASKS_EXIST') {
        toast.error('Tasks already exist for this phase.');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const { handleAiError } = useAiAction();

  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    setValidationError(null);
    try {
      const res = await phaseService.generatePhaseTasks(roomId, phase.key);
      if (res?.content) {
        const virtualFile = new File([res.content], `TASKS_${phase.key}.md`, { type: 'text/markdown' });
        setSelectedFile(virtualFile);
        // Automatically validate the generated virtual file
        setIsValidating(true);
        const summary = await phaseService.validateAndImportTasks(
          roomId,
          phase.key,
          [virtualFile],
          mode,
          false
        );
        if (summary.ok) {
          playSound('success');
          setSuccessSummary(summary);
          toast.success(`Generated and imported ${summary.tasksCreated} tasks for ${phase.key}`);
        } else {
          setValidationResult(summary);
        }
      }
    } catch (err: any) {
      handleAiError(err);
      setValidationError(err?.message || 'AI task generation failed');
    } finally {
      setIsGeneratingAi(false);
      setIsValidating(false);
    }
  };

  // Parse deliverables into a short list
  const deliverablesList = React.useMemo(() => {
    if (!phase.deliverables) return [];
    return phase.deliverables
      .split('\n')
      .map(d => d.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);
  }, [phase.deliverables]);

  const ownersList = React.useMemo(() => {
    if (!phase.owners) return [];
    try {
      const parsed = JSON.parse(phase.owners);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return phase.owners.split(',').map(o => o.trim()).filter(Boolean);
  }, [phase.owners]);

  // Successful import state
  if (successSummary) {
    return (
      <div className="w-full max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-card border border-border flex flex-col items-center text-center gap-6 shadow-sm">
        <div className="size-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="size-8" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-display font-medium text-foreground">
            Tasks ready for {phase.key}
          </h2>
          <p className="text-sm font-mono text-muted-foreground">
            {successSummary.tasksCreated} tasks · {successSummary.teamMemberCount} people · {Math.round(successSummary.totalHours)} hours
          </p>
        </div>

        {successSummary.uncoveredRequirements && successSummary.uncoveredRequirements.length > 0 && (
          <div className="w-full text-left p-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground flex flex-col gap-1.5">
            <span className="font-semibold text-foreground">Requirements to be covered in later phases:</span>
            <ul className="list-disc list-inside">
              {successSummary.uncoveredRequirements.map(req => (
                <li key={req} className="font-mono">{req}</li>
              ))}
            </ul>
          </div>
        )}

        <Button
          onClick={() => onImportSuccess(successSummary)}
          className="h-10 px-6 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <span>View board</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full pt-1 pb-4 flex flex-col lg:flex-row gap-6 items-start">
      {/* Left: Phase Summary */}
      <div className="w-full lg:w-[380px] shrink-0 rounded-2xl bg-card border border-border p-6 flex flex-col gap-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs font-semibold text-muted-foreground uppercase">
              Phase {phase.key}
            </span>
            <h2 className="text-xl font-display font-medium text-foreground">
              {phase.name}
            </h2>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-muted border border-border/60 text-muted-foreground">
            {phase.window ? `${phase.window.startHour}h – ${phase.window.endHour}h` : 'Sprint'}
          </span>
        </div>

        {phase.goal && (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Goal
            </span>
            <p className="text-xs text-foreground/90 leading-relaxed">
              {phase.goal}
            </p>
          </div>
        )}

        {phase.exitCheckpoint && (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Exit Checkpoint
            </span>
            <p className="text-xs text-foreground/90 leading-relaxed">
              {phase.exitCheckpoint}
            </p>
          </div>
        )}

        {ownersList.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Owners
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ownersList.map(owner => (
                <span key={owner} className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-mono text-foreground border border-border/40">
                  {owner}
                </span>
              ))}
            </div>
          </div>
        )}

        {deliverablesList.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Deliverables
            </span>
            <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
              {deliverablesList.map((del, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 shrink-0">•</span>
                  <span className="text-foreground/90">{del}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <button
            onClick={() => setIsGuideOpen(true)}
            className="hover:text-foreground underline underline-offset-4 cursor-pointer"
          >
            How this works
          </button>
        </div>
      </div>

      {/* Right: Generation / Import Loop */}
      <div className="flex-1 w-full rounded-2xl bg-card border border-border p-6 flex flex-col gap-6 shadow-xs">
        {!isLeader ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Sparkles className="size-6" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Waiting for the leader to generate the tasks.
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Your room leader will assemble the {phase.key} prompt, break down deliverables into board tasks, and import them here.
            </p>
          </div>
        ) : (
          <>
            {/* Header / Mode Indicator */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {mode === 'APPEND' ? `Add missing tasks for ${phase.key}` : `Generate tasks for ${phase.key}`}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Follow the prompt bridge loop to generate and import tasks for this phase.
                </p>
              </div>

              {promptData?.charCount && (
                <span className="font-mono text-xs text-muted-foreground">
                  {promptData.charCount.toLocaleString()} chars
                </span>
              )}
            </div>

            {/* Prompt Box */}
            <div className="relative rounded-xl border border-border bg-muted/30 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  1. Copy prompt & context pack
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://claude.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Claude <ExternalLink className="size-3" />
                  </a>
                  <span className="text-border">•</span>
                  <a
                    href="https://chatgpt.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ChatGPT <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>

              {loadingPrompt ? (
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : promptError || !promptData?.prompt ? (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs flex items-center justify-between">
                  <span className="text-destructive font-medium">{promptError || 'Failed to load phase prompt'}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchPrompt}
                    className="h-7 px-2.5 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="size-3" />
                    <span>Retry</span>
                  </Button>
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto text-xs font-mono text-muted-foreground whitespace-pre-wrap rounded-lg bg-background/60 p-3 border border-border/40">
                  {promptData.prompt}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <Button
                  onClick={handleCopyPrompt}
                  className="h-8 px-3.5 rounded-full bg-primary text-primary-foreground font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy prompt'}</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleDownloadContextPack}
                    variant="outline"
                    className="h-8 px-3 rounded-full text-xs font-medium border-border hover:bg-muted cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="size-3.5" />
                    <span>Download project-context.md</span>
                  </Button>
                  <Button
                    onClick={handleDownloadIdeas}
                    variant="ghost"
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    ideas.md
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/80 italic">
                Attach this file to your AI chat along with the copied prompt.
              </p>
            </div>

            {/* Upload Zone & Actions */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                2. Upload & Validate TASKS_{phase.key}.md
              </span>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center',
                  selectedFile
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/80 hover:border-primary/40 bg-muted/20 hover:bg-muted/40'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.markdown,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleSelectFile(e.target.files[0]);
                    }
                  }}
                />
                <Upload className="size-6 text-muted-foreground" />
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB · Click or drop to replace
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xs font-medium text-foreground">
                      Drop TASKS_{phase.key}.md here or click to browse
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Accepts .md, .markdown, .txt up to 400 KB
                    </span>
                  </div>
                )}
              </div>

              {/* Validation Issues / Warnings / Confirmation Panel */}
              {validationResult && (!validationResult.ok || validationResult.needsConfirmation) && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between gap-2 text-destructive font-semibold">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>
                        {validationResult.needsConfirmation
                          ? 'Existing tasks detected in this phase'
                          : 'Validation found issues'}
                      </span>
                    </div>
                    {/* Copy Diagnostics Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const payload = JSON.stringify(
                          validationResult.diagnostics || {
                            requestId: validationResult.requestId,
                            issues: validationResult.issues,
                          },
                          null,
                          2
                        );
                        navigator.clipboard.writeText(payload);
                        toast.success('Copied diagnostics to clipboard');
                      }}
                      className="h-7 px-2.5 text-[11px] font-mono border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      <Copy className="size-3 mr-1" />
                      <span>Copy diagnostics</span>
                    </Button>
                  </div>

                  {validationResult.needsConfirmation && (
                    <p className="text-muted-foreground">
                      Tasks have already been created for this phase. Click below to confirm replacing existing todo tasks.
                    </p>
                  )}

                  {/* If no issues, show server error details */}
                  {(!validationResult.issues || validationResult.issues.length === 0) && !validationResult.needsConfirmation && (
                    <p className="text-muted-foreground font-mono">
                      The server returned an error (code {validationResult.requestId ? 'SERVER_ERROR' : 'UNKNOWN'}, request {validationResult.requestId || 'unknown'})
                    </p>
                  )}

                  {/* Render issues grouped by file, line, expected, found */}
                  {validationResult.issues && validationResult.issues.length > 0 && (
                    <div className="flex flex-col gap-2.5 pt-1">
                      {/* Step-level issues */}
                      {validationResult.issues
                        .filter((iss: any) => !iss.file && !iss.document)
                        .map((iss: any, i: number) => (
                          <div key={i} className="flex flex-col gap-0.5 text-xs text-foreground/90 pl-1">
                            <div className="flex items-start gap-1.5">
                              <span className={cn(
                                "font-mono uppercase text-[10px] px-1 py-0.2 rounded shrink-0",
                                iss.severity === 'BLOCK' ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                              )}>
                                {iss.severity || 'WARN'}
                              </span>
                              <span className="font-medium">{iss.message || iss.heading || 'Formatting warning'}</span>
                            </div>
                            {(iss.expected || iss.found) && (
                              <span className="text-[11px] text-muted-foreground pl-6 font-mono">
                                Expected: &ldquo;{iss.expected}&rdquo;, found: &ldquo;{iss.found}&rdquo;
                              </span>
                            )}
                          </div>
                        ))}

                      {/* File-grouped issues */}
                      {Object.entries(
                        validationResult.issues.reduce((acc: Record<string, any[]>, iss: any) => {
                          const fileKey = iss.file || iss.document;
                          if (fileKey) {
                            if (!acc[fileKey]) acc[fileKey] = [];
                            acc[fileKey].push(iss);
                          }
                          return acc;
                        }, {})
                      ).map(([fileKey, issues]: [string, any[]]) => (
                        <div key={fileKey} className="flex flex-col gap-1 pl-1">
                          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                            {fileKey}
                          </span>
                          <div className="flex flex-col gap-1.5 pl-2 border-l border-destructive/20">
                            {issues.map((iss: any, i: number) => (
                              <div key={i} className="flex flex-col gap-0.5 text-xs text-foreground/90">
                                <div className="flex items-center gap-1.5">
                                  <span className={cn(
                                    "font-mono uppercase text-[10px] px-1 py-0.2 rounded shrink-0",
                                    iss.severity === 'BLOCK' ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                                  )}>
                                    {iss.severity || 'WARN'}
                                  </span>
                                  {iss.line && (
                                    <span className="font-mono text-[11px] text-muted-foreground">
                                      L{iss.line}:
                                    </span>
                                  )}
                                  <span>{iss.message || iss.heading || 'Formatting warning'}</span>
                                </div>
                                {(iss.expected || iss.found) && (
                                  <span className="text-[11px] text-muted-foreground pl-6 font-mono">
                                    Expected: &ldquo;{iss.expected}&rdquo;, found: &ldquo;{iss.found}&rdquo;
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Import Anyway / Confirm Button */}
                  {isLeader && (
                    <div className="pt-2 flex justify-end">
                      <Button
                        onClick={() => handleValidate(true)}
                        className="h-8 px-3 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs cursor-pointer shadow-xs"
                      >
                        {validationResult.needsConfirmation ? 'Confirm & Replace Tasks' : 'Import anyway'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {validationError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Validate & AI Generate Actions */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleValidate(false)}
                    disabled={!selectedFile || isValidating || isGeneratingAi}
                    className="h-9 px-5 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isValidating ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    <span>{isValidating ? 'Validating...' : 'Validate & Import'}</span>
                  </Button>

                  <AiGate>
                    <Button
                      onClick={handleGenerateAi}
                      disabled={isValidating || isGeneratingAi}
                      variant="outline"
                      className="h-9 px-4 rounded-full border-border hover:bg-muted text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {isGeneratingAi ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 text-amber-500" />}
                      <span>{isGeneratingAi ? 'Generating...' : 'Generate with AI'}</span>
                    </Button>
                  </AiGate>
                </div>

                {onCancel && (
                  <Button
                    onClick={onCancel}
                    variant="ghost"
                    className="h-9 px-3 rounded-full text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <PhaseGuideModal
        isOpen={isGuideOpen}
        onClose={handleCloseGuide}
        currentPhaseKey={phase.key}
        nextPhaseKey={phase.nextPhaseKey || 'P2'}
      />
    </div>
  );
}
