import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconArrowRight,
  IconBold,
  IconCode,
  IconItalic,
  IconStrikethrough,
  IconUnderline,
  IconCheck,
  IconCopy,
  IconCornerDownLeft,
} from '@tabler/icons-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Orb, type OrbVariant } from '@/components/ui/orb';
import { StreamingText } from '@/components/ui/streaming-text';
import { TextShimmer } from '@/components/ui/text-shimmer';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AiGate } from '@/features/ai-gate';
import type { Format } from './editor-utils';
import { EASE } from './editor-utils';

export const FORMAT_ITEMS = [
  { name: 'Bold', format: 'bold' as Format, icon: IconBold },
  { name: 'Italic', format: 'italic' as Format, icon: IconItalic },
  { name: 'Underline', format: 'underline' as Format, icon: IconUnderline },
  { name: 'Strikethrough', format: 'strikethrough' as Format, icon: IconStrikethrough },
  { name: 'Code', format: 'code' as Format, icon: IconCode },
] as const;

const SWAP =
  'transition-[opacity,filter,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';
const OUT = `${SWAP} group-data-ask:pointer-events-none group-data-ask:-translate-x-2 rtl:group-data-ask:translate-x-2 group-data-ask:opacity-0 group-data-ask:blur-[2px]`;
const IN = `pointer-events-none translate-x-2 rtl:-translate-x-2 opacity-0 blur-[2px] delay-100 ${SWAP} group-data-ask:pointer-events-auto group-data-ask:translate-x-0 group-data-ask:opacity-100 group-data-ask:blur-none group-data-sent:pointer-events-none group-data-sent:-translate-x-2 rtl:group-data-sent:translate-x-2 group-data-sent:opacity-0 group-data-sent:blur-[2px] group-data-sent:delay-0`;
const SENT = `pointer-events-none translate-x-2 rtl:-translate-x-2 opacity-0 blur-[2px] delay-100 ${SWAP} group-data-sent:translate-x-0 group-data-sent:opacity-100 group-data-sent:blur-none`;

const SOURCES = ['groq.com', 'brackit', 'wikipedia.org'];

const STAGES = {
  understanding: { label: 'Understanding document context…', orb: 'S3' },
  gathering: { label: 'Consulting Groq LLM…', orb: 'S2' },
} as const satisfies Record<string, { label: string; orb: OrbVariant }>;

const ANSWER_WORD_MS = 24;

export interface SelectionToolbarProps {
  askMode: boolean;
  onAsk: () => void;
  formats: ReadonlySet<Format>;
  onFormat: (format: Format) => void;
  onExecutePrompt: (query: string) => Promise<string>;
  onInsertText?: (text: string) => void;
  onReplaceSelection?: (text: string) => void;
}

export function SelectionToolbar({
  askMode,
  onAsk,
  formats,
  onFormat,
  onExecutePrompt,
  onInsertText,
  onReplaceSelection,
}: SelectionToolbarProps) {
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const side = isRtl ? -1 : 1;

  const [query, setQuery] = useState<string | null>(null);
  const [stage, setStage] = useState<keyof typeof STAGES>('understanding');
  const [answering, setAnswering] = useState(false);
  const [shown, setShown] = useState(0);
  const [height, setHeight] = useState(0);
  const [answer, setAnswer] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const words = answer.split(' ');

  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [stage, answering, shown, answer]);

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    const tStage = window.setTimeout(() => {
      if (!cancelled) setStage('gathering');
    }, 600);

    onExecutePrompt(query)
      .then((resText) => {
        if (!cancelled) {
          setAnswer(resText || 'Processed successfully by Groq AI.');
          setAnswering(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setAnswer('Groq response: ' + (err?.message || 'Unable to reach AI gateway.'));
          setAnswering(true);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(tStage);
    };
  }, [query, onExecutePrompt]);

  useEffect(() => {
    if (!answering || shown >= words.length) return;
    const timer = window.setTimeout(() => setShown((c) => c + 1), ANSWER_WORD_MS);
    return () => window.clearTimeout(timer);
  }, [answering, shown, words.length]);

  const submit = () => {
    const val = input.current?.value.trim();
    if (!val || query) return;
    setQuery(val);
    input.current?.blur();
  };

  const handleCopyAnswer = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    toast.success('Copied Groq response');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="toolbar"
      aria-label="Selection"
      data-editor-toolbar
      data-ask={askMode ? '' : undefined}
      data-sent={query ? '' : undefined}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'BUTTON') {
          e.preventDefault();
        }
      }}
      className="group flex origin-bottom scale-90 flex-col overflow-hidden rounded-[22px] border border-border bg-popover/95 backdrop-blur-md whitespace-nowrap text-muted-foreground shadow-2xl"
    >
      <div className="relative flex items-center gap-1 p-1.5">
        <AiGate>
          <button
            type="button"
            onClick={() => {
              if (askMode) return;
              onAsk();
              input.current?.focus({ preventScroll: true });
            }}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-full ps-1.5 pe-2.5 text-sm font-medium text-foreground hover:bg-accent group-data-ask:hover:bg-transparent cursor-pointer"
          >
            <span data-stirring={askMode || undefined} className="editor-orb size-5 shrink-0" />
            <span className={OUT}>Ask AI</span>
          </button>
        </AiGate>

        <div className={cn('mx-1 h-5 w-px shrink-0 bg-border', OUT)} />

        {FORMAT_ITEMS.map(({ name, format, icon: Icon }) => (
          <button
            key={name}
            type="button"
            aria-label={name}
            aria-pressed={formats.has(format)}
            onClick={() => onFormat(format)}
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-accent aria-pressed:bg-accent aria-pressed:text-foreground cursor-pointer',
              OUT
            )}
          >
            <Icon className="size-[1.125rem]" stroke={1.8} />
          </button>
        ))}

        <div className={cn('absolute inset-y-1.5 start-10 end-1.5 flex items-center gap-1', IN)}>
          <input
            ref={input}
            type="text"
            dir="auto"
            aria-label="Ask about the selection"
            placeholder="Ask Groq anything about this doc…"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="h-8 min-w-0 flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            aria-label="Send"
            onClick={submit}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 cursor-pointer"
          >
            <IconArrowRight className="size-4 rtl:-scale-x-100" />
          </button>
        </div>

        <div
          className={cn(
            'absolute inset-y-1.5 start-10 end-3 flex items-center overflow-hidden text-sm font-medium text-foreground',
            SENT
          )}
        >
          <span dir="auto" className="truncate">
            {query}
          </span>
        </div>
      </div>

      <motion.div
        initial={{ height: 0 }}
        animate={{ height }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: EASE }}
        className="overflow-hidden"
      >
        <div ref={panel} className="relative">
          <AnimatePresence mode="popLayout">
            {query && !answering && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 4, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
                transition={{ duration: 0.25, ease: EASE }}
                className="flex items-center gap-1.5 border-t border-border bg-muted/50 px-3.5 py-2.5"
              >
                <Orb
                  key={STAGES[stage].orb}
                  variant={STAGES[stage].orb}
                  label={STAGES[stage].label}
                  className="shrink-0 text-muted-foreground"
                />

                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={stage}
                    initial={{ opacity: 0, y: 6, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -6, filter: 'blur(2px)' }}
                    transition={{ duration: 0.15, ease: EASE }}
                    className="inline-block text-xs"
                  >
                    <TextShimmer duration={1.5}>{STAGES[stage].label}</TextShimmer>
                  </motion.span>
                </AnimatePresence>

                <div className="ms-auto flex items-center ps-2">
                  {stage === 'gathering' &&
                    SOURCES.map((domain, index) => (
                      <motion.img
                        key={domain}
                        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                        alt={domain}
                        initial={{ opacity: 0, x: 10 * side, scale: 0.4 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ delay: index * 0.08, duration: 0.35, ease: EASE }}
                        className="-ms-2 size-5 rounded-full bg-background ring-2 ring-popover first:ms-0"
                      />
                    ))}
                </div>
              </motion.div>
            )}

            {answering && (
              <motion.div
                key="answer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="min-h-[41px] border-t border-border bg-muted/60 p-3.5 flex flex-col gap-2.5"
              >
                <div
                  dir="auto"
                  className="max-w-md text-xs leading-relaxed whitespace-pre-wrap text-foreground max-h-48 overflow-y-auto"
                >
                  <StreamingText>{words.slice(0, shown).join(' ')}</StreamingText>
                </div>

                <div className="flex items-center gap-1.5 pt-1 border-t border-border/50 text-[11px]">
                  {onReplaceSelection && (
                    <button
                      type="button"
                      onClick={() => onReplaceSelection(answer)}
                      className="px-2 py-1 rounded bg-foreground text-background hover:opacity-90 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <IconCornerDownLeft className="size-3" />
                      <span>Replace</span>
                    </button>
                  )}
                  {onInsertText && (
                    <button
                      type="button"
                      onClick={() => onInsertText(answer)}
                      className="px-2 py-1 rounded bg-accent text-foreground hover:bg-muted font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>Insert</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyAnswer}
                    className="px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <IconCheck className="size-3 text-emerald-500" /> : <IconCopy className="size-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
