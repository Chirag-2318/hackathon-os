import React, { useState, useEffect } from 'react';
import { GitBranch, ExternalLink, RefreshCw, Snowflake, Check, MoreHorizontal, ShieldAlert, LogOut } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Repo } from '@/services/types';

interface GithubHeaderProps {
  repo: Repo;
  isFrozen: boolean;
  onSync: () => Promise<void>;
  onOpenFreeze: () => void;
  onChangeRepo: () => void;
  onDisconnect: () => void;
}

export function GithubHeader({
  repo,
  isFrozen,
  onSync,
  onOpenFreeze,
  onChangeRepo,
  onDisconnect,
}: GithubHeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  const secondsSinceSync = Math.floor((Date.now() - lastSyncTime) / 1000);
  const isSyncDisabled = isSyncing || secondsSinceSync < 10;

  const handleSyncClick = async () => {
    if (isSyncDisabled) return;
    setIsSyncing(true);
    try {
      await onSync();
      setLastSyncTime(Date.now());
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const syncLabel = repo.lastSyncAt
    ? `Synced ${formatDistanceToNow(new Date(repo.lastSyncAt), { addSuffix: true })}`
    : 'Synced just now';

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 py-1">
        {/* Left: Title + Repo Chip + Connected Status */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-display font-normal tracking-tight text-foreground leading-none">GitHub</h1>

          {/* Repo Chip */}
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open repository on GitHub"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted text-xs font-mono text-foreground transition-colors group cursor-pointer border border-border/50"
          >
            <GitBranch className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="font-medium">{repo.fullName}</span>
            <ExternalLink className="size-3 text-muted-foreground group-hover:text-foreground opacity-70 group-hover:opacity-100 transition-opacity" />
          </a>

          {/* Status Group */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">Connected</span>
            <span className="text-muted-foreground/60">·</span>
            <span className="capitalize px-1.5 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border/50">
              {repo.visibility || 'public'}
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="font-mono tabular-nums">{syncLabel}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Sync Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncClick}
                  disabled={isSyncDisabled}
                  className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
                >
                  <RefreshCw
                    className={`size-3.5 transition-transform duration-700 ${
                      isSyncing ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Sync</span>
                </Button>
              </span>
            </TooltipTrigger>
            {secondsSinceSync < 10 && !isSyncing && (
              <TooltipContent side="bottom" className="text-xs">
                Synced just now
              </TooltipContent>
            )}
          </Tooltip>

          {/* Freeze Demo Button */}
          {isFrozen ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenFreeze}
              className="h-8 gap-1.5 text-xs font-medium border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
            >
              <Check className="size-3.5 text-blue-600 dark:text-blue-400 stroke-[2.5]" />
              <span>Demo frozen</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onOpenFreeze}
              className="h-8 gap-1.5 text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 cursor-pointer"
            >
              <Snowflake className="size-3.5" />
              <span>Freeze demo</span>
            </Button>
          )}

          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="More repository options"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-xs font-[var(--font-inter)]">
              <DropdownMenuItem onClick={onChangeRepo} className="cursor-pointer">
                Change repo
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDisconnectDialogOpen(true)}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Disconnect Confirm Dialog */}
      <Dialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <DialogContent className="max-w-md rounded-[20px] p-6 font-[var(--font-inter)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <ShieldAlert className="size-5 text-amber-500" />
              Disconnect repository?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1.5 leading-relaxed">
              Disconnecting will hide repo health checks, branch tracking, and commit activity
              for <span className="font-mono text-foreground font-medium">{repo.fullName}</span>.
              No code or data on GitHub is modified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-5 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisconnectDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setDisconnectDialogOpen(false);
                onDisconnect();
              }}
              className="cursor-pointer gap-1.5"
            >
              <LogOut className="size-3.5" />
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
