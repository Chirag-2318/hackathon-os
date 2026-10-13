import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { docsService } from '@/services/docsService';
import {
  type Format,
  EASE,
  EXIT,
  SETTLE,
  SHORTCUTS,
  offsetsOf,
  restore,
  keepSelection,
  markOf,
  splitText,
  formatsOf,
  markRuns,
  isolate,
  drawInTurn,
  arrive,
  leave,
  rewrites,
} from './editor-utils';
import { SelectionToolbar } from './selection-toolbar';

export interface AiEditorProps {
  title?: string;
  children: string;
  roomId?: string;
  fileName?: string;
  onContentChange?: (content: string) => void;
  className?: string;
}

export function AiEditor({
  title,
  children,
  roomId,
  fileName = 'document.md',
  onContentChange,
  className,
}: AiEditorProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const prose = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const asking = useRef(false);
  const lastSelectedText = useRef<string>('');

  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const [askMode, setAskMode] = useState(false);
  const [formats, setFormats] = useState<ReadonlySet<Format>>(new Set());

  const applyFormat = useCallback((format: Format, instant = false) => {
    const root = prose.current;
    const selection = window.getSelection();
    if (!root || !selection?.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) return;
    const offsets = offsetsOf(root);

    const nodes = splitText(range, root);
    const first = nodes[0];
    const last = nodes.at(-1);
    if (!first || !last) return;
    if (nodes.every((node) => markOf(node, format, root))) {
      const owners = new Map<HTMLElement, Text[]>();
      for (const node of nodes) {
        const mark = markOf(node, format, root);
        if (mark) owners.set(mark, [...(owners.get(mark) ?? []), node]);
      }
      for (const [mark, inside] of owners) {
        isolate(mark, inside[0] ?? first, inside.at(-1) ?? last);
        leave(mark, format, root, instant);
      }
    } else {
      const marks = markRuns(
        nodes.filter((node) => !markOf(node, format, root)),
        format
      );
      if (!instant) drawInTurn(marks, format);
      for (const mark of marks) arrive(mark, format, instant);
    }

    rewrites.set(root, performance.now());
    restore(root, offsets);
    if (selection.rangeCount) setFormats(formatsOf(selection.getRangeAt(0), root));
  }, []);

  const enterAskMode = useCallback(() => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      lastSelectedText.current = selection.toString();
      if ('highlights' in CSS) {
        try {
          (CSS as any).highlights.set('editor-ask', new (window as any).Highlight(selection.getRangeAt(0).cloneRange()));
        } catch {}
      }
    }
    asking.current = true;
    setAskMode(true);
  }, []);

  useEffect(() => {
    let timer = 0;

    const show = () => {
      const selection = window.getSelection();
      const proseEl = prose.current;
      const wrapEl = wrap.current;
      if (
        !selection ||
        selection.isCollapsed ||
        !proseEl ||
        !wrapEl ||
        !proseEl.contains(selection.anchorNode) ||
        !proseEl.contains(selection.focusNode)
      ) {
        setAt(null);
        return;
      }
      lastSelectedText.current = selection.toString();
      const box = selection.getRangeAt(0).getBoundingClientRect();
      const origin = wrapEl.getBoundingClientRect();
      setAt({ x: box.left + box.width / 2 - origin.left, y: box.top - origin.top });
      setFormats(formatsOf(selection.getRangeAt(0), proseEl));
    };

    const onSelectionChange = () => {
      const proseEl = prose.current;
      if (asking.current || (proseEl && performance.now() - (rewrites.get(proseEl) ?? 0) < 100))
        return;
      window.clearTimeout(timer);
      setAt(null);
      if (!dragging.current) timer = window.setTimeout(show, SETTLE);
    };

    const onPointerDown = (event: PointerEvent) => {
      if ((event.target as Element).closest('[data-editor-toolbar]')) return;
      if ('highlights' in CSS) {
        try {
          (CSS as any).highlights.delete('editor-ask');
        } catch {}
      }
      asking.current = false;
      setAskMode(false);
      dragging.current = true;
      window.clearTimeout(timer);
      setAt(null);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (asking.current || (event.target as Element).closest('[data-editor-toolbar]')) return;
      dragging.current = false;
      show();
    };

    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  const handleExecutePrompt = async (promptQuery: string): Promise<string> => {
    if (!roomId) {
      return `[Groq AI simulation]: Analyzing ${fileName} for "${promptQuery}". Everything adheres to hackathon guidelines.`;
    }
    const res = await docsService.askDocAi(roomId, fileName, {
      prompt: promptQuery,
      selectedText: lastSelectedText.current,
      fullContent: prose.current?.innerText || children,
    });
    return res.answer;
  };

  const handleReplaceSelection = (replacement: string) => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(replacement));
      if (prose.current && onContentChange) {
        onContentChange(prose.current.innerText);
      }
      toast.success('Replaced with Groq AI response');
    }
    setAt(null);
  };

  const handleInsertText = (textToInsert: string) => {
    if (prose.current) {
      const current = prose.current.innerText;
      const updated = current + '\n\n' + textToInsert;
      prose.current.innerText = updated;
      onContentChange?.(updated);
      toast.success('Inserted into document');
    }
    setAt(null);
  };

  return (
    <div ref={wrap} className={cn('relative w-full', className)}>
      <div
        ref={prose}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        role="textbox"
        aria-multiline="true"
        aria-label={title ?? 'Document'}
        dir="auto"
        onInput={() => {
          if (prose.current && onContentChange) {
            onContentChange(prose.current.innerText);
          }
        }}
        onKeyDown={(event) => {
          if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
          const format = SHORTCUTS[event.key.toLowerCase()];
          if (!format) return;
          event.preventDefault();
          applyFormat(format, true);
        }}
        className="outline-none min-h-[420px] focus:ring-0 text-foreground"
      >
        {title ? (
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4 pb-2 border-b border-border">
            {title}
          </h2>
        ) : null}

        <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground select-text">
          {children}
        </div>
      </div>

      <AnimatePresence>
        {at && (
          <motion.div
            key="toolbar"
            className="absolute z-50 pointer-events-auto"
            style={{ left: Math.max(160, Math.min(at.x, (wrap.current?.offsetWidth || 600) - 160)), top: at.y }}
            initial={{ opacity: 0, scale: 0.96, y: 6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.99, y: 2, transition: EXIT }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <div className="absolute bottom-2 left-0 -translate-x-1/2">
              <SelectionToolbar
                askMode={askMode}
                onAsk={enterAskMode}
                formats={formats}
                onFormat={(format) => applyFormat(format)}
                onExecutePrompt={handleExecutePrompt}
                onInsertText={handleInsertText}
                onReplaceSelection={handleReplaceSelection}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { AiEditor as Editor };
