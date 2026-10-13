import React, { useState, useEffect, useRef } from 'react';
import { briefService } from '@/services';
import { useMeta } from '@/api/useMeta';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider
} from '@/components/ui/tooltip';
import { Sparkles, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AiGeneratingSkeleton } from '@/design/components/ai-button';

interface StructuringBannerProps {
  roomId: string;
  onExtracted: (fields: any, briefDto?: any) => void;
}

export function formatAiError(err: any): string {
  const code = err?.code;
  if (code === 'AI_RESTRICTED_BY_EVENT') {
    return 'AI usage is prohibited by the hackathon event policy.';
  }
  if (code === 'AI_UNAVAILABLE' || code === 'AI_NOT_CONFIGURED') {
    return 'The AI service is unavailable on the server.';
  }
  if (code === 'AI_OUTPUT_INVALID' || code === 'AI_OUTPUT_ERROR') {
    return 'The AI output was invalid. Please retry.';
  }
  if (code === 'AI_RATE_LIMIT') {
    return 'AI rate limit reached. Try again in a minute.';
  }
  if (code === 'AI_FAILED') {
    return err.message ? `AI extraction failed: ${err.message}` : 'AI extraction failed.';
  }
  return err?.message || 'Extraction failed. Please try again.';
}

const ROTATING_STATUS_LINES = [
  'Reading event details...',
  'Extracting problem statement & target audience...',
  'Normalizing rubric weights to 100%...',
  'Structuring deadlines & event rules...',
  'Finalizing 9 brief parameters...',
];

const MAX_CHAR_COUNT = 20000;

export function StructuringBanner({ roomId, onExtracted }: StructuringBannerProps) {
  const [copied, setCopied] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);

  // "Paste the event details" dialog state
  const [extractDialogOpen, setExtractDialogOpen] = useState(false);
  const [eventDetailsText, setEventDetailsText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [statusStepIdx, setStatusStepIdx] = useState(0);
  const [extractError, setExtractError] = useState<string | null>(null);

  const isCancelledRef = useRef(false);

  const { data: meta } = useMeta();
  const aiEnabled = Boolean(meta?.aiEnabled);

  // Rotate status line during extraction
  useEffect(() => {
    if (!isExtracting) {
      setStatusStepIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setStatusStepIdx((prev) => (prev + 1) % ROTATING_STATUS_LINES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isExtracting]);

  const handleCopyPrompt = async () => {
    try {
      const prompt = await briefService.getExtractionPrompt(roomId);
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('Extraction prompt copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch prompt');
    }
  };

  const handleValidate = async () => {
    if (!pastedJson.trim()) return;
    setIsValidating(true);
    setValidationErrors([]);
    try {
      const res = await briefService.validateExtract(roomId, pastedJson.trim());
      if (res.valid) {
        toast.success('Fields extracted successfully!');
        setValidateDialogOpen(false);
        onExtracted(res.fields, (res as any).brief);
      } else {
        setValidationErrors(res.errors || ['Validation failed']);
      }
    } catch (err: any) {
      setValidationErrors([err.message || 'Invalid format']);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExtractSubmit = async () => {
    const trimmed = eventDetailsText.trim();
    if (!trimmed) {
      setExtractError('Please paste the event details to extract.');
      return;
    }
    if (trimmed.length > MAX_CHAR_COUNT) {
      setExtractError(`Text exceeds maximum ${MAX_CHAR_COUNT.toLocaleString()} characters.`);
      return;
    }

    setIsExtracting(true);
    setExtractError(null);
    isCancelledRef.current = false;

    try {
      const res = await briefService.extractBrief(roomId, trimmed);
      if (isCancelledRef.current) return;

      toast.success('Extracted 9 fields. Review and confirm each one.');
      setExtractDialogOpen(false);
      onExtracted(res.fields, res.brief);
    } catch (err: any) {
      if (isCancelledRef.current) return;
      setExtractError(formatAiError(err));
    } finally {
      if (!isCancelledRef.current) {
        setIsExtracting(false);
      }
    }
  };

  const handleCancelExtraction = () => {
    isCancelledRef.current = true;
    setIsExtracting(false);
    toast.info('Extraction cancelled');
  };

  const extractButton = (
    <Button
      size="sm"
      onClick={() => {
        setExtractDialogOpen(true);
        setExtractError(null);
      }}
      disabled={!aiEnabled}
      className="text-xs h-8 gap-1.5"
    >
      <Sparkles className="size-3.5" />
      Extract with AI
    </Button>
  );

  return (
    <TooltipProvider>
      <div className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs text-foreground font-medium">
            We read the file. Fill the fields from the source, or extract them with an AI chat
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPrompt}
            className="text-xs h-8 gap-1.5"
          >
            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied prompt' : 'Copy extraction prompt'}
          </Button>

          {/* Dialog: Paste AI reply & Validate (manual JSON fallback) */}
          <Dialog open={validateDialogOpen} onOpenChange={setValidateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-8">
                Paste AI reply & Validate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold">Paste AI Extraction Result</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 py-2">
                <p className="text-xs text-muted-foreground">
                  Paste the JSON returned by your AI model below:
                </p>
                <textarea
                  rows={6}
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder='{"problemStatement": "...", "targetAudience": "...", "rubric": [...]}'
                  className="w-full p-3 rounded-xl bg-muted font-mono text-xs border border-border focus:ring-1 focus:ring-primary outline-none"
                />
                {validationErrors.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 space-y-1">
                    {validationErrors.map((err, i) => (
                      <div key={i}>&bull; {err}</div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleValidate}
                    disabled={!pastedJson.trim() || isValidating}
                    className="text-xs"
                  >
                    {isValidating ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                    Validate & Apply
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog: "Paste the event details" for Extract with AI */}
          <Dialog open={extractDialogOpen} onOpenChange={(open) => {
            if (!isExtracting) {
              setExtractDialogOpen(open);
              if (!open) setExtractError(null);
            }
          }}>
            {!aiEnabled ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{extractButton}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI is not configured on the server</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              extractButton
            )}

            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Paste the event details</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-3 py-2">
                {isExtracting ? (
                  <div className="py-4">
                    <AiGeneratingSkeleton
                      status={ROTATING_STATUS_LINES[statusStepIdx]}
                      onCancel={handleCancelExtraction}
                      rows={4}
                    />
                  </div>
                ) : (
                  <>
                    <textarea
                      rows={9}
                      value={eventDetailsText}
                      maxLength={MAX_CHAR_COUNT}
                      onChange={(e) => {
                        setEventDetailsText(e.target.value);
                        setExtractError(null);
                      }}
                      placeholder="Paste anything: the problem statement, rules, rubric, dates. Any format works."
                      className="w-full p-3.5 rounded-xl bg-muted font-sans text-xs border border-border focus:ring-1 focus:ring-primary outline-none leading-relaxed"
                    />

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        {eventDetailsText.length.toLocaleString()} / {MAX_CHAR_COUNT.toLocaleString()} characters
                      </span>
                    </div>

                    {extractError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <AlertCircle className="size-4 shrink-0" />
                          <span>{extractError}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleExtractSubmit}
                          className="h-7 px-2.5 text-xs text-red-700 hover:text-red-800 font-semibold"
                        >
                          Retry
                        </Button>
                      </div>
                    )}

                    <div className="flex justify-end gap-2.5 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setExtractDialogOpen(false);
                          setExtractError(null);
                        }}
                        className="text-xs h-9"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleExtractSubmit}
                        disabled={!eventDetailsText.trim()}
                        className="text-xs h-9 px-5 bg-[#101012] text-[#F4F1EA] hover:bg-neutral-800 dark:bg-[#F4F1EA] dark:text-[#101012] dark:hover:bg-neutral-200 font-semibold cursor-pointer"
                      >
                        <Sparkles className="size-3.5 mr-1.5" />
                        Extract
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
}
