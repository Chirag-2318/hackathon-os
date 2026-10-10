import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Copy, Download, Edit3, Check, X, Eye, Code, AlertTriangle, CheckCircle2
} from 'lucide-react';
import type { DocFile } from '@/services/types';
import { MarkdownRenderer } from '@/utils/markdown';
import { SegmentedControl, SegmentedControlItem } from '@/components/primitives/segmented-control';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { checkDocHealth } from './docs-list-pane';
import { toast } from 'sonner';

export interface DocsCenterPaneProps {
  file: DocFile;
  onSaveContent: (newContent: string) => Promise<void>;
}

export function DocsCenterPane({ file, onSaveContent }: DocsCenterPaneProps) {
  const [mode, setMode] = useState<'preview' | 'markdown' | 'edit'>('preview');
  const [editText, setEditText] = useState(file.content);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditText(file.content);
    if (mode === 'edit') setMode('preview');
  }, [file.id, file.content]);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveContent(editText);
      setMode('preview');
      toast.success(`Saved v${(file.version || 1) + 1}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(file.content);
    setMode('preview');
  };

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
                    <span>{health.warnings.length} warning{health.warnings.length > 1 ? 's' : ''}</span>
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
              {/* SegmentedControl Preview | Markdown */}
              <SegmentedControl className="h-8">
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
                className="h-8 px-2.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-black transition-colors"
              >
                <Edit3 className="size-3" />
                <span>Edit</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                className="h-8 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-3 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black text-xs font-semibold hover:bg-black disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {mode === 'preview' && (
          <div className="max-w-[760px] mx-auto">
            <MarkdownRenderer content={file.content} />
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
          <div className="h-full flex flex-col">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full h-full min-h-[500px] p-4 rounded-xl border border-border bg-card font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}
