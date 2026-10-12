import React, { useState, useRef, useEffect } from 'react';
import {
  Shield, Copy, Check, ChevronDown, MoreHorizontal, ExternalLink,
  GitBranch, GitPullRequest, Trash2, Edit2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useParams } from 'react-router-dom';
import { IssueKey } from '@/features/build/ui';
import { LinkTaskPopover } from './link-task-popover';
import { BranchExpanded } from './branch-expanded';
import { AheadBehindBar } from './ahead-behind-bar';
import { PrLozenge } from './pr-lozenge';
import type { Branch, BranchRole, Commit } from '@/services/types';

interface BranchRowProps {
  branch: Branch;
  commits: Commit[];
  missingItems: string[];
  repoFullName: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdatePurpose: (purpose: string) => void;
  onRequestRoleChange: (role: BranchRole) => void;
  onLinkTask: (key: string) => void;
  onUnlinkTask: (key: string) => void;
  onOpenTaskModal: (key: string) => void;
}

export function BranchRow({
  branch,
  commits,
  missingItems,
  repoFullName,
  isExpanded,
  onToggleExpand,
  onUpdatePurpose,
  onRequestRoleChange,
  onLinkTask,
  onUnlinkTask,
  onOpenTaskModal,
}: BranchRowProps) {
  const { roomId = '' } = useParams<{ roomId: string }>();
  // Inline purpose editing
  const [isEditingPurpose, setIsEditingPurpose] = useState(false);
  const [purposeInput, setPurposeInput] = useState(branch.purpose);
  const purposeInputRef = useRef<HTMLInputElement>(null);

  const owner = branch.ownerId ? {
    displayName: branch.ownerId,
    initials: branch.ownerId.slice(0, 2).toUpperCase(),
    avatarColor: '#5B6FF0',
  } : null;

  // Copy branch name feedback
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPurposeInput(branch.purpose);
  }, [branch.purpose]);

  useEffect(() => {
    if (isEditingPurpose) {
      purposeInputRef.current?.focus();
      purposeInputRef.current?.select();
    }
  }, [isEditingPurpose]);

  const handleCopyBranch = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(branch.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSavePurpose = () => {
    setIsEditingPurpose(false);
    if (purposeInput.trim() !== branch.purpose) {
      onUpdatePurpose(purposeInput.trim());
    }
  };

  const handlePurposeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSavePurpose();
    } else if (e.key === 'Escape') {
      setPurposeInput(branch.purpose);
      setIsEditingPurpose(false);
    }
  };

  // Role lozenge styling
  const roleMeta: Record<BranchRole, { label: string; bg: string; text: string; icon?: React.ReactNode }> = {
    main: { label: 'MAIN', bg: '#E4F7E9', text: '#2E9E55' },
    'demo-safe': { label: 'DEMO-SAFE', bg: '#E3F1FF', text: '#1D7FD1', icon: <Shield className="size-3 fill-current" /> },
    experiment: { label: 'EXPERIMENT', bg: '#FFF4E5', text: '#D97706' },
    stale: { label: 'STALE', bg: '#F3F4F6', text: '#6B7280' },
  };
  const currentRole = roleMeta[branch.role] || roleMeta.experiment;



  // Left border highlight
  const borderEdgeClass =
    branch.role === 'demo-safe'
      ? 'border-l-2 border-l-blue-500'
      : branch.role === 'main'
      ? 'border-l-2 border-l-emerald-500'
      : 'border-l-2 border-l-transparent';

  return (
    <div
      data-testid={`branch-row-${branch.name}`}
      onClick={onToggleExpand}
      className={`group transition-colors duration-150 hover:bg-muted/30 cursor-pointer px-4 select-none ${borderEdgeClass}`}
    >
      {/* ── Main Row ── */}
      <div className="grid grid-cols-[84px_1fr_28px_minmax(120px,1fr)_96px_92px_64px_28px] items-center gap-3 py-2.5 min-h-[48px] text-xs">
        {/* Col 1: Role Lozenge Dropdown */}
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                style={{ backgroundColor: currentRole.bg, color: currentRole.text }}
                className="h-5 px-2 rounded-[6px] text-[10px] font-bold tracking-[0.03em] uppercase inline-flex items-center gap-1 hover:scale-102 transition-transform cursor-pointer"
              >
                {currentRole.icon}
                <span>{currentRole.label}</span>
                <ChevronDown className="size-2.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36 text-xs font-[var(--font-inter)]">
              {(['main', 'demo-safe', 'experiment', 'stale'] as BranchRole[]).map((r) => (
                <DropdownMenuItem
                  key={r}
                  onClick={() => onRequestRoleChange(r)}
                  className="capitalize cursor-pointer"
                >
                  {r === 'demo-safe' ? 'Demo-safe' : r}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Col 2: Branch Name + Inline Purpose */}
        <div className="min-w-0 pr-2">
          {/* Line 1: Name + Copy icon */}
          <div className="flex items-center gap-1.5 leading-tight">
            <a
              href={branch.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-[13px] font-semibold text-foreground hover:text-blue-600 transition-colors shrink-0 max-w-[220px] truncate"
              title={`View ${branch.name} on GitHub`}
            >
              {branch.name}
            </a>
            <button
              type="button"
              onClick={handleCopyBranch}
              className="text-muted-foreground/60 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
              title="Copy branch name"
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            </button>
          </div>

          {/* Line 2: Purpose (inline editable) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 text-[12px] text-muted-foreground leading-tight"
          >
            {isEditingPurpose ? (
              <input
                ref={purposeInputRef}
                type="text"
                value={purposeInput}
                onChange={(e) => setPurposeInput(e.target.value)}
                onBlur={handleSavePurpose}
                onKeyDown={handlePurposeKeyDown}
                className="w-full bg-surface border border-input rounded px-1.5 py-0.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                placeholder="What is this branch for?"
              />
            ) : (
              <span
                onClick={() => setIsEditingPurpose(true)}
                className={`cursor-text hover:text-foreground transition-colors ${
                  branch.purpose ? 'truncate block' : 'italic text-muted-foreground/60 border-b border-dashed border-muted-foreground/30'
                }`}
                title="Click to edit purpose"
              >
                {branch.purpose || 'Add a purpose'}
              </span>
            )}
          </div>
        </div>

        {/* Col 3: Owner Avatar */}
        <div className="flex items-center justify-center">
          {owner ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="size-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 select-none shadow-2xs"
                  style={{ backgroundColor: owner.avatarColor }}
                >
                  {owner.initials}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {owner.displayName}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div
              className="size-7 rounded-full border border-dashed border-border/80 flex items-center justify-center text-muted-foreground/60 text-[10px]"
              title="Unassigned"
            >
              ?
            </div>
          )}
        </div>

        {/* Col 4: Linked Tasks (hidden on narrow widths) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="hidden sm:flex items-center gap-1.5 flex-wrap min-w-0"
        >
          {(branch.linkedTaskKeys || []).map((key) => (
            <span
              key={key}
              onClick={() => onOpenTaskModal(key)}
              className="inline-flex items-center gap-1 bg-muted/60 hover:bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono cursor-pointer border border-border/40 group/task"
            >
              <IssueKey issueKey={key} />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlinkTask(key);
                }}
                className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover/task:opacity-100 transition-opacity"
                title="Unlink task"
              >
                ×
              </button>
            </span>
          ))}
          <LinkTaskPopover
            roomId={roomId}
            linkedKeys={branch.linkedTaskKeys || []}
            onLink={onLinkTask}
            onUnlink={onUnlinkTask}
          />
        </div>

        {/* Col 5: Ahead / Behind Bars */}
        <div className="flex items-center gap-2">
          <AheadBehindBar
            role={branch.role}
            ahead={branch.ahead}
            behind={branch.behind}
          />
        </div>

        {/* Col 6: PR Lozenge */}
        <div className="flex items-center">
          <PrLozenge pr={branch.pr} repoFullName={repoFullName} />
        </div>

        {/* Col 7: Last Commit Time (hidden on narrow widths) */}
        <div className="hidden md:flex items-center text-muted-foreground text-[11px] tabular-nums">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help truncate">
                {formatDistanceToNow(new Date(branch.lastCommitAt), { addSuffix: false })}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-xs space-y-1">
              <div className="font-mono text-[10px] text-muted-foreground">
                sha: {branch.lastCommitSha}
              </div>
              <div className="font-medium text-foreground">{branch.lastCommitMessage}</div>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Col 8: Row Menu "..." */}
        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                aria-label={`Actions for ${branch.name}`}
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-xs font-[var(--font-inter)]">
              <DropdownMenuItem
                onClick={() => window.open(branch.url, '_blank', 'noopener,noreferrer')}
                className="cursor-pointer gap-2"
              >
                <ExternalLink className="size-3.5" />
                <span>Open on GitHub</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyBranch} className="cursor-pointer gap-2">
                <Copy className="size-3.5" />
                <span>Copy branch name</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsEditingPurpose(true)}
                className="cursor-pointer gap-2"
              >
                <Edit2 className="size-3.5" />
                <span>Edit purpose</span>
              </DropdownMenuItem>
              {branch.role !== 'demo-safe' && (
                <DropdownMenuItem
                  onClick={() => onRequestRoleChange('demo-safe')}
                  className="cursor-pointer gap-2 text-blue-600"
                >
                  <Shield className="size-3.5" />
                  <span>Set as demo-safe</span>
                </DropdownMenuItem>
              )}
              {branch.role !== 'stale' && (
                <DropdownMenuItem
                  onClick={() => onRequestRoleChange('stale')}
                  className="cursor-pointer gap-2 text-muted-foreground"
                >
                  <span>Mark as stale</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Expanded Row Accordion ── */}
      {isExpanded && (
        <div className="pl-4 pr-2 pb-2">
          <BranchExpanded
            branch={branch}
            missingItems={missingItems}
            commits={commits}
            repoFullName={repoFullName}
            onOpenLinkTask={() => {
              // Expand tasks
            }}
          />
        </div>
      )}
    </div>
  );
}
