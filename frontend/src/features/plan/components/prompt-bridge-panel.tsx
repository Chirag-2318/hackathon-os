import * as React from 'react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Copy, Check, X, ExternalLink, Loader2, Download,
  Maximize2, Minimize2, Sparkles, AlertCircle, RefreshCw, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ValidationResult } from '@/services/planService';
import { planService } from '@/services/planService';
import { toast } from 'sonner';
import { useMeta } from '@/api/useMeta';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export interface PromptBridgePanelProps {
  stepIndex: number;
  stepId: string;
  stepName: string;
  promptText: string;
  answer: string;
  mode?: string;
  ideaVerdict?: string;
  stale?: boolean;
  aiAllowed?: boolean;
  onRefreshPrompt?: () => Promise<void>;
  onAnswerChange: (val: string) => void;
  onValidate: (content: string) => Promise<ValidationResult>;
  onSuccess: () => void;
  onDownloadIdeas?: () => void;
  onDownloadContext?: () => void;
  onGenerate?: () => Promise<void>;
  isGenerating?: boolean;
  hasApiKey?: boolean;
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
  onRefreshPrompt,
  onAnswerChange,
  onValidate,
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: meta } = useMeta();
  const aiEnabled = Boolean(meta?.aiEnabled);

  // Copy animation for main prompt
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.md') && !file.name.toLowerCase().endsWith('.txt')) {
      toast.error('Only .md and .txt files are supported.');
      return;
    }
    if (file.size > 300 * 1024) {
      toast.error('File size exceeds the 300 KB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      onAnswerChange(text);
      toast.success(`Loaded ${file.name} (${text.length} chars)`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleValidate = async () => {
    if (!answer.trim()) return;
    setIsValidating(true);
    setValidateResult(null);

    const start = Date.now();
    try {
      const result = await onValidate(answer);
      const elapsed = Date.now() - start;
      if (elapsed < 400) {
        await new Promise((r) => setTimeout(r, 400 - elapsed));
      }
      setValidateResult(result);

      if (result.valid) {
        if (stepIndex === 4) {
          toast.success('Planning phase done! Ready for the build phase.');
        } else {
          toast.success(`Step ${stepId} validated!`);
        }
        setTimeout(() => {
          onSuccess();
        }, stepIndex === 4 ? 1000 : 700);
      }
    } catch (e: any) {
      console.error(e);
      setValidateResult({ valid: false, issues: [e.message || 'Validation error'] });
    } finally {
      setIsValidating(false);
    }
  };

  const repairPrompt = validateResult?.repairPrompt || (validateResult && !validateResult.valid
    ? `Fix the issues: ${(validateResult.issues || validateResult.errors || []).join('; ')}`
    : '');

  const handleCopyRepair = () => {
    if (!repairPrompt) return;
    navigator.clipboard.writeText(repairPrompt);
    setRepairCopied(true);
    toast.success('Repair prompt copied');
    setTimeout(() => setRepairCopied(false), 2000);
  };

  const charCountStr = `${promptText.length.toLocaleString()} chars`;

  return (
    <div className="flex flex-col gap-8 flex-1 max-w-3xl">
      <div>
        <h2 className="text-h2 text-ink">Step {stepId}: {stepName}</h2>
        <p className="text-caption text-ink-muted mt-1">
          Follow the 3-step loop: copy the AI prompt, run it in your LLM of choice, and paste the output to validate.
        </p>
      </div>

      {/* 1. Copy Prompt Section */}
      <section className="flex flex-col gap-3">
        {/* Step Header Row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-surface-raised border border-border text-ink font-bold text-xs">
              1
            </span>
            <h3 className="font-bold text-ink">Copy this prompt</h3>

            {/* Mode Chip */}
            {mode === 'BUILD_OUT' ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Thin idea: the AI will help shape it
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
                href="https://chatgpt.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-0.5 text-lav-600 hover:text-lav-700 underline font-semibold"
              >
                ChatGPT <ExternalLink className="size-3 ml-0.5" />
              </a>
              <span className="text-border">/</span>
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-0.5 text-lav-600 hover:text-lav-700 underline font-semibold"
              >
                Claude <ExternalLink className="size-3 ml-0.5" />
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

        {/* Warning if prompt exceeds 16,000 chars */}
        {promptText.length > 16000 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="size-3.5 shrink-0" />
            <span>Prompt is long ({promptText.length.toLocaleString()} characters). Analysis section was shortened.</span>
          </div>
        )}

        {/* Prompt Box with pre-wrap, max-height 160px scroll & Expand toggle */}
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
              className="flex items-center gap-1 text-ink-muted hover:text-ink transition-colors font-medium"
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
            <span className="text-[11px] text-ink-muted">Markdown output required</span>
          </div>
        </div>

        {/* Download Context / ideas.md button */}
        <div className="flex items-center justify-between pt-1">
          {stepIndex === 0 ? (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadIdeas}
                className="text-xs h-8"
              >
                <Download className="size-3.5 mr-1.5" />
                Download ideas.md
              </Button>
              <span className="text-caption text-ink-muted">
                Attach this file to your AI chat.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onDownloadContext}
                className="text-xs h-8"
              >
                <Download className="size-3.5 mr-1.5" />
                Download context.md
              </Button>
              <span className="text-caption text-ink-muted">
                Attach this file to your AI chat.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Paste Answer Section */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-surface-raised border border-border text-ink font-bold text-xs">
              2
            </span>
            <h3 className="font-bold text-ink">Paste the answer</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Upload .md button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".md,.txt"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs h-7 gap-1"
            >
              <Upload className="size-3.5" />
              Upload .md
            </Button>

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
              ) : !aiEnabled ? (
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
                      <p>AI is not configured on the server</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="text-xs h-7 gap-1"
                >
                  {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 text-lav-600" />}
                  Generate with AI
                </Button>
              )
            )}
          </div>
        </div>

        <textarea
          className="w-full h-36 rounded-card border border-border bg-surface p-4 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-lav-500/20 focus:border-lav-600 transition-all text-ink placeholder:text-ink-muted"
          placeholder="Paste the generated response from ChatGPT or Claude here..."
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
        />
      </section>

      {/* 3. Check it / Validate Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-surface-raised border border-border text-ink font-bold text-xs">
              3
            </span>
            <h3 className="font-bold text-ink">Check it</h3>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleValidate}
            disabled={isValidating || !answer.trim()}
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
        </div>

        {/* Validation Result Box */}
        <AnimatePresence>
          {validateResult && !validateResult.valid && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-card border border-rose-500/30 bg-rose-500/10 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <X className="size-4" /> Validation Failed
                </div>
                <ul className="list-disc list-inside text-xs text-rose-900 dark:text-rose-200 pl-1 space-y-1">
                  {(validateResult.issues ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>

                {repairPrompt && (
                  <div className="mt-2 p-3 rounded-card bg-surface border border-border flex items-center justify-between gap-3">
                    <p className="text-caption text-ink-muted font-mono truncate">
                      {repairPrompt.slice(0, 80)}...
                    </p>
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
              </div>
            </motion.div>
          )}

          {validateResult && validateResult.valid && validateResult.warnings && validateResult.warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-card border border-amber-500/30 bg-amber-500/10 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                  <Check className="size-4 stroke-[3]" /> Validated with {validateResult.warnings.length} warning{validateResult.warnings.length > 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onSuccess()}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                  >
                    {stepIndex === 4 ? 'Open Build Phase \u2192' : 'Validate anyway \u2192'}
                  </button>
                  <span className="text-caption text-muted-foreground animate-pulse">
                    {stepIndex === 4 ? 'Planning phase done. Jumping into build phase...' : 'Auto-advancing...'}
                  </span>
                </div>
              </div>
              <ul className="list-disc list-inside text-[11px] text-muted-foreground pl-1 space-y-0.5">
                {validateResult.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </motion.div>
          )}

          {validateResult && validateResult.valid && (!validateResult.warnings || validateResult.warnings.length === 0) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-card border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                <Check className="size-4" /> Looks good! {validateResult.summary || 'Validation passed.'}
              </div>
              <div className="flex items-center gap-3">
                {stepIndex === 4 && (
                  <button
                    type="button"
                    onClick={() => onSuccess()}
                    className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Open Build Phase &rarr;
                  </button>
                )}
                <span className="text-caption text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                  {stepIndex === 4 ? 'Planning phase done. Jumping into build phase...' : 'Auto-advancing...'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
