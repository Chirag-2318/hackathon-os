import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ExternalLink, RefreshCw, MoreHorizontal, FolderGit2,
  Trash2, GitPullRequest, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { githubService, type GithubCheck, type GithubContributorsResponse, type DemoMarker } from '@/services/githubService';
import type { GithubDataComputed, BranchRole, Branch } from '@/services/types';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { NotConnectedView } from './components/not-connected-view';
import { GithubSubmissionChecks } from './components/github-submission-checks';
import { GithubBranchesTable } from './components/github-branches-table';
import { GithubTeamActivity } from './components/github-team-activity';
import { GithubDemoMarkerCard } from './components/github-demo-marker-card';

export function GithubPage() {
  const { roomId = '' } = useParams<{ roomId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: currentUser } = useCurrentUser();

  const [data, setData] = useState<GithubDataComputed | null>(null);
  const [checks, setChecks] = useState<GithubCheck[]>([]);
  const [contributors, setContributors] = useState<GithubContributorsResponse | null>(null);
  const [demoMarker, setDemoMarker] = useState<DemoMarker | null>(null);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const isLeader = Boolean(
    currentUser?.id && data?.repo?.connected
  );

  const loadAll = useCallback(async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      const [res, chk, cont, mark] = await Promise.all([
        githubService.getGithubData(roomId).catch(() => null),
        githubService.getChecks(roomId).catch(() => []),
        githubService.getContributors(roomId).catch(() => null),
        githubService.getDemoMarker(roomId).catch(() => null),
      ]);
      setData(res);
      setChecks(chk);
      setContributors(cont);
      setDemoMarker(mark);
    } catch (err: any) {
      toast.error('Failed to load GitHub data');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const ghStatus = searchParams.get('github');
    if (ghStatus === 'connected') {
      toast.success('GitHub account connected');
      const next = new URLSearchParams(searchParams);
      next.delete('github');
      setSearchParams(next, { replace: true });
      loadAll();
    } else if (ghStatus === 'error') {
      const reason = searchParams.get('reason') || 'unknown';
      toast.error(`GitHub connection error (${reason})`);
      const next = new URLSearchParams(searchParams);
      next.delete('github');
      next.delete('reason');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, loadAll]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await githubService.syncRepo(roomId);
      await loadAll();
      toast.success('Repository synchronized');
    } catch (err: any) {
      toast.error(err?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect GitHub repository from this room?')) return;
    try {
      await githubService.disconnectRepo(roomId);
      toast.success('Repository disconnected');
      setData(null);
      loadAll();
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const handleUpdatePurpose = async (branchName: string, purpose: string) => {
    await githubService.updateBranchPurpose(roomId, branchName, purpose);
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        branches: prev.branches.map((b) =>
          b.name === branchName ? { ...b, purpose } : b
        ),
      };
    });
  };

  const handleUpdateRole = async (branchName: string, role: BranchRole) => {
    await githubService.updateBranchRole(roomId, branchName, role);
    const updated = await githubService.getGithubData(roomId);
    setData(updated);
  };

  if (loading && !data) {
    return (
      <div className="max-w-[1120px] mx-auto px-4 py-8 space-y-6">
        <div className="h-10 w-64 bg-muted/40 rounded-xl animate-pulse" />
        <div className="h-36 bg-muted/30 rounded-xl animate-pulse" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7 h-96 bg-muted/20 rounded-xl animate-pulse" />
          <div className="col-span-12 lg:col-span-5 h-96 bg-muted/20 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Not connected view
  if (!data || !data.repo?.connected) {
    return (
      <div className="max-w-[1120px] mx-auto px-4 py-8">
        <NotConnectedView
          roomId={roomId}
          onConnect={async (input) => {
            await githubService.connectRepo(roomId, input);
            toast.success('Repository connected');
            await loadAll();
          }}
        />
      </div>
    );
  }

  const repo = data.repo;
  const repoName = repo.fullName || 'Repository';
  const syncDate = repo.lastSyncAt ? new Date(repo.lastSyncAt) : new Date();
  const minsAgo = Math.max(0, Math.round((Date.now() - syncDate.getTime()) / 60000));
  const syncLabel = minsAgo === 0 ? 'Synced just now' : `Synced ${minsAgo}m ago`;

  return (
    <div className="max-w-[1120px] mx-auto px-4 py-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-base sm:text-lg font-bold text-foreground hover:underline inline-flex items-center gap-1.5"
          >
            <span>{repoName}</span>
            <ExternalLink className="size-4 text-muted-foreground" />
          </a>
          <span className="font-mono text-xs px-2 py-0.5 rounded-full border border-border/60 bg-muted text-muted-foreground">
            {repo.visibility || 'public'}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {syncLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            className="h-8 text-xs px-3 gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </Button>

          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHeaderMenu(!showHeaderMenu)}
              className="size-8 p-0 cursor-pointer"
            >
              <MoreHorizontal className="size-4" />
            </Button>

            {showHeaderMenu && (
              <div className="absolute right-0 top-9 z-40 w-48 rounded-xl border border-border bg-popover p-1 shadow-xl text-xs space-y-0.5">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted flex items-center gap-2 text-foreground cursor-pointer"
                  onClick={() => setShowHeaderMenu(false)}
                >
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                  <span>Open on GitHub</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowConnectModal(true);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-muted flex items-center gap-2 text-foreground cursor-pointer"
                >
                  <FolderGit2 className="size-3.5 text-muted-foreground" />
                  <span>Change repository</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    handleDisconnect();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Repo Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Change repository</h3>
            <NotConnectedView
              roomId={roomId}
              onConnect={async (input) => {
                await githubService.connectRepo(roomId, input);
                setShowConnectModal(false);
                toast.success('Repository connected');
                await loadAll();
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowConnectModal(false)}
              className="w-full text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Before you submit — 8 checks */}
      <GithubSubmissionChecks
        checks={checks}
        loading={loading}
        onRefresh={loadAll}
      />

      {/* Main Grid: Branches (7/12) + Activity & Demo Marker (5/12) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <GithubBranchesTable
            branches={data.branches || []}
            repoFullName={repoName}
            onUpdatePurpose={handleUpdatePurpose}
            onUpdateRole={handleUpdateRole}
          />
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-6">
          <GithubDemoMarkerCard
            roomId={roomId}
            demoMarker={demoMarker}
            branches={data.branches || []}
            isLeader={isLeader}
            onRefresh={loadAll}
          />

          <GithubTeamActivity
            contributors={contributors}
            commits={data.commits || []}
            eventStart={(data as any)?.eventStart}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
