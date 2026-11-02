import React, { useState, useMemo } from 'react';
import { AlertTriangle, Check, Eye, GitMerge, RefreshCw, X } from 'lucide-react';
import { diffLines, diffWordsWithSpace } from 'diff';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType?: string; // e.g. "document", "idea", "pitch", "room settings"
  entityName?: string;
  localContent: string;
  remoteContent: string;
  serverVersion: number;
  lastEditorName?: string;
  updatedAt?: string;
  onKeepMine: (serverVersion: number) => Promise<void> | void;
  onTakeTheirs: (serverContent: string, serverVersion: number) => Promise<void> | void;
  onSaveMerged: (mergedContent: string, serverVersion: number) => Promise<void> | void;
}

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export function formatTimeAgo(dateString?: string): string {
  if (!dateString) return 'recently';
  try {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return 'recently';
  }
}

export const ConflictDialog: React.FC<ConflictDialogProps> = ({
  open,
  onOpenChange,
  entityType = 'document',
  entityName,
  localContent,
  remoteContent,
  serverVersion,
  lastEditorName = 'A teammate',
  updatedAt,
  onKeepMine,
  onTakeTheirs,
  onSaveMerged,
}) => {
  const [activeMode, setActiveMode] = useState<'overview' | 'merge'>('overview');
  const [diffMode, setDiffMode] = useState<'lines' | 'words'>('lines');
  const [mergedText, setMergedText] = useState(localContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset mergedText when local content or dialog opens
  React.useEffect(() => {
    if (open) {
      setMergedText(localContent);
      setActiveMode('overview');
    }
  }, [open, localContent]);

  const timeAgo = formatTimeAgo(updatedAt);
  const editorDisplay = lastEditorName.startsWith('@') ? lastEditorName : `@${lastEditorName}`;

  // Compute diffs
  const diffChanges: DiffPart[] = useMemo(() => {
    try {
      if (diffMode === 'lines') {
        return diffLines(remoteContent || '', localContent || '') as DiffPart[];
      } else {
        return diffWordsWithSpace(remoteContent || '', localContent || '') as DiffPart[];
      }
    } catch {
      return [{ value: localContent, added: true }, { value: remoteContent, removed: true }];
    }
  }, [remoteContent, localContent, diffMode]);

  const handleKeepMine = async () => {
    setIsSubmitting(true);
    try {
      await onKeepMine(serverVersion);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTakeTheirs = async () => {
    setIsSubmitting(true);
    try {
      await onTakeTheirs(remoteContent, serverVersion);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveMerged = async () => {
    setIsSubmitting(true);
    try {
      await onSaveMerged(mergedText, serverVersion);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 rounded-xl bg-background border shadow-lg">
        <DialogHeader className="gap-1 border-b pb-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle className="text-lg font-semibold text-foreground">
              Edit Conflict Detected
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground font-semibold">{editorDisplay}</strong> saved changes to this {entityType} {timeAgo} while you were editing.
          </p>
        </DialogHeader>

        {activeMode === 'overview' ? (
          <div className="flex flex-col gap-4 py-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Their version */}
              <div className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b pb-2">
                  <span>Server copy ({editorDisplay})</span>
                  <span className="font-mono text-[10px]">v{serverVersion}</span>
                </div>
                <pre className="text-xs font-mono max-h-56 overflow-y-auto whitespace-pre-wrap text-muted-foreground">
                  {remoteContent || '(Empty)'}
                </pre>
              </div>

              {/* Your version */}
              <div className="flex flex-col gap-2 p-3 rounded-lg border border-primary/40 bg-primary/5">
                <div className="flex items-center justify-between text-xs font-semibold text-primary border-b border-primary/20 pb-2">
                  <span>Your unsaved changes (Local draft)</span>
                  <span className="font-mono text-[10px]">Draft saved</span>
                </div>
                <pre className="text-xs font-mono max-h-56 overflow-y-auto whitespace-pre-wrap text-foreground">
                  {localContent || '(Empty)'}
                </pre>
              </div>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-200">
              Your edits are safely stashed in local draft memory so nothing will be lost. Choose how to resolve this collision:
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-3 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between text-xs border-b pb-2">
              <span className="text-muted-foreground font-medium">
                Diff view (<span className="text-rose-600 dark:text-rose-400">red: their server version</span>, <span className="text-emerald-600 dark:text-emerald-400">green: your unsaved edits</span>)
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={diffMode === 'lines' ? 'secondary' : 'ghost'}
                  className="h-6 text-xs px-2"
                  onClick={() => setDiffMode('lines')}
                >
                  Line Diff
                </Button>
                <Button
                  size="sm"
                  variant={diffMode === 'words' ? 'secondary' : 'ghost'}
                  className="h-6 text-xs px-2"
                  onClick={() => setDiffMode('words')}
                >
                  Word Diff
                </Button>
              </div>
            </div>

            {/* Visual diff output */}
            <div className="rounded-lg border bg-muted/20 p-3 font-mono text-xs max-h-48 overflow-y-auto whitespace-pre-wrap">
              {diffChanges.map((part, index) => {
                if (part.added) {
                  return (
                    <span key={index} className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-semibold px-0.5 rounded">
                      {part.value}
                    </span>
                  );
                }
                if (part.removed) {
                  return (
                    <span key={index} className="bg-rose-500/20 text-rose-800 dark:text-rose-200 line-through px-0.5 rounded">
                      {part.value}
                    </span>
                  );
                }
                return <span key={index} className="text-muted-foreground">{part.value}</span>;
              })}
            </div>

            {/* Editable merge target */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="merge-editor" className="text-xs font-semibold text-foreground">
                Merged output (edit to your liking):
              </label>
              <textarea
                id="merge-editor"
                value={mergedText}
                onChange={(e) => setMergedText(e.target.value)}
                rows={6}
                className="w-full rounded-md border bg-background p-2.5 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t pt-4">
          {activeMode === 'overview' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveMode('merge')}
                className="gap-1.5"
                disabled={isSubmitting}
              >
                <GitMerge className="h-4 w-4" />
                Compare & Merge
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTakeTheirs}
                  disabled={isSubmitting}
                >
                  Take theirs (discard mine)
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleKeepMine}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  Keep mine (overwrite)
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveMode('overview')}
                disabled={isSubmitting}
              >
                Back to Overview
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveMerged}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  Save Merged Version
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
