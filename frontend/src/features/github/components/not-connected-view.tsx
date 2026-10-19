import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch, ShieldCheck, ArrowRight, Loader2,
  AlertCircle, Pin, Lock, Globe, FolderGit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/apiClient';
import { useMeta } from '@/api/useMeta';
import { githubService } from '@/services/githubService';
import { toast } from 'sonner';

interface NotConnectedViewProps {
  roomId?: string;
  onConnect: (repoInput: string) => Promise<void>;
}

export function NotConnectedView({ roomId, onConnect }: NotConnectedViewProps) {
  const { data: meta } = useMeta();
  const githubLinkEnabled = Boolean(meta?.githubLinkEnabled);

  const [repoInput, setRepoInput] = useState('');
  const [includePrivate, setIncludePrivate] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [errorInfo, setErrorInfo] = useState<{ code: string; message: string } | null>(null);

  // Link status
  const [linkStatus, setLinkStatus] = useState<{ linked: boolean; login: string | null; privateAccess: boolean }>({
    linked: false,
    login: null,
    privateAccess: false,
  });

  // Repos picker state
  const [myReposOpen, setMyReposOpen] = useState(false);
  const [myRepos, setMyRepos] = useState<Array<{ fullName: string; isPrivate: boolean; updatedAt: string }>>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);

  const steps = ['Finding repository...', 'Reading branch heads...', 'Running judge checks...'];

  const refreshLinkStatus = useCallback(async () => {
    try {
      const status = await githubService.getLinkStatus();
      setLinkStatus(status);
    } catch {
      // Ignore unauthenticated or fetch errors
    }
  }, []);

  useEffect(() => {
    refreshLinkStatus();
  }, [refreshLinkStatus]);

  const loadMyRepos = useCallback(async (searchQuery: string) => {
    try {
      setLoadingRepos(true);
      const list = await githubService.getMyRepos(searchQuery);
      setMyRepos(list);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to fetch repositories');
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  const handleStartLink = (privateRepos: boolean = includePrivate) => {
    const url = `${API_BASE_URL}/api/v1/github/link/start?roomId=${encodeURIComponent(roomId || '')}&privateRepos=${privateRepos}`;
    window.location.href = url;
  };

  const handleDisconnectLink = async () => {
    try {
      await githubService.disconnectLink();
      setLinkStatus({ linked: false, login: null, privateAccess: false });
      setMyReposOpen(false);
      toast.success('GitHub account unlinked');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to disconnect account');
    }
  };

  const handleConnect = async (targetRepo?: string) => {
    const input = targetRepo || repoInput;
    if (!input.trim()) {
      setErrorInfo({ code: 'INVALID_REPO', message: 'Please enter a valid owner/repo or GitHub URL' });
      return;
    }
    setErrorInfo(null);
    setIsConnecting(true);
    setStepIndex(0);

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 600);

    try {
      await onConnect(input.trim());
    } catch (err: any) {
      let code = err?.code || 'UNKNOWN';
      let message = err?.message || 'Repository not found or private. Make sure it is public.';

      if (code === 'REPO_NOT_FOUND' || err?.status === 404) {
        code = 'REPO_NOT_FOUND';
        message = 'Repository not found, or it is private. Allow private repositories in Settings, Integrations.';
      } else if (code === 'GITHUB_UNAUTHENTICATED' || code === 'GITHUB_TOKEN_INVALID' || err?.status === 401) {
        code = 'GITHUB_UNAUTHENTICATED';
        message = 'Reconnect GitHub';
      } else if (code === 'GITHUB_RATE_LIMIT' || err?.status === 429) {
        code = 'GITHUB_RATE_LIMIT';
        message = err?.message || 'GitHub API rate limit exceeded.';
      } else if (code === 'GITHUB_FORBIDDEN' || err?.status === 403) {
        code = 'GITHUB_FORBIDDEN';
        message = err?.message || 'GitHub access forbidden. Check permissions for this repository.';
      }
      setErrorInfo({ code, message });
    } finally {
      clearInterval(interval);
      setIsConnecting(false);
    }
  };

  return (
    <div className="max-w-[620px] mx-auto py-12 px-4 font-[var(--font-inter)] space-y-8">
      {/* ── Main Connect Card ── */}
      <div className="rounded-[24px] bg-card border border-border shadow-xs p-6 sm:p-8 space-y-6">
        {/* Large Icon Tile + Title + Subtitle */}
        <div className="text-center space-y-2">
          <div className="size-14 rounded-2xl bg-muted/80 text-foreground flex items-center justify-center mx-auto shadow-2xs">
            <GitBranch className="size-7" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Connect your repo
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            See branches, pull requests and judge-readiness checks in one place. We read branch names,
            pull request status, commit info, the README and file names. We never read your code and never write to your repo.
          </p>
        </div>

        {/* ── Linked As Status Row ── */}
        {linkStatus.linked && (
          <div className="flex items-center justify-between text-xs text-muted-foreground p-2 rounded-lg bg-muted/40 border border-border/40">
            <div className="flex items-center gap-1.5 truncate">
              <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">
                Linked as <strong className="text-foreground">{linkStatus.login || 'GitHub User'}</strong>
                {linkStatus.privateAccess && ' (private access enabled)'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDisconnectLink}
              className="text-xs text-rose-600 hover:text-rose-700 underline font-medium cursor-pointer shrink-0 ml-2"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* ── Paste repo input + Buttons ── */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Repository path or URL
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="owner/repo or https://github.com/owner/repo"
                value={repoInput}
                disabled={isConnecting}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                className="flex-1 h-10 px-3 rounded-lg border border-border bg-surface text-xs font-mono text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-1 focus:ring-ring"
              />
              <Button
                onClick={() => handleConnect()}
                disabled={isConnecting}
                className="h-10 px-4 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 cursor-pointer text-xs font-medium"
              >
                {isConnecting ? <Loader2 className="size-4 animate-spin" /> : <span>Connect</span>}
              </Button>
              {linkStatus.linked && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const next = !myReposOpen;
                    setMyReposOpen(next);
                    if (next) loadMyRepos(repoSearch);
                  }}
                  className="h-10 px-3 text-xs font-medium cursor-pointer"
                >
                  <FolderGit2 className="size-3.5 mr-1.5" />
                  <span>Pick from my repositories</span>
                </Button>
              )}
            </div>
          </div>

          {/* ── My Repos Picker Dropdown / Panel ── */}
          {linkStatus.linked && myReposOpen && (
            <div className="p-3 rounded-xl border border-border bg-surface space-y-3 animate-in fade-in-50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter your repositories..."
                  value={repoSearch}
                  onChange={(e) => {
                    setRepoSearch(e.target.value);
                    loadMyRepos(e.target.value);
                  }}
                  className="flex-1 h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-1 focus:ring-ring"
                />
                {loadingRepos && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {myRepos.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    {loadingRepos ? 'Loading repositories...' : 'No repositories found.'}
                  </p>
                ) : (
                  myRepos.map((r) => (
                    <button
                      key={r.fullName}
                      type="button"
                      disabled={isConnecting}
                      onClick={() => {
                        setRepoInput(r.fullName);
                        setMyReposOpen(false);
                        handleConnect(r.fullName);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-md hover:bg-muted/60 text-left text-xs font-mono text-foreground flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {r.isPrivate ? (
                          <Lock className="size-3 text-amber-500 shrink-0" />
                        ) : (
                          <Globe className="size-3 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate">{r.fullName}</span>
                      </div>
                      <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Connecting progress state */}
          {isConnecting && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs text-foreground flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>{steps[stepIndex]}</span>
            </div>
          )}

          {/* ── Error message & Friendly Mappings ── */}
          {errorInfo && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="font-semibold leading-relaxed">{errorInfo.message}</p>
                {/* Only REPO_NOT_FOUND shows the "Connect GitHub account" button */}
                {errorInfo.code === 'REPO_NOT_FOUND' && (
                  <div>
                    {githubLinkEnabled ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleStartLink(true)}
                        className="h-8 px-3 text-xs bg-rose-700 hover:bg-rose-800 text-white dark:bg-rose-600 dark:hover:bg-rose-700 cursor-pointer"
                      >
                        <GitBranch className="size-3.5 mr-1.5" />
                        Connect GitHub account
                      </Button>
                    ) : (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 italic">
                        GitHub linking is not configured on the server
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Account Linking Section (When not linked) ── */}
          {!linkStatus.linked && (
            <div className="pt-3 border-t border-border/50 space-y-2.5">
              {githubLinkEnabled ? (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Button
                      type="button"
                      onClick={() => handleStartLink(includePrivate)}
                      className="h-9 px-4 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-xs font-medium cursor-pointer gap-2"
                    >
                      <GitBranch className="size-4" />
                      <span>Log in through GitHub</span>
                    </Button>
                    <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includePrivate}
                        onChange={(e) => setIncludePrivate(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary size-3.5"
                      />
                      <span>Include private repositories</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    GitHub gives this app broader access for private repos. We only read.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  GitHub linking is not configured on the server
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 3-Item Preview Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
        <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-2.5">
          <GitBranch className="size-4 text-primary shrink-0" />
          <span className="font-medium text-foreground">Branch map with purposes</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-2.5">
          <Pin className="size-4 text-blue-600 shrink-0" />
          <span className="font-medium text-foreground">Demo freeze checkpoint</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-2.5">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
          <span className="font-medium text-foreground">Judge-readiness checks</span>
        </div>
      </div>
    </div>
  );
}
