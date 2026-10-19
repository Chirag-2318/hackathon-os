import React, { useState } from 'react';
import {
  GitBranch, Check, Edit2, MoreHorizontal, ExternalLink,
  Copy, ShieldCheck, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { Branch, BranchRole } from '@/services/types';

interface GithubBranchesTableProps {
  branches: Branch[];
  repoFullName: string;
  onUpdatePurpose: (branchName: string, purpose: string) => Promise<void>;
  onUpdateRole: (branchName: string, role: BranchRole) => Promise<void>;
}

export function GithubBranchesTable({
  branches,
  repoFullName,
  onUpdatePurpose,
  onUpdateRole,
}: GithubBranchesTableProps) {
  const [showStale, setShowStale] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 8;

  // Editing state
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [purposeDraft, setPurposeDraft] = useState('');
  const [savingPurpose, setSavingPurpose] = useState(false);

  // Active menu dropdown
  const [activeMenuBranch, setActiveMenuBranch] = useState<string | null>(null);

  // Filter stale branches (ahead === 0 && behind > 10, or older than 14d)
  const filteredBranches = branches.filter((b) => {
    if (showStale) return true;
    const isStale = (b.behind ?? 0) > 10 && (b.ahead ?? 0) === 0;
    return !isStale;
  });

  const totalPages = Math.ceil(filteredBranches.length / pageSize) || 1;
  const pagedBranches = filteredBranches.slice(page * pageSize, (page + 1) * pageSize);

  const handleStartEdit = (b: Branch) => {
    setEditingBranch(b.name);
    setPurposeDraft(b.purpose || '');
  };

  const handleSavePurpose = async (branchName: string) => {
    try {
      setSavingPurpose(true);
      await onUpdatePurpose(branchName, purposeDraft);
      toast.success('Branch purpose updated');
      setEditingBranch(null);
    } catch {
      toast.error('Failed to update purpose');
    } finally {
      setSavingPurpose(false);
    }
  };

  const handleCopyName = (name: string) => {
    navigator.clipboard.writeText(name);
    toast.success(`Copied "${name}"`);
    setActiveMenuBranch(null);
  };

  const handleSetRole = async (branchName: string, role: BranchRole) => {
    try {
      await onUpdateRole(branchName, role);
      toast.success(`Branch set as ${role}`);
      setActiveMenuBranch(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update branch role');
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Branches</h2>
          <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
            {branches.length}
          </span>
        </div>

        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showStale}
            onChange={(e) => {
              setShowStale(e.target.checked);
              setPage(0);
            }}
            className="size-3.5 rounded border-border accent-primary cursor-pointer"
          />
          <span>Show stale</span>
        </label>
      </div>

      <div className="divide-y divide-border/30">
        {pagedBranches.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No branches found
          </div>
        ) : (
          pagedBranches.map((b) => {
            const isEditing = editingBranch === b.name;
            const isMenuOpen = activeMenuBranch === b.name;
            const role = (b.role || 'normal').toUpperCase();
            const isDemoSafe = role === 'DEMO_SAFE' || role === 'DEMO-SAFE';
            const isMain = role === 'MAIN';
            const branchUrl = `https://github.com/${repoFullName}/tree/${encodeURIComponent(b.name)}`;

            return (
              <div key={b.name} className="py-3 flex flex-col gap-2 relative">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="font-mono text-xs font-semibold text-foreground truncate">
                      {b.name}
                    </span>

                    {/* Role badge */}
                    {isMain ? (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border font-semibold bg-muted text-foreground border-border/60">
                        MAIN
                      </span>
                    ) : isDemoSafe ? (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        DEMO SAFE
                      </span>
                    ) : null}

                    {/* Ahead / Behind count */}
                    {b.ahead != null && b.behind != null && !isMain && (
                      <span className="font-mono text-[11px] text-muted-foreground hidden sm:inline">
                        +{b.ahead} / -{b.behind}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 relative">
                    {/* Owner avatar if present */}
                    {b.ownerId && (
                      <div className="size-5 rounded-full overflow-hidden shrink-0 border border-border/40" title={b.ownerId}>
                        <UserAvatar user={{ name: b.ownerId, avatarUrl: undefined }} size={20} />
                      </div>
                    )}

                    {/* Row action menu */}
                    <button
                      type="button"
                      onClick={() => setActiveMenuBranch(isMenuOpen ? null : b.name)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-7 z-30 w-44 rounded-xl border border-border bg-popover p-1 shadow-lg text-xs space-y-0.5">
                        {!isDemoSafe && (
                          <button
                            type="button"
                            onClick={() => handleSetRole(b.name, 'DEMO_SAFE' as any)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted flex items-center gap-2 text-foreground cursor-pointer"
                          >
                            <ShieldCheck className="size-3.5 text-emerald-500" />
                            <span>Mark as demo-safe</span>
                          </button>
                        )}
                        {isDemoSafe && (
                          <button
                            type="button"
                            onClick={() => handleSetRole(b.name, 'normal' as any)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted text-foreground cursor-pointer"
                          >
                            Reset to normal
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyName(b.name)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted flex items-center gap-2 text-foreground cursor-pointer"
                        >
                          <Copy className="size-3.5 text-muted-foreground" />
                          <span>Copy branch name</span>
                        </button>
                        <a
                          href={branchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted flex items-center gap-2 text-foreground cursor-pointer"
                          onClick={() => setActiveMenuBranch(null)}
                        >
                          <ExternalLink className="size-3.5 text-muted-foreground" />
                          <span>Open on GitHub</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Purpose Editor */}
                <div className="pl-5 flex items-center justify-between gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={purposeDraft}
                        onChange={(e) => setPurposeDraft(e.target.value)}
                        placeholder="What is this branch building?"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSavePurpose(b.name);
                          if (e.key === 'Escape') setEditingBranch(null);
                        }}
                        className="flex-1 text-xs px-2.5 py-1 rounded-lg border border-border bg-muted/20 text-foreground outline-none focus:ring-1 focus:ring-primary"
                      />
                      <Button
                        size="sm"
                        className="h-6 text-[11px] px-2 cursor-pointer"
                        disabled={savingPurpose}
                        onClick={() => handleSavePurpose(b.name)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] px-2 cursor-pointer"
                        onClick={() => setEditingBranch(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleStartEdit(b)}
                      className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <span className="truncate">
                        {b.purpose ? b.purpose : 'Add purpose...'}
                      </span>
                      <Edit2 className="size-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </div>
                  )}

                  {/* Linked tasks */}
                  {b.linkedTaskKeys && b.linkedTaskKeys.length > 0 && (
                    <div className="flex items-center gap-1 shrink-0">
                      {b.linkedTaskKeys.map((k) => (
                        <span
                          key={k}
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40 font-semibold"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pt-2 flex items-center justify-between border-t border-border/30 text-xs text-muted-foreground">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg border border-border/60 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg border border-border/60 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
