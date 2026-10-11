import React, { useState, useEffect } from 'react';
import {
  Snowflake, CheckCircle2, AlertTriangle, Copy, Check, ExternalLink,
  ChevronDown, Shield, GitCommit
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { Branch, FrozenDemo, HealthItem, Commit } from '@/services/types';

interface FreezeDemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  health: HealthItem[];
  existingFreeze?: FrozenDemo | null;
  repoFullName: string;
  onConfirmFreeze: (data: {
    branch: string;
    tag: string;
    sha: string;
    message: string;
  }) => Promise<void>;
}

export function FreezeDemoDialog({
  open,
  onOpenChange,
  branches,
  health,
  existingFreeze,
  repoFullName,
  onConfirmFreeze,
}: FreezeDemoDialogProps) {
  // Default to demo-safe if available, else main
  const defaultBranch =
    branches.find((b) => b.role === 'demo-safe')?.name ||
    branches.find((b) => b.role === 'main')?.name ||
    branches[0]?.name ||
    'main';

  const [selectedBranchName, setSelectedBranchName] = useState(defaultBranch);
  const [tagName, setTagName] = useState('demo-v1');
  const [tagError, setTagError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);

  useEffect(() => {
    if (open) {
      setIsSuccess(false);
      setSelectedBranchName(
        existingFreeze?.branch ||
          branches.find((b) => b.role === 'demo-safe')?.name ||
          'main'
      );
      setTagName(existingFreeze ? `${existingFreeze.tag}-rev` : 'demo-v1');
      setTagError('');
    }
  }, [open]);

  const selectedBranch =
    branches.find((b) => b.name === selectedBranchName) || branches[0];

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setTagName(val);
    if (!val) {
      setTagError('Tag name is required');
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(val)) {
      setTagError('Tag can only contain letters, numbers, hyphens, and dots');
    } else {
      setTagError('');
    }
  };

  const handleFreeze = async () => {
    if (!tagName || tagError || !selectedBranch) return;
    setIsSubmitting(true);
    try {
      await onConfirmFreeze({
        branch: selectedBranch.name,
        tag: tagName,
        sha: selectedBranch.lastCommitSha,
        message: selectedBranch.lastCommitMessage,
      });
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySha = () => {
    if (selectedBranch) {
      navigator.clipboard.writeText(selectedBranch.lastCommitSha);
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 1500);
    }
  };

  // Live checklist checks
  const readmeCheck = health.find((h) => h.id === 'gc-1')?.status === 'pass';
  const secretsCheck = health.find((h) => h.id === 'gc-4')?.status === 'pass';
  const isBranchBehind = (selectedBranch?.behind || 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="freeze-demo-dialog" className="max-w-[520px] rounded-[24px] p-6 font-[var(--font-inter)] shadow-xl">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Snowflake className="size-5 text-blue-600" />
                <span>{existingFreeze ? 'Re-freeze the demo' : 'Freeze the demo'}</span>
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground pt-1 leading-relaxed">
                Record the exact commit you will demo on stage. If more commits land on this
                branch later, you will be alerted to re-verify the demo build.
              </DialogDescription>
            </DialogHeader>

            {existingFreeze && (
              <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-1">
                <div className="font-medium text-foreground">Current demo freeze:</div>
                <div className="text-muted-foreground font-mono">
                  {existingFreeze.tag} @ {existingFreeze.sha} ({existingFreeze.branch}) · frozen{' '}
                  {formatDistanceToNow(new Date(existingFreeze.frozenAt), { addSuffix: true })}
                </div>
              </div>
            )}

            <div className="space-y-4 my-2 text-xs">
              {/* Branch Selector */}
              <div>
                <label className="font-semibold text-foreground block mb-1.5">
                  Select demo branch
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-9 px-3 rounded-lg border border-border bg-surface hover:bg-muted/30 text-xs font-mono flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-semibold text-foreground">
                        {selectedBranch?.name}
                      </span>
                      <ChevronDown className="size-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[470px] font-[var(--font-inter)] text-xs">
                    {branches.map((b) => (
                      <DropdownMenuItem
                        key={b.name}
                        onClick={() => setSelectedBranchName(b.name)}
                        className="cursor-pointer flex items-center justify-between font-mono"
                      >
                        <span className="font-medium">{b.name}</span>
                        <span className="text-[10px] text-muted-foreground capitalize font-sans">
                          {b.role}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Head Commit Summary */}
              {selectedBranch && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GitCommit className="size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-foreground">
                          {selectedBranch.lastCommitSha}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopySha}
                          className="text-muted-foreground/60 hover:text-foreground cursor-pointer"
                          title="Copy commit sha"
                        >
                          {copiedSha ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-muted-foreground truncate max-w-sm mt-0.5">
                        {selectedBranch.lastCommitMessage}
                      </p>
                    </div>
                  </div>

                  {selectedBranch.ownerId && (
                    <div
                      className="size-6 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#5B6FF0' }}
                      title={selectedBranch.ownerId}
                    >
                      {selectedBranch.ownerId.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              )}

              {/* Before you freeze checklist */}
              <div>
                <label className="font-semibold text-foreground block mb-2">
                  Before you freeze
                </label>
                <div className="space-y-1.5 p-3 rounded-xl bg-surface border border-border/60">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`size-3.5 ${
                        readmeCheck ? 'text-emerald-500' : 'text-amber-500'
                      }`}
                    />
                    <span>README has run instructions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      className={`size-3.5 ${
                        secretsCheck ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    />
                    <span>No secrets found in repository</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isBranchBehind ? (
                      <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    )}
                    <span className={isBranchBehind ? 'text-amber-700 dark:text-amber-300' : ''}>
                      {isBranchBehind
                        ? `${selectedBranch?.behind} commits behind main`
                        : 'Branch is up to date with main'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span>Deployed live preview link responds</span>
                  </div>
                </div>
              </div>

              {/* Tag Name Field */}
              <div>
                <label className="font-semibold text-foreground block mb-1">Tag name</label>
                <input
                  type="text"
                  value={tagName}
                  onChange={handleTagChange}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-surface font-mono text-xs text-foreground focus:ring-1 focus:ring-ring outline-none"
                  placeholder="demo-v1"
                />
                {tagError && <p className="text-[11px] text-rose-500 mt-1">{tagError}</p>}
              </div>
            </div>

            <DialogFooter className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleFreeze}
                disabled={isSubmitting || Boolean(tagError)}
                className="bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 cursor-pointer text-xs"
              >
                {isSubmitting ? 'Freezing...' : 'Freeze demo'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* ── SUCCESS STATE ── */
          <div className="py-4 text-center space-y-4">
            <div className="size-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-7 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-lg font-semibold text-foreground">Demo frozen</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Commit <span className="font-mono font-medium text-foreground">{selectedBranch?.lastCommitSha}</span> is recorded under tag{' '}
                <span className="font-mono font-semibold text-foreground">{tagName}</span>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full sm:w-auto text-xs cursor-pointer gap-1.5"
              >
                <a
                  href={`https://github.com/${repoFullName}/releases/new?tag=${tagName}&target=${selectedBranch?.lastCommitSha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Create tag on GitHub</span>
                </a>
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-xs cursor-pointer"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
