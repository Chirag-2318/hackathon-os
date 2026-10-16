import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Copy, Download, Edit3, Eye, Code, AlertTriangle, CheckCircle2,
  Check, WifiOff, Loader2, Sparkles
} from 'lucide-react';
import type { DocFile } from '@/services/types';
import { MarkdownRenderer } from '@/utils/markdown';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { checkDocHealth } from './docs-list-pane';
import { toast } from 'sonner';
import { AiEditor } from './ai-editor';

export interface DocsCenterPaneProps {
  file: DocFile;
  onSaveContent: (newContent: string) => Promise<void>;
  roomId?: string;
}

export function DocsCenterPane({ file, onSaveContent, roomId }: DocsCenterPaneProps) {
  const location = useLocation();
  const [mode, setMode] = useState<'ai-editor' | 'preview' | 'markdown' | 'edit'>('ai-editor');
  const [editText, setEditText] = useState(file.content);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'offline'>('idle');
  const debounceTimerRef = useRef<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditText(file.content);
    setSaveStatus('idle');
  }, [file.id, file.content]);

  // Restore return state if coming back from Diagram Studio
  useEffect(() => {
    const returnState = (location.state as any) || (roomId ? (() => {
      try {
        const item = sessionStorage.getItem(`docs_diagram_return_${roomId}`);
        return item ? JSON.parse(item) : null;
      } catch (e) { return null; }
    })() : null);

    if (returnState?.source === 'docs' && (returnState.docId === file.id || returnState.docName === file.name)) {
      if (returnState.viewMode) {
        setMode(returnState.viewMode);
      }
      setTimeout(() => {
        if (returnState.scrollTop && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = returnState.scrollTop;
        }
        const targetEl =
          (returnState.blockIndex !== undefined ? document.getElementById(`diagram-block-${returnState.blockIndex}`) : null) ||
          (returnState.headingSlug ? document.getElementById(returnState.headingSlug) : null);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetEl.classList.add('ring-2', 'ring-indigo-500/80', 'transition-all', 'duration-500');
          setTimeout(() => {
            targetEl.classList.remove('ring-2', 'ring-indigo-500/80');
          }, 1200);
        }
      }, 200);
    }
  }, [file.id, file.name, location.state, roomId]);

  // Unsaved changes navigation warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (mode === 'edit' && editText !== file.content) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mode, editText, file.content]);

  // Autosave: debounce 1.5s
  useEffect(() => {
    if (mode !== 'edit' || editText === file.content) return;

    if (!navigator.onLine) {
      setSaveStatus('offline');
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!navigator.onLine) {
        setSaveStatus('offline');
        return;
      }

      setSaveStatus('saving');
      try {
        await onSaveContent(editText);
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus((s) => (s === 'saved' ? 'idle' : s));
        }, 3000);
      } catch (err) {
        setSaveStatus('idle');
      }
    }, 1500);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [editText, mode, file.content, onSaveContent]);

  const health = checkDocHealth(file.name, file.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    toast.success(`Copied ${file.name}`);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([file.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${file.name}`);
  };

  const handleManualSave = async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSaveStatus('saving');
    try {
      await onSaveContent(editText);
      setSaveStatus('saved');
      setMode('preview');
      toast.success(`Saved v${(file.version || 1) + 1}`);
    } catch {
      setSaveStatus('idle');
    }
  };

  const handleCancelEdit = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setEditText(file.content);
    setSaveStatus('idle');
    setMode('preview');
  };

  const lastEditedBy = (file as any).lastEditedBy || (file as any).author || 'teammate';
  const relativeTime = file.updatedAt
    ? 'recently'
    : 'just now';

  return (
    <div className="flex-1 flex flex-col h-full bg-background min-w-0">
      {/* Sticky Document Header (56px) */}
      <div className="h-14 px-5 border-b border-border flex items-center justify-between shrink-0 bg-background/95 backdrop-blur-xs select-none">
        <div className="flex items-center gap-2.5 truncate">
          <h2 className="text-sm font-semibold font-mono text-foreground truncate">
            {file.name}
          </h2>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
            v{file.version || 1}
          </span>

          {/* Health Chip with Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'h-6 px-2 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0',
                  health.isHealthy
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                )}
              >
                {health.isHealthy ? (
                  <>
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    <span>All checks passed</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-3 text-amber-600" />
                    <span>{health.warnings.length} warning{health.warnings.length > 1 ? '' : ''}</span>
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-3 text-xs">
              <h4 className="font-semibold text-foreground mb-1.5">Document Structure</h4>
              {health.isHealthy ? (
                <p className="text-muted-foreground">All required headings and formats are present.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  <p className="text-amber-600 font-medium">Warnings detected:</p>
                  {health.warnings.map((w, idx) => (
                    <span key={idx} className="text-muted-foreground">• {w}</span>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {mode !== 'edit' ? (
            <>
              {/* SegmentedControl AI Editor | Preview | Markdown */}
              <SegmentedControl className="h-8">
                <SegmentedControlItem
                  active={mode === 'ai-editor'}
                  onClick={() => setMode('ai-editor')}
                  className="gap-1.5 text-xs px-2.5 font-medium"
                >
                  <Sparkles className="size-3 text-indigo-500" />
                  <span>AI Editor</span>
                </SegmentedControlItem>
                <SegmentedControlItem
                  active={mode === 'preview'}
                  onClick={() => setMode('preview')}
                  className="gap-1 text-xs px-2.5"
                >
                  <Eye className="size-3" />
                  <span>Preview</span>
                </SegmentedControlItem>
                <SegmentedControlItem
                  active={mode === 'markdown'}
                  onClick={() => setMode('markdown')}
                  className="gap-1 text-xs px-2.5"
                >
                  <Code className="size-3" />
                  <span>Markdown</span>
                </SegmentedControlItem>
              </SegmentedControl>

              <button
                onClick={handleCopy}
                className="size-8 rounded-lg border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                title="Copy markdown content"
              >
                <Copy className="size-3.5" />
              </button>

              <button
                onClick={handleDownloadMd}
                className="size-8 rounded-lg border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                title={`Download ${file.name}`}
              >
                <Download className="size-3.5" />
              </button>

              <button
                onClick={() => setMode('edit')}
                className="h-8 px-2.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors"
                title="Edit document"
              >
                <Edit3 className="size-3.5" />
                <span>Raw Edit</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {/* Status indicator in corner */}
              <div className="flex items-center gap-1.5 mr-2 text-xs font-medium">
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                    <Loader2 className="size-3 animate-spin" />
                    <span>Saving...</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check className="size-3 stroke-[2.5]" />
                    <span>Saved</span>
                  </span>
                )}
                {saveStatus === 'offline' && (
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <WifiOff className="size-3" />
                    <span>Offline, will not save</span>
                  </span>
                )}
              </div>

              <button
                onClick={handleCancelEdit}
                className="h-8 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                Done
              </button>
              <button
                onClick={handleManualSave}
                disabled={saveStatus === 'saving'}
                className="h-8 px-3 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black text-xs font-semibold hover:bg-black disabled:opacity-50"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
        <div className="flex-1">
          {mode === 'ai-editor' && (
            <div className="max-w-[760px] mx-auto">
              <div className="mb-4 p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="editor-orb size-4" />
                  <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                    Groq AI Document Assistant
                  </span>
                  <span className="text-muted-foreground hidden sm:inline">
                    • Highlight text to format or Ask Groq AI
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full font-medium">
                    Groq LLaMA 3.3
                  </span>
                </div>
              </div>

              <AiEditor
                roomId={roomId}
                fileName={file.name}
                onContentChange={(newContent) => {
                  setEditText(newContent);
                }}
              >
                {editText}
              </AiEditor>
            </div>
          )}

          {mode === 'preview' && (
            <div className="max-w-[760px] mx-auto">
              <MarkdownRenderer
                content={file.content}
                docId={file.id}
                docName={file.name}
                viewMode={mode}
              />
            </div>
          )}

          {mode === 'markdown' && (
            <div className="max-w-[840px] mx-auto rounded-xl bg-muted/40 border border-border p-4 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text">
              {file.content.split('\n').map((line, i) => (
                <div key={i} className="flex gap-4">
                  <span className="w-8 shrink-0 text-right text-muted-foreground/50 select-none font-mono">
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0 break-words">{line}</span>
                </div>
              ))}
            </div>
          )}

          {mode === 'edit' && (
            <div className="h-full flex flex-col min-h-[500px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full flex-1 min-h-[500px] p-4 rounded-xl border border-border bg-card font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                autoFocus
                placeholder="Start typing markdown content..."
              />
            </div>
          )}
        </div>

        {/* Footer: Metadata & Last Edited Tag */}
        <div className="mt-8 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Last edited by <span className="font-medium text-foreground">@{lastEditedBy}</span>, {relativeTime}
          </span>
          <span className="font-mono text-[11px]">
            {file.content.length} chars • {file.content.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
      </div>
    </div>
  );
}
