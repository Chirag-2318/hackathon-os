import * as React from 'react';
import { useState } from 'react';
import { CodeBlock } from '@/components/primitives/code-block';
import { Button } from '@/components/ui/button';
import { Copy, Check, X, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { PlanValidateResult } from '@/api/client';
import { useDraftStore } from '@/app/layout/use-draft-store';
import { useParams } from 'react-router-dom';

export interface PromptBridgePanelProps {
  stepId: string;
  stepName: string;
  promptText: string;
  onValidate: (content: string) => Promise<PlanValidateResult>;
  onSuccess: () => void;
}

export function PromptBridgePanel({
  stepId,
  stepName,
  promptText,
  onValidate,
  onSuccess,
}: PromptBridgePanelProps) {
  const { roomId } = useParams<{ roomId: string }>();
  const [copied, setCopied] = useState(false);
  const answer = useDraftStore((s) => s.drafts[roomId || '']?.plan?.answers[stepId] ?? '');
  const setAnswer = useDraftStore((s) => s.setPlanAnswer);
  
  const [isValidating, setIsValidating] = useState(false);
  const [validateResult, setValidateResult] = useState<PlanValidateResult | null>(null);

  // M06 Copy animation
  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleValidate = async () => {
    if (!answer.trim()) return;
    setIsValidating(true);
    setValidateResult(null);
    try {
      const result = await onValidate(answer);
      setValidateResult(result);
      if (result.success) {
        // Allow animation to play before moving on
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 flex-1 max-w-3xl">
      <h2 className="text-h2 text-ink">Step {stepId}: {stepName}</h2>

      {/* 1. Copy Prompt */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-surface-raised text-ink font-bold text-xs">1</span>
            <h3 className="font-bold text-ink">Copy this prompt</h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-ink-muted">~{Math.round(promptText.length / 100) / 10}k chars</span>
            <div className="flex items-center gap-2 text-primary font-medium">
              <span>Open in:</span>
              <a href="https://chatgpt.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                ChatGPT <ExternalLink className="size-3" />
              </a>
              <a href="https://claude.ai" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                Claude <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="relative group">
          <CodeBlock code={promptText} className="max-h-48" />
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 bg-surface rounded-md border border-border shadow-e1 hover:bg-surface-raised transition-colors flex items-center gap-2 text-xs font-semibold"
          >
            {copied ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1 text-success-text"
              >
                <Check className="size-4" /> Copied
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1 text-ink"
              >
                <Copy className="size-4" /> Copy
              </motion.div>
            )}
          </button>
        </div>
      </section>

      {/* 2. Paste Answer */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-surface-raised text-ink font-bold text-xs">2</span>
          <h3 className="font-bold text-ink">Paste the answer</h3>
        </div>
        <textarea
          className="w-full h-32 rounded-xl border border-border bg-surface p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder="Paste the generated response here..."
          value={answer}
          onChange={(e) => setAnswer(roomId || '', stepId, e.target.value)}
        />
      </section>

      {/* 3. Check it */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-surface-raised text-ink font-bold text-xs">3</span>
            <h3 className="font-bold text-ink">Check it</h3>
          </div>
          <Button
            variant="default"
            onClick={handleValidate}
            disabled={isValidating || !answer.trim() || validateResult?.success}
            className="w-32 justify-center"
          >
            {isValidating ? <Loader2 className="size-4 animate-spin" /> : 'Validate'}
          </Button>
        </div>

        {/* Validate Result - M06 */}
        <AnimatePresence>
          {validateResult && !validateResult.success && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl border border-coral/30 bg-coral/5 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-coral font-bold">
                  <X className="size-4" /> Validation Failed
                </div>
                <ul className="list-disc list-inside text-sm text-ink-muted pl-2">
                  {validateResult.missingItems?.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.04 }}
                    >
                      {item}
                    </motion.li>
                  ))}
                </ul>
                {validateResult.repairPrompt && (
                  <div className="mt-2 flex items-center justify-between bg-surface p-3 rounded-lg border border-border">
                    <p className="text-xs text-ink-muted font-mono truncate mr-4">{validateResult.repairPrompt}</p>
                    <Button variant="secondary" size="sm" className="shrink-0 text-xs">
                      Copy repair prompt
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {validateResult && validateResult.success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-success-text font-bold"
            >
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Check className="size-5" />
              </motion.div>
              Validation Passed
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
