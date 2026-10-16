import * as React from 'react';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Copy, Check, X, ExternalLink, Loader2, Download,
  Maximize2, Minimize2, Sparkles, AlertCircle, RefreshCw, Upload,
  FileText, ChevronDown, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ValidationResult, ValidationIssue } from '@/services/planService';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AiGate } from '@/features/ai-gate';

export interface PromptBridgePanelProps {
  stepIndex: number;
  stepId: string;
  stepName: string;
  promptText: string;
  answer?: string;
  mode?: string;
  ideaVerdict?: string;
  stale?: boolean;
  aiAllowed?: boolean;
  isLeader?: boolean;
  analysisState?: 'READY' | 'FALLBACK' | 'PENDING' | 'SKIPPED_NO_KEY' | string;
  ready?: boolean;
  outputFiles?: string[];
  bundleName?: string;
  validatedWithOverrides?: boolean;
  issuesCount?: number;
  onRefreshPrompt?: () => Promise<void>;
  onAnswerChange?: (val: string) => void;
  onValidate?: (content: string) => Promise<ValidationResult>;
  onValidateFiles?: (files: File[], confirm?: boolean, override?: boolean) => Promise<ValidationResult>;
  onValidateText?: (text: string, confirm?: boolean) => Promise<ValidationResult>;
  onSuccess: () => void;
  onDownloadIdeas?: () => void;
  onDownloadContext?: () => void;
  onGenerate?: () => Promise<string | void>;
  isGenerating?: boolean;
  hasApiKey?: boolean;
}

interface StagedFile {
  id: string;
  name: string;
  size: number;
  file?: File;
  isAiDraft?: boolean;
  text?: string;
}

export function PromptBridgePanel({
  stepIndex,
  stepId,
  stepName,
  promptText,
  answer,
  mode = 'BALANCED',
  ideaVerdict,
  stale = false,
  aiAllowed = true,
  isLeader = false,
  analysisState,
  ready = true,
  outputFiles = [],
  bundleName,
  validatedWithOverrides = false,
  issuesCount = 0,
  onRefreshPrompt,
  onAnswerChange,
  onValidate,
  onValidateFiles,
  onValidateText,
  onSuccess,
  onDownloadIdeas,
  onDownloadContext,
  onGenerate,
  isGenerating,
  hasApiKey,
}: PromptBridgePanelProps) {
  const [copied, setCopied] = useState(false);
  const [repairCopied, setRepairCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [validateResult, setValidateResult] = useState<ValidationResult | null>(null);

  // Files state
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clear staged files and validation results whenever switching steps
  useEffect(() => {
    setStagedFiles([]);
    setValidateResult(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [stepIndex]);

  // Prompt Box copy
  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    toast.success('Prompt copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshClick = async () => {
    if (!onRefreshPrompt) return;
    setIsRefreshing(true);
    try {
      await onRefreshPrompt();
      toast.success('Prompt refreshed');
    } catch (e: any) {
      toast.error('Failed to refresh prompt');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add files with client-side checks (.md, .markdown, .mdx, .txt, .md.txt, no ext if text, <= 12MB, <= 4 files)
  const addFiles = (newFiles: FileList | File[]) => {
    setFileError(null);
    const validExts = ['.md', '.markdown', '.mdx', '.txt', '.md.txt'];
    const maxSizeBytes = 12 * 1024 * 1024;
    const added: StagedFile[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const f = newFiles[i];
      const lower = f.name.toLowerCase();
      const dotIdx = lower.lastIndexOf('.');
      if (dotIdx > 0) {
        const hasValidExt = validExts.some((ext) => lower.endsWith(ext));
        if (!hasValidExt) {
          setFileError(`"${f.name}" is not supported. Please upload a .md, .markdown, .mdx, or .txt file.`);
          return;
        }
      }
      if (f.size > maxSizeBytes) {
        setFileError(`"${f.name}" exceeds the 12 MB limit (${(f.size / (1024 * 1024)).toFixed(1)} MB).`);
        return;
      }
      added.push({
        id: `${f.name}-${Date.now()}-${i}`,
        name: f.name,
        size: f.size,
        file: f,
      });
    }

    setStagedFiles((prev) => {
      // Remove any previous AI draft when user uploads real files
      const filtered = prev.filter((item) => !item.isAiDraft);
      const combined = [...filtered, ...added];
      if (combined.length > 4) {
        setFileError('You can upload at most 4 files.');
        return combined.slice(0, 4);
      }
      return combined;
    });
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
    setFileError(null);
    setValidateResult(null);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  // AI Generation staging as virtual file
  const handleGenerateClick = async () => {
    if (!onGenerate) return;
    try {
      const result = await onGenerate();
      if (result && typeof result === 'string') {
        const draftBlob = new Blob([result], { type: 'text/markdown' });
        const virtualFile: StagedFile = {
          id: `ai-draft-${Date.now()}`,
          name: 'ai-draft.md',
          size: draftBlob.size,
          isAiDraft: true,
          text: result,
        };
        setStagedFiles([virtualFile]);
        setFileError(null);
        setValidateResult(null);
        toast.success('AI draft generated and staged for validation');
      }
    } catch (err: any) {
      toast.error(err.message || 'AI generation failed');
    }
  };

  // Validate handler
  const handleValidate = async (confirm = false, override = false) => {
    if (stagedFiles.length === 0) return;
    setIsValidating(true);
    setValidateResult(null);

    try {
      const virtualAi = stagedFiles.find((f) => f.isAiDraft);
      let result: ValidationResult;

      if (virtualAi && virtualAi.text && stagedFiles.length === 1) {
        if (onValidateText) {
          result = await onValidateText(virtualAi.text, confirm);
        } else if (onValidate) {
          result = await onValidate(virtualAi.text);
        } else {
          throw new Error('No validator configured');
        }
      } else {
        const realFiles = stagedFiles.map((s) => s.file).filter(Boolean) as File[];
        if (onValidateFiles) {
          result = await onValidateFiles(realFiles, confirm, override);
        } else if (onValidate && realFiles[0]) {
          const text = await realFiles[0].text();
          result = await onValidate(text);
        } else {
          throw new Error('No validator configured');
        }
      }

      setValidateResult(result);

      if (result.ok && (!result.needsConfirmation || confirm)) {
        if (override) {
          toast.success(`Imported with overrides for Step ${stepId}`);
        } else if (stepIndex === 4) {
          toast.success('Planning phase complete! Ready for build.');
        } else {
          toast.success(`Step ${stepId} validated!`);
        }
        setTimeout(() => {
          setStagedFiles([]);
          setValidateResult(null);
          setFileError(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          onSuccess();
        }, stepIndex === 4 ? 1000 : 700);
      }
    } catch (e: any) {
      const code = e.code || e.status || '500';
      const reqId = e.requestId || (e as any)?.details?.requestId || 'req-' + Math.random().toString(36).substring(2, 8);
      const msg = `The server could not process the file (code ${code}, request id ${reqId})`;
      toast.error(msg);
      setValidateResult({
        ok: false,
        valid: false,
        issues: [{ severity: 'BLOCK', code: String(code), message: msg }],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCopyDiagnostics = () => {
    const diag = validateResult?.diagnostics || {
      requestId: 'client-' + Date.now(),
      issues: validateResult?.issues || [],
      files: stagedFiles.map((f) => ({ name: f.name, sizeBytes: f.size })),
    };
    navigator.clipboard.writeText(JSON.stringify(diag, null, 2));
    toast.success('Diagnostics copied to clipboard');
  };

  const canImportAnyway = useMemo(() => {
    if (!validateResult || validateResult.ok) return false;
    // Step 4 (TASKS): allows it only if at least one task parsed
    if (stepIndex === 3) {
      const tasksParsed = (validateResult?.diagnostics as any)?.tasksParsed ?? 0;
      return tasksParsed > 0;
    }
    return true;
  }, [validateResult, stepIndex]);

  // Copy repair prompt
  const repairPrompt = validateResult?.repairPrompt || '';
  const handleCopyRepair = () => {
    if (!repairPrompt) return;
    navigator.clipboard.writeText(repairPrompt);
    setRepairCopied(true);
    toast.success('Repair prompt copied');
    setTimeout(() => setRepairCopied(false), 2000);
  };

  // Step-level BLOCK issues (no file specified)
  const stepLevelBlockIssues = useMemo(() => {
    const normalizedIssues: ValidationIssue[] = (validateResult?.issues || []).map((iss) => {
      if (typeof iss === 'string') {
        return { severity: 'BLOCK', code: 'ISSUE', message: iss };
      }
      return iss;
    });
    return normalizedIssues.filter((i) => i.severity === 'BLOCK' && !i.file);
  }, [validateResult?.issues]);

  // Group BLOCK issues by file
  const groupedBlockIssues = useMemo(() => {
    const map: Record<string, ValidationIssue[]> = {};
    const normalizedIssues: ValidationIssue[] = (validateResult?.issues || []).map((iss) => {
      if (typeof iss === 'string') {
        return { severity: 'BLOCK', code: 'ISSUE', message: iss };
      }
      return iss;
    });
    const blocks = normalizedIssues.filter((i) => i.severity === 'BLOCK' && Boolean(i.file));
    for (const issue of blocks) {
      const fileKey = issue.file!;
      if (!map[fileKey]) map[fileKey] = [];
      map[fileKey].push(issue);
    }
    return map;
  }, [validateResult?.issues]);

  const warnIssues = useMemo(() => {
    const normalizedIssues: ValidationIssue[] = (validateResult?.issues || []).map((iss) => {
      if (typeof iss === 'string') {
        return { severity: 'WARN', code: 'ISSUE', message: iss };
      }
      return iss;
    });
    return normalizedIssues.filter((i) => i.severity === 'WARN');
  }, [validateResult?.issues]);

  // Expected files line
  const expectedFilesStr = useMemo(() => {
    if (!outputFiles || outputFiles.length === 0) return null;
    if (outputFiles.length === 1) {
      return `Expected: ${outputFiles[0]}`;
    }
    if (outputFiles.length === 2) {
      return `Expected: ${outputFiles[0]} and ${outputFiles[1]} in one file, or as two files`;
    }
    return `Expected: ${outputFiles.slice(0, -1).join(', ')} and ${outputFiles[outputFiles.length - 1]} in one file, or as ${outputFiles.length} files`;
  }, [outputFiles]);

  // Success summary text
  const successSummary = useMemo(() => {
    if (!validateResult || !validateResult.ok) return null;
    if (validateResult.files && validateResult.files.length > 0) {
      const parts = validateResult.files.map((f) => {
        const secCount = f.sections?.length || 0;
        return `${f.name}: ${secCount > 0 ? `${secCount} section${secCount > 1 ? 's' : ''}` : `${f.chars} chars`}`;
      });
      return parts.join('. ') + '.';
    }
    return validateResult.summary || 'Validation passed.';
  }, [validateResult]);

  // Skeleton state when prompt is not ready
  if (!ready) {
    return (
      <div className="flex flex-col gap-8 flex-1 max-w-3xl">
        <div>
          <h2 className="text-h2 text-ink">Step {stepId}: {stepName}</h2>
          <p className="text-caption text-ink-muted mt-1">
            Build your hackathon project plan step by step.
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface-raised p-6 flex flex-col gap-3 animate-pulse">
          <div className="h-4 bg-surface-sunken/80 rounded w-1/4" />
          <div className="h-28 bg-surface-sunken/40 rounded w-full" />
          <p className="text-xs text-ink-muted font-medium">Preparing this prompt...</p>
        </div>
      </div>
    );
  }

  const charCountStr = `${promptText.length.toLocaleString()} chars`;

  return (
    <div className="flex flex-col gap-8 flex-1 max-w-3xl">
      <div>
        <h2 className="text-h2 text-ink">Step {stepId}: {stepName}</h2>
        <p className="text-caption text-ink-muted mt-1">
          Follow the 2-step loop: copy the AI prompt, run it in your LLM, and upload the generated .md file.
        </p>
      </div>

      {/* Validated with overrides banner */}
      {validatedWithOverrides && (
        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <span>Imported without full validation ({issuesCount > 0 ? `${issuesCount} issues` : 'N issues'}).</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-amber-500/30 hover:bg-amber-500/20"
            onClick={() => handleValidate(false, false)}
            disabled={isValidating}
          >
            Re-validate
          </Button>
        </div>
      )}

      {/* 1. Copy Prompt Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-surface-raised border border-border text-ink font-bold text-xs">
              1
            </span>
            <h3 className="font-bold text-ink">Copy this prompt</h3>

            {/* Output file chip */}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-sunken text-ink-muted border border-border">
              Output: one .md file
            </span>

            {/* Mode Chip */}
            {mode === 'BUILD_OUT' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Thin idea: shaping
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Detailed idea: balanced pass
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            {onRefreshPrompt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="h-7 text-xs px-2 gap-1"
                title="Rebuild prompt"
              >
                <RefreshCw className={cn('size-3', isRefreshing && 'animate-spin')} />
                Refresh
              </Button>
            )}

            <span className="text-ink-muted tabular-nums">{charCountStr}</span>

            <div className="flex items-center gap-2 text-ink-muted font-medium">
              <span>Open in:</span>
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-0.5 text-lav-600 hover:text-lav-700 underline font-semibold"
              >
                Claude <ExternalLink className="size-3 ml-0.5" />
              </a>
              <span className="text-border">/</span>
              <a
                href="https://chatgpt.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-0.5 text-lav-600 hover:text-lav-700 underline font-semibold"
              >
                ChatGPT <ExternalLink className="size-3 ml-0.5" />
              </a>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs font-semibold px-2.5 ml-1"
            >
              {copied ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Check className="size-3.5" /> Copied
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy className="size-3.5" /> Copy
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Idea Verdict subtitle */}
        {ideaVerdict && (
          <p className="text-[11px] text-ink-muted -mt-1 italic">
            Verdict: {ideaVerdict}
          </p>
        )}

        {/* Stale notice */}
        {stale && (
          <div className="flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-md text-xs text-amber-900 dark:text-amber-200">
            <span>Inputs changed after generation. Rebuild prompt to include latest details.</span>
            {onRefreshPrompt && (
              <Button size="sm" variant="outline" onClick={handleRefreshClick} className="h-6 text-[10px] px-2">
                Rebuild
              </Button>
            )}
          </div>
        )}

        {/* Fallback Notice */}
        {analysisState === 'FALLBACK' && (
          <p className="text-[12px] text-ink-muted italic -mt-1">
            AI analysis was unavailable, so this prompt uses the standard analysis.
          </p>
        )}
        {analysisState === 'SKIPPED_NO_KEY' && (
          <p className="text-[12px] text-ink-muted italic -mt-1">
            Add your Groq key to get the blunt idea analysis. The prompt below works without it.
          </p>
        )}

        {/* Warning if prompt exceeds 16,000 chars */}
        {promptText.length > 16000 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>Prompt is long ({promptText.length.toLocaleString()} characters). Analysis section was shortened.</span>
          </div>
        )}

        {/* Prompt Box */}
        <div className="relative rounded-card border border-border bg-surface-raised overflow-hidden">
          <div
            className={cn(
              'p-4 text-xs font-mono text-ink leading-relaxed overflow-y-auto whitespace-pre-wrap select-text transition-all duration-200',
              expanded ? 'max-h-[500px]' : 'max-h-[160px]'
            )}
          >
            {promptText}
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 bg-surface-sunken/40 border-t border-border text-caption">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-ink-muted hover:text-ink transition-colors font-medium cursor-pointer"
            >
              {expanded ? (
                <>
                  <Minimize2 className="size-3" /> Collapse view
                </>
              ) : (
                <>
                  <Maximize2 className="size-3" /> Expand prompt
                </>
              )}
            </button>
            <span className="text-[11px] text-ink-muted">
              {bundleName ? `Filename: ${bundleName}` : 'Markdown output required'}
            </span>
          </div>
        </div>

        {/* Download Context button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadContext || onDownloadIdeas}
              className="text-xs h-8"
            >
              <Download className="size-3.5 mr-1.5" />
              Download context.md
            </Button>
            <span className="text-caption text-ink-muted">
              Attach this file to your AI chat.
            </span>
          </div>
        </div>
      </section>

      {/* 2. Upload Answer Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-surface-raised border border-border text-ink font-bold text-xs">
              2
            </span>
            <h3 className="font-bold text-ink">Upload the .md file</h3>
          </div>

          {/* Secondary "Generate with AI" action */}
          {onGenerate && (
            !aiAllowed ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="text-xs h-7 gap-1 opacity-60"
                      >
                        <Sparkles className="size-3.5 text-lav-600" />
                        Generate with AI
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>AI generation is disabled by event policy</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <AiGate>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateClick}
                  disabled={isGenerating || isValidating}
                  className="text-xs h-7 gap-1"
                >
                  {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 text-lav-600" />}
                  Generate with AI
                </Button>
              </AiGate>
            )
          )}
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
          accept=".md,.markdown,.mdx,.txt"
          multiple
          className="hidden"
        />

        {/* Upload Drop Zone: Dashed hairline border, 8px radius, ~120px tall, no card inside a card */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'h-[120px] rounded-[8px] border border-dashed transition-colors flex flex-col items-center justify-center p-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-lav-500/30 select-none text-center',
            isDragOver
              ? 'border-lav-500 bg-lav-500/5'
              : 'border-border/80 hover:border-border hover:bg-surface-raised/40 bg-surface'
          )}
        >
          <Upload className="size-4 text-ink-muted mb-1.5" />
          <p className="text-xs font-medium text-ink">
            Drop the .md file here, or <span className="text-lav-600 underline underline-offset-2">browse</span>
          </p>
          <p className="text-[11px] text-ink-muted mt-0.5">
            The file your AI created. Download it from the chat and drop it here.
          </p>
        </div>

        {/* Reject Inline Message */}
        {fileError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        {/* Selected Files List: Compact row per file */}
        {stagedFiles.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {stagedFiles.map((sf) => (
              <div
                key={sf.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-raised border border-border text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="size-3.5 text-ink-muted shrink-0" />
                  <span className="font-medium text-ink truncate max-w-[320px]">{sf.name}</span>
                  <span className="font-mono text-[11px] text-ink-muted tabular-nums">
                    ({(sf.size / 1024).toFixed(1)} KB)
                  </span>
                  {sf.isAiDraft && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-lav-500/15 text-lav-600 dark:text-lav-400">
                      AI draft
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStagedFile(sf.id);
                  }}
                  className="text-ink-muted hover:text-ink p-1 rounded transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}

            {/* Expected files line */}
            {expectedFilesStr && (
              <p className="text-[11px] text-ink-muted italic px-1">
                {expectedFilesStr}
              </p>
            )}
          </div>
        )}

        {/* Primary Validate Button */}
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="default"
            size="sm"
            onClick={() => handleValidate(false)}
            disabled={isValidating || stagedFiles.length === 0}
            className="w-32 justify-center"
          >
            {isValidating ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" /> Validating...
              </span>
            ) : (
              'Validate'
            )}
          </Button>

          {stagedFiles.length === 0 && (
            <span className="text-xs text-ink-muted">
              Select or generate a file to validate.
            </span>
          )}
        </div>

        {/* Validation Results UI */}
        <AnimatePresence>
          {/* 1. BLOCK Issues */}
          {validateResult && !validateResult.ok && !validateResult.needsConfirmation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-card border border-rose-500/30 bg-rose-500/10 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                  <X className="size-4" /> Validation Blocked
                </div>

                {/* Step-level issues (no file heading, no line number) */}
                {stepLevelBlockIssues.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {stepLevelBlockIssues.map((iss, i) => (
                      <div key={i} className="flex flex-col text-xs text-rose-900 dark:text-rose-200">
                        <div className="flex items-start gap-1.5">
                          <span className="size-1.5 rounded-full bg-rose-500 shrink-0 mt-1" />
                          <span className="font-medium">{iss.message}</span>
                        </div>
                        {(iss.expected || iss.found) && (
                          <span className="text-[11px] text-rose-700 dark:text-rose-400/80 pl-3">
                            Expected: &ldquo;{iss.expected}&rdquo;, found: &ldquo;{iss.found}&rdquo;
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Grouped issues by file */}
                {Object.keys(groupedBlockIssues).length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    {Object.entries(groupedBlockIssues).map(([fileKey, issues]) => (
                      <div key={fileKey} className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-rose-950 dark:text-rose-200 uppercase tracking-wider">
                          {fileKey}
                        </span>
                        <div className="flex flex-col gap-1.5 pl-2 border-l border-rose-500/20">
                          {issues.map((iss, i) => (
                            <div key={i} className="flex flex-col text-xs text-rose-900 dark:text-rose-200">
                              <div className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
                                {iss.line && (
                                  <span className="font-mono text-[11px] text-rose-700 dark:text-rose-400">
                                    L{iss.line}:
                                  </span>
                                )}
                                <span>{iss.message}</span>
                              </div>
                              {(iss.expected || iss.found) && (
                                <span className="text-[11px] text-rose-700 dark:text-rose-400/80 pl-3">
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

                {/* Repair prompt box & Claude text link */}
                {repairPrompt && (
                  <div className="mt-2 p-3 rounded-card bg-surface border border-border flex items-center justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                      <p className="text-caption text-ink-muted font-mono truncate">
                        {repairPrompt.slice(0, 75)}...
                      </p>
                      <a
                        href="https://claude.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          navigator.clipboard.writeText(repairPrompt);
                          toast.info('Repair prompt copied to clipboard');
                        }}
                        className="text-[11px] text-lav-600 hover:text-lav-700 underline font-medium pt-0.5 inline-flex items-center gap-1"
                      >
                        Open the repair prompt in Claude
                        <ExternalLink className="size-3" />
                      </a>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyRepair}
                      className="shrink-0 text-xs h-7"
                    >
                      {repairCopied ? 'Copied!' : 'Copy repair prompt'}
                    </Button>
                  </div>
                )}

                {/* Diagnostics and Import anyway actions */}
                <div className="mt-2 pt-2 border-t border-rose-500/20 flex items-center justify-between flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyDiagnostics}
                    className="text-xs h-7 border-rose-500/30 text-rose-950 dark:text-rose-200 hover:bg-rose-500/10"
                  >
                    Copy diagnostics
                  </Button>

                  {canImportAnyway && (
                    isLeader ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleValidate(false, true)}
                        disabled={isValidating}
                        className="text-xs h-7 bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        Import anyway
                      </Button>
                    ) : (
                      <span className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                        Ask the leader to import anyway
                      </span>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. Needs Confirmation (Risk warnings) */}
          {validateResult && validateResult.needsConfirmation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="p-4 rounded-card border border-amber-500/30 bg-amber-500/10 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-sm">
                <AlertTriangle className="size-4" /> Confirmation Required
              </div>

              <p className="text-xs text-amber-900 dark:text-amber-200">
                Potential project risks were identified that require confirmation before advancing:
              </p>

              <ul className="list-disc list-inside text-xs text-amber-900 dark:text-amber-200 pl-1 space-y-1">
                {(validateResult.warnings || []).map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>

              <div className="pt-2 flex items-center gap-3">
                {isLeader ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleValidate(true)}
                    disabled={isValidating}
                    className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Continue anyway
                  </Button>
                ) : (
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    Ask the leader to confirm
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* 3. OK Success (with quiet collapsible warnings list if any) */}
          {validateResult && validateResult.ok && !validateResult.needsConfirmation && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-card border border-emerald-500/30 bg-emerald-500/10 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                  <Check className="size-4 stroke-[3]" />
                  <span>Looks good! {successSummary}</span>
                </div>
                <span className="text-caption text-emerald-700 dark:text-emerald-400 font-medium animate-pulse">
                  {stepIndex === 4 ? 'Planning complete. Entering build phase...' : 'Advancing to next step...'}
                </span>
              </div>

              {/* Quiet collapsible list of warnings */}
              {warnIssues.length > 0 && (
                <details className="text-xs text-emerald-900/80 dark:text-emerald-200/80 pt-1 group">
                  <summary className="cursor-pointer text-[11px] font-medium text-emerald-800 dark:text-emerald-300 hover:underline inline-flex items-center gap-1 select-none">
                    <ChevronDown className="size-3 group-open:rotate-180 transition-transform" />
                    {warnIssues.length} minor notice{warnIssues.length > 1 ? 's' : ''} (non-blocking)
                  </summary>
                  <ul className="list-disc list-inside space-y-1 mt-1.5 pl-2 text-[11px]">
                    {warnIssues.map((w, idx) => (
                      <li key={idx}>{w.message}</li>
                    ))}
                  </ul>
                </details>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
