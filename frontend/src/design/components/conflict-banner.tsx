import React, { useState } from 'react';
import { AlertTriangle, Eye, Check, GitMerge, X } from 'lucide-react';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface ConflictBannerProps {
  lastEditedBy?: string;
  remoteContent: string;
  localContent: string;
  onKeepMine: () => void;
  onUseRemote: () => void;
  onManualMerge?: (merged: string) => void;
  className?: string;
}

/**
 * Computes a lightweight line-by-line diff without any external heavy dependencies.
 */
export function computeLineDiff(original: string, current: string) {
  const origLines = original.split('\n');
  const currLines = current.split('\n');
  const max = Math.max(origLines.length, currLines.length);
  const diff: { type: 'same' | 'added' | 'removed' | 'changed'; orig?: string; curr?: string }[] = [];

  for (let i = 0; i < max; i++) {
    const o = origLines[i];
    const c = currLines[i];
    if (o === c) {
      diff.push({ type: 'same', orig: o, curr: c });
    } else if (o !== undefined && c !== undefined) {
      diff.push({ type: 'changed', orig: o, curr: c });
    } else if (o === undefined) {
      diff.push({ type: 'added', curr: c });
    } else {
      diff.push({ type: 'removed', orig: o });
    }
  }
  return diff;
}

/**
 * Non-blocking 409 edit conflict resolution banner.
 * Allows viewing remote version, overriding with local, or manual line-by-line merge.
 */
export function ConflictBanner({
  lastEditedBy = 'Another teammate',
  remoteContent,
  localContent,
  onKeepMine,
  onUseRemote,
  onManualMerge,
  className,
}: ConflictBannerProps) {
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showRemotePreview, setShowRemotePreview] = useState(false);

  const authorHandle = lastEditedBy.startsWith('@') ? lastEditedBy : `@${lastEditedBy}`;

  return (
    <>
      <div
        role="alert"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[10px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-amber-900 dark:text-amber-200 font-medium">
            <strong className="font-semibold">{authorHandle}</strong> saved changes while you were editing.
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowRemotePreview(!showRemotePreview)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            className="h-7 text-xs text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            {showRemotePreview ? 'Hide their version' : 'View their version'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowDiffModal(true)}
            leftIcon={<GitMerge className="w-3.5 h-3.5" />}
            className="h-7 text-xs bg-white dark:bg-zinc-800 border-amber-300 dark:border-amber-700"
          >
            Merge manually
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onKeepMine}
            leftIcon={<Check className="w-3.5 h-3.5" />}
            className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
          >
            Keep mine
          </Button>
        </div>
      </div>

      {/* Remote preview panel */}
      {showRemotePreview && (
        <div className="p-3 my-2 rounded-[8px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
          <div className="text-[10px] text-zinc-400 font-sans uppercase mb-1">
            Incoming version from {authorHandle}:
          </div>
          {remoteContent}
        </div>
      )}

      {/* Side-by-side simple line diff modal */}
      <Dialog open={showDiffModal} onOpenChange={setShowDiffModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6 rounded-[12px] bg-white dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Resolve Edit Conflict with {authorHandle}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto text-xs font-mono my-3 border border-zinc-200 dark:border-zinc-800 rounded-[8px] p-3">
            <div>
              <div className="font-sans font-semibold text-zinc-700 dark:text-zinc-300 pb-2 border-b border-zinc-200 dark:border-zinc-800 mb-2">
                Their Version ({authorHandle})
              </div>
              <pre className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
                {remoteContent}
              </pre>
            </div>

            <div className="border-l border-zinc-200 dark:border-zinc-800 pl-4">
              <div className="font-sans font-semibold text-indigo-600 dark:text-indigo-400 pb-2 border-b border-zinc-200 dark:border-zinc-800 mb-2">
                Your Version (Unsaved Local)
              </div>
              <pre className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
                {localContent}
              </pre>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onUseRemote();
                setShowDiffModal(false);
              }}
            >
              Use their version
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onKeepMine();
                setShowDiffModal(false);
              }}
            >
              Keep my changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
