import React, { useState, useMemo } from 'react';
import {
  Search, ShieldAlert, Copy, Check, Filter, ExternalLink, Inbox, Terminal, ChevronDown
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { InlineHighlight } from '@/features/home/components/HomeDesignSystem';
import { BranchRow } from './branch-row';
import { RoleChangeDialog } from './role-change-dialog';
import type { Branch, BranchRole, Commit } from '@/services/types';

interface BranchMapProps {
  branches: Branch[];
  commits: Commit[];
  missingMap: Record<string, string[]>;
  repoFullName: string;
  onUpdatePurpose: (branchName: string, purpose: string) => void;
  onUpdateRole: (branchName: string, role: BranchRole) => void;
  onLinkTask: (branchName: string, taskKey: string) => void;
  onUnlinkTask: (branchName: string, taskKey: string) => void;
  onOpenTaskModal: (taskKey: string) => void;
}

type FilterOption = 'all' | 'mine' | 'attention' | 'prs';

export function BranchMap({
  branches,
  commits,
  missingMap,
  repoFullName,
  onUpdatePurpose,
  onUpdateRole,
  onLinkTask,
  onUnlinkTask,
  onOpenTaskModal,
}: BranchMapProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [showStale, setShowStale] = useState(false);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);

  // Demo-safe replacement confirmation state
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);

  // Check if a demo-safe branch exists
  const existingDemoSafe = branches.find((b) => b.role === 'demo-safe');

  // Filter branches
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      // Search
      const q = search.toLowerCase().trim();
      if (q && !b.name.toLowerCase().includes(q) && !b.purpose.toLowerCase().includes(q)) {
        return false;
      }

      // Filter dropdown
      if (filter === 'mine' && b.ownerId !== 'u-aarav') {
        return false;
      }
      if (filter === 'prs' && !b.pr) {
        return false;
      }
      if (filter === 'attention') {
        const missing = missingMap[b.name] || [];
        if (missing.length === 0 && !b.pr?.conflicts) return false;
      }

      // Stale toggle
      if (!showStale && (b.role === 'stale' || b.pr?.status === 'merged')) {
        return false;
      }

      return true;
    });
  }, [branches, search, filter, showStale, missingMap]);

  // Group branches
  const protectedBranches = filteredBranches.filter((b) => b.role === 'main' || b.role === 'demo-safe');
  const inProgressBranches = filteredBranches.filter((b) => b.role === 'experiment');
  const staleBranches = filteredBranches.filter((b) => b.role === 'stale');

  const handleRoleChangeRequest = (branchName: string, newRole: BranchRole) => {
    if (newRole === 'demo-safe' && existingDemoSafe && existingDemoSafe.name !== branchName) {
      setReplaceTarget(branchName);
      return;
    }
    onUpdateRole(branchName, newRole);
  };

  const handleConfirmRoleReplacement = () => {
    if (replaceTarget) {
      onUpdateRole(replaceTarget, 'demo-safe');
      setReplaceTarget(null);
    }
  };

  const [copiedCommands, setCopiedCommands] = useState(false);
  const gitCommands = `git checkout -b demo-safe\ngit push -u origin demo-safe\ngit branch -u origin/demo-safe`;

  return (
    <div
      data-testid="branch-map"
      className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden font-[var(--font-inter)] flex flex-col"
    >
      {/* ── Card Header (48px) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 min-h-[48px] border-b border-border/60">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-foreground">Branches</h2>
          <span className="h-5 px-2 rounded-full bg-muted text-[11px] font-bold text-muted-foreground tabular-nums flex items-center justify-center">
            {branches.length}
          </span>
        </div>

        {/* Right: Search, Filter Dropdown, Show Stale Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-44 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/40 hover:bg-muted/60 focus:bg-surface border border-border/50 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-8 px-2.5 rounded-lg border border-border/50 bg-muted/40 hover:bg-muted text-xs font-medium text-foreground inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Filter className="size-3 text-muted-foreground" />
                <span className="capitalize">
                  {filter === 'all'
                    ? 'All branches'
                    : filter === 'mine'
                    ? 'Mine'
                    : filter === 'attention'
                    ? 'Needs attention'
                    : 'Open PRs'}
                </span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 text-xs font-[var(--font-inter)]">
              <DropdownMenuItem onClick={() => setFilter('all')} className="cursor-pointer">
                All branches
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('mine')} className="cursor-pointer">
                Mine
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('attention')} className="cursor-pointer">
                Needs attention
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('prs')} className="cursor-pointer">
                Open PRs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Show Stale Toggle */}
          <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer">
            <Switch
              checked={showStale}
              onCheckedChange={setShowStale}
              className="scale-80 origin-right"
            />
            <span className="text-[12px]">Show stale</span>
          </label>
        </div>
      </div>

      {/* ── Table Column Header ── */}
      <div className="grid grid-cols-[84px_1fr_28px_minmax(120px,1fr)_96px_92px_64px_28px] items-center gap-3 px-4 py-2 bg-muted/20 border-b border-border/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
        <div>Role</div>
        <div>Branch & Purpose</div>
        <div className="text-center">Owner</div>
        <div className="hidden sm:block">Tasks</div>
        <div>Ahead / Behind</div>
        <div>PR</div>
        <div className="hidden md:block">Last Commit</div>
        <div />
      </div>

      {/* ── Table Body ── */}
      <div className="divide-y divide-border/40 flex-1 overflow-x-hidden">
        {/* Missing Demo-Safe Banner */}
        {!existingDemoSafe && (
          <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>No demo-safe branch yet. Create one so a late bug cannot break your demo.</span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="cursor-pointer">
                  <InlineHighlight>How</InlineHighlight>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3 text-xs font-[var(--font-inter)] shadow-md">
                <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <Terminal className="size-3.5" />
                  <span>Create Demo-Safe Branch</span>
                </div>
                <pre className="bg-muted p-2 rounded text-[11px] font-mono text-foreground overflow-x-auto my-2">
                  {gitCommands}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(gitCommands);
                    setCopiedCommands(true);
                    setTimeout(() => setCopiedCommands(false), 1500);
                  }}
                  className="w-full py-1 rounded bg-neutral-900 text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedCommands ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  <span>{copiedCommands ? 'Copied to clipboard' : 'Copy git commands'}</span>
                </button>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {filteredBranches.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Inbox className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">No branches match your filters</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilter('all');
                setShowStale(true);
              }}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* GROUP: PROTECTED */}
            {protectedBranches.length > 0 && (
              <div>
                <div className="px-4 py-1.5 bg-muted/10 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                  Protected
                </div>
                {protectedBranches.map((b) => (
                  <BranchRow
                    key={b.name}
                    branch={b}
                    commits={commits}
                    missingItems={missingMap[b.name] || []}
                    repoFullName={repoFullName}
                    isExpanded={expandedBranch === b.name}
                    onToggleExpand={() =>
                      setExpandedBranch(expandedBranch === b.name ? null : b.name)
                    }
                    onUpdatePurpose={(purpose) => onUpdatePurpose(b.name, purpose)}
                    onRequestRoleChange={(role) => handleRoleChangeRequest(b.name, role)}
                    onLinkTask={(key) => onLinkTask(b.name, key)}
                    onUnlinkTask={(key) => onUnlinkTask(b.name, key)}
                    onOpenTaskModal={onOpenTaskModal}
                  />
                ))}
              </div>
            )}

            {/* GROUP: IN PROGRESS */}
            {inProgressBranches.length > 0 && (
              <div>
                <div className="px-4 py-1.5 bg-muted/10 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                  In Progress
                </div>
                {inProgressBranches.map((b) => (
                  <BranchRow
                    key={b.name}
                    branch={b}
                    commits={commits}
                    missingItems={missingMap[b.name] || []}
                    repoFullName={repoFullName}
                    isExpanded={expandedBranch === b.name}
                    onToggleExpand={() =>
                      setExpandedBranch(expandedBranch === b.name ? null : b.name)
                    }
                    onUpdatePurpose={(purpose) => onUpdatePurpose(b.name, purpose)}
                    onRequestRoleChange={(role) => handleRoleChangeRequest(b.name, role)}
                    onLinkTask={(key) => onLinkTask(b.name, key)}
                    onUnlinkTask={(key) => onUnlinkTask(b.name, key)}
                    onOpenTaskModal={onOpenTaskModal}
                  />
                ))}
              </div>
            )}

            {/* GROUP: STALE */}
            {staleBranches.length > 0 && showStale && (
              <div>
                <div className="px-4 py-1.5 bg-muted/10 text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                  Stale
                </div>
                {staleBranches.map((b) => (
                  <BranchRow
                    key={b.name}
                    branch={b}
                    commits={commits}
                    missingItems={missingMap[b.name] || []}
                    repoFullName={repoFullName}
                    isExpanded={expandedBranch === b.name}
                    onToggleExpand={() =>
                      setExpandedBranch(expandedBranch === b.name ? null : b.name)
                    }
                    onUpdatePurpose={(purpose) => onUpdatePurpose(b.name, purpose)}
                    onRequestRoleChange={(role) => handleRoleChangeRequest(b.name, role)}
                    onLinkTask={(key) => onLinkTask(b.name, key)}
                    onUnlinkTask={(key) => onUnlinkTask(b.name, key)}
                    onOpenTaskModal={onOpenTaskModal}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Table Footer (44px) ── */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/60 text-xs text-muted-foreground bg-muted/5 min-h-[44px]">
        <span>
          Showing {filteredBranches.length} of {branches.length} branches
        </span>
        <a
          href={`https://github.com/${repoFullName}/branches`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          <span>Open all branches on GitHub</span>
          <ExternalLink className="size-3" />
        </a>
      </div>

      {/* Role Replacement Confirmation Dialog */}
      <RoleChangeDialog
        open={Boolean(replaceTarget)}
        onOpenChange={(open) => !open && setReplaceTarget(null)}
        branchName={replaceTarget || ''}
        existingDemoSafeBranch={existingDemoSafe?.name || ''}
        onConfirm={handleConfirmRoleReplacement}
      />
    </div>
  );
}
