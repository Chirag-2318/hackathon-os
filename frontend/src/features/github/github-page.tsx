import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { githubService } from '@/services/githubService';
import type {
  GithubDataComputed, BranchRole, AttentionItem
} from '@/services/types';
import { GithubHeader } from './components/github-header';
import { ReadinessBand } from './components/readiness-band';
import { BranchMap } from './components/branch-map';
import { NeedsAttentionCard } from './components/needs-attention-card';
import { RepoHealthCard } from './components/repo-health-card';
import { CommitActivityCard } from './components/commit-activity-card';
import { FreezeDemoDialog } from './components/freeze-demo-dialog';
import { NotConnectedView } from './components/not-connected-view';

export function GithubPage() {
  const { roomId = '' } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<GithubDataComputed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await githubService.getGithubData(roomId);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load GitHub repository details');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleSync = async () => {
    if (!roomId) return;
    const res = await githubService.syncRepo(roomId);
    setData(res);
  };

  const handleUpdatePurpose = async (branchName: string, purpose: string) => {
    await githubService.updateBranchPurpose(roomId, branchName, purpose);
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        branches: prev.branches.map((b) => (b.name === branchName ? { ...b, purpose } : b)),
      };
    });
  };

  const handleUpdateRole = async (branchName: string, role: BranchRole) => {
    const updatedBranches = await githubService.updateBranchRole(roomId, branchName, role);
    const refreshed = await githubService.getGithubData(roomId);
    setData(refreshed);
  };

  const handleLinkTask = async (branchName: string, taskKey: string) => {
    await githubService.linkTaskToBranch(roomId, branchName, taskKey);
    const refreshed = await githubService.getGithubData(roomId);
    setData(refreshed);
  };

  const handleUnlinkTask = async (branchName: string, taskKey: string) => {
    await githubService.unlinkTaskFromBranch(roomId, branchName, taskKey);
    const refreshed = await githubService.getGithubData(roomId);
    setData(refreshed);
  };

  const handleFreezeConfirm = async (freezeData: {
    branch: string;
    tag: string;
    sha: string;
    message: string;
  }) => {
    await githubService.freezeDemo(roomId, freezeData);
    const refreshed = await githubService.getGithubData(roomId);
    setData(refreshed);
  };

  const handleRecheckHealth = async () => {
    const refreshed = await githubService.recheckHealth(roomId);
    setData(refreshed);
  };

  const handleDismissAttention = async (itemId: string) => {
    await githubService.dismissAttentionItem(roomId, itemId);
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        attentionItems: prev.attentionItems.filter((i) => i.id !== itemId),
      };
    });
  };

  const handleConnectRepo = async (repoInput: string) => {
    const res = await githubService.connectRepo(roomId, repoInput);
    setData(res);
  };

  const handleDisconnectRepo = async () => {
    await githubService.disconnectRepo(roomId);
    setData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        repo: { ...prev.repo, connected: false },
      };
    });
  };

  const handleAttentionAction = (item: AttentionItem) => {
    if (item.actionType === 'open_url' && item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else if (item.actionType === 'open_freeze') {
      setFreezeDialogOpen(true);
    } else if (item.actionType === 'scroll_branch') {
      const el = document.getElementById('branch-map-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Skeletons / Loading State ──
  if (loading && !data) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <div className="max-w-[1280px] mx-auto space-y-4">
          <div className="h-10 w-64 bg-muted/60 animate-pulse rounded-lg" />
          <div className="h-32 bg-card border border-border/50 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 h-80 bg-card border border-border/50 rounded-2xl animate-pulse" />
            <div className="lg:col-span-4 h-80 bg-card border border-border/50 rounded-2xl animate-pulse" />
          </div>
          <div className="h-56 bg-card border border-border/50 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ── Error State with Retry ──
  if (error && !data) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6 flex items-center justify-center">
        <div className="max-w-md w-full p-6 rounded-2xl bg-card border border-border shadow-xs text-center space-y-4 font-[var(--font-inter)]">
          <div className="size-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Could not load repository</h2>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button onClick={loadData} size="sm" className="gap-2 cursor-pointer">
            <RefreshCw className="size-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      </div>
    );
  }

  // ── Not Connected State ──
  if (!data?.repo?.connected) {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-6">
        <NotConnectedView onConnect={handleConnectRepo} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 select-none font-[var(--font-inter)]">
      <div className="max-w-[1280px] mx-auto space-y-4">
        {/* ── Row 0: Header ── */}
        <GithubHeader
          repo={data.repo}
          isFrozen={Boolean(data.frozenDemo)}
          onSync={handleSync}
          onOpenFreeze={() => setFreezeDialogOpen(true)}
          onChangeRepo={() => handleDisconnectRepo()}
          onDisconnect={handleDisconnectRepo}
        />

        {/* ── Row 1: Readiness Band (full width) ── */}
        <ReadinessBand
          data={data}
          onScrollToSection={handleScrollToSection}
          onOpenFreeze={() => setFreezeDialogOpen(true)}
        />

        {/* ── Responsive Row 2: Branch Map + Right Stack ── */}
        {/* On >=1100px (lg): 8/12 and 4/12 columns */}
        {/* On <1100px: single column order: band, Needs attention, Branch Map, Repo health */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Branch Map (8/12 on large, 2nd on small) */}
          <div id="branch-map-section" className="order-2 lg:order-1 lg:col-span-8 space-y-4">
            <BranchMap
              branches={data.branches}
              commits={data.commits}
              missingMap={data.branchMissing}
              repoFullName={data.repo.fullName}
              onUpdatePurpose={handleUpdatePurpose}
              onUpdateRole={handleUpdateRole}
              onLinkTask={handleLinkTask}
              onUnlinkTask={handleUnlinkTask}
              onOpenTaskModal={(key) => navigate(`/app/room/${roomId}/board?task=${key}`)}
            />
          </div>

          {/* Right Stack: Needs Attention then Repo Health (4/12 on large) */}
          <div className="order-1 lg:order-2 lg:col-span-4 space-y-4">
            {/* Needs Attention */}
            <NeedsAttentionCard
              items={data.attentionItems}
              onActionClick={handleAttentionAction}
              onDismiss={handleDismissAttention}
            />

            {/* Repo Health */}
            <div id="repo-health">
              <RepoHealthCard
                health={data.health}
                repoFullName={data.repo.fullName}
                onRecheck={handleRecheckHealth}
              />
            </div>
          </div>
        </div>

        {/* ── Row 3: Commit Activity (full width) ── */}
        <CommitActivityCard
          commits={data.commits}
          eventStartIso="2026-10-07T07:00:00+05:30"
        />
      </div>

      {/* ── Freeze Demo Dialog ── */}
      <FreezeDemoDialog
        open={freezeDialogOpen}
        onOpenChange={setFreezeDialogOpen}
        branches={data.branches}
        health={data.health}
        existingFreeze={data.frozenDemo}
        repoFullName={data.repo.fullName}
        onConfirmFreeze={handleFreezeConfirm}
      />
    </div>
  );
}
