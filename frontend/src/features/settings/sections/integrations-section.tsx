import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  fetchIntegrations,
  authorizeGitHub,
  removeGitHubPrivateAccess,
  disconnectGitHub,
  checkGitHubConnection,
  connectGitHubWithToken,
  type IntegrationsResponse,
  type IntegrationProvider,
} from '@/features/prep/api/settings-api';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { ConfirmDialog } from '@/design/components/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  GitBranch,
  Globe,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  KeyRound,
  Check,
} from 'lucide-react';

export function IntegrationsSection() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: currentUser } = useCurrentUser();

  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [patToken, setPatToken] = useState('');
  const [patUsername, setPatUsername] = useState('');
  const [patPrivateAccess, setPatPrivateAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<IntegrationsResponse>({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations,
  });

  // Handle OAuth return toast notifications
  useEffect(() => {
    const gh = searchParams.get('github');
    if (gh === 'connected') {
      toast.success('GitHub connection updated successfully');
      const next = new URLSearchParams(searchParams);
      next.delete('github');
      setSearchParams(next, { replace: true });
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    } else if (gh === 'error') {
      toast.error('Failed to link GitHub account');
      const next = new URLSearchParams(searchParams);
      next.delete('github');
      next.delete('reason');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, queryClient]);

  const removePrivateMutation = useMutation({
    mutationFn: removeGitHubPrivateAccess,
    onSuccess: () => {
      toast.success('Private repository access removed');
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to remove private access');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectGitHub,
    onSuccess: () => {
      toast.success('GitHub disconnected');
      setDisconnectModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to disconnect GitHub');
    },
  });

  const connectWithTokenMutation = useMutation({
    mutationFn: connectGitHubWithToken,
    onSuccess: (updated) => {
      toast.success('GitHub connected successfully');
      setConnectModalOpen(false);
      setPatToken('');
      queryClient.setQueryData(['integrations'], updated);
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to connect GitHub');
    },
  });

  const handleOpenConnect = () => {
    setPatUsername(currentUser?.username || (currentUser as any)?.githubLogin || '');
    setConnectModalOpen(true);
  };

  const handleStartAuthorize = async (access: 'public' | 'private') => {
    setIsAuthorizing(true);
    try {
      const res = await authorizeGitHub(access);
      if (res?.authorizationUrl?.includes('modal=github-pat')) {
        handleOpenConnect();
      } else if (res?.authorizationUrl) {
        window.location.href = res.authorizationUrl;
      } else {
        handleOpenConnect();
      }
    } catch {
      handleOpenConnect();
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleCheckConnection = async () => {
    setIsChecking(true);
    try {
      const res = await checkGitHubConnection();
      if (res.ok) {
        toast.success(`Connection verified (${res.login || 'active'})`);
      } else {
        toast.error('GitHub connection expired or revoked. Please reconnect.');
      }
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to check GitHub connection');
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 max-w-3xl">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="divide-y divide-border border-y border-border">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink">Integrations</h1>
          <p className="text-caption text-ink-muted mt-1">Manage external tool authentication and service links.</p>
        </div>
        <div className="p-4 rounded-control border border-danger/30 bg-danger/5 flex items-center justify-between">
          <span className="text-body text-danger">Failed to load integrations.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-control text-caption font-medium text-ink border border-border hover:bg-hover transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const github = data.providers.find((p) => p.provider === 'GITHUB');
  const google = data.providers.find((p) => p.provider === 'GOOGLE');

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink">Integrations</h1>
        <p className="text-caption text-ink-muted mt-1">
          Connected developer and identity accounts.
        </p>
      </div>

      <section aria-labelledby="section-providers">
        <h2 id="section-providers" className="text-[13px] font-medium text-ink-muted uppercase tracking-wider mb-2">
          Connected accounts
        </h2>

        <div className="divide-y divide-border border-y border-border">
          {/* ── GitHub Row ── */}
          <div className="py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-h-[44px]">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-control bg-surface border border-border shrink-0 mt-0.5">
                  <GitBranch className="size-5 text-ink" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-body font-medium text-ink">GitHub</span>
                    {github?.connected && github.login && (
                      <span className="font-mono text-caption text-ink-muted">
                        @{github.login}
                      </span>
                    )}
                  </div>
                  <p className="text-caption text-ink-muted mt-0.5">
                    {!github?.connected
                      ? 'Not connected'
                      : github.hasPrivateAccess
                      ? 'Public and private repositories'
                      : 'Public repositories only'}
                  </p>
                </div>
              </div>

              {/* GitHub Actions */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                {!github?.connected ? (
                  <button
                    type="button"
                    onClick={() => handleOpenConnect()}
                    disabled={isAuthorizing || connectWithTokenMutation.isPending}
                    className="min-h-[44px] sm:min-h-0 px-3 py-1.5 rounded-control text-caption font-medium bg-ink text-shell hover:opacity-90 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    Connect GitHub
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCheckConnection}
                      disabled={isChecking}
                      className="min-h-[44px] sm:min-h-0 px-2.5 py-1.5 rounded-control text-caption font-medium text-ink border border-border hover:border-border-strong transition-colors flex items-center gap-1.5"
                    >
                      {isChecking ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="size-3.5" />
                      )}
                      Check connection
                    </button>

                    {github.hasPrivateAccess ? (
                      <button
                        type="button"
                        onClick={() => removePrivateMutation.mutate()}
                        disabled={removePrivateMutation.isPending}
                        className="min-h-[44px] sm:min-h-0 px-2.5 py-1.5 rounded-control text-caption font-medium text-ink border border-border hover:border-border-strong transition-colors"
                      >
                        {removePrivateMutation.isPending ? 'Removing…' : 'Remove private access'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartAuthorize('private')}
                        disabled={isAuthorizing}
                        className="min-h-[44px] sm:min-h-0 px-2.5 py-1.5 rounded-control text-caption font-medium text-ink border border-border hover:border-border-strong transition-colors"
                      >
                        {isAuthorizing ? 'Authorizing…' : 'Allow private repos'}
                      </button>
                    )}

                    {github.canDisconnect && (
                      <button
                        type="button"
                        onClick={() => setDisconnectModalOpen(true)}
                        className="min-h-[44px] sm:min-h-0 px-2.5 py-1.5 rounded-control text-caption font-medium text-danger hover:underline transition-colors"
                      >
                        Disconnect
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* GitHub Needs Reconnect Banner */}
            {github?.connected && github.status === 'NEEDS_RECONNECT' && (
              <div className="mt-3 p-3 rounded-control border border-warn-fg/30 bg-warn-bg text-warn-fg text-caption flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>Your GitHub session token expired or was revoked. Reconnect to keep room branches in sync.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartAuthorize(github.hasPrivateAccess ? 'private' : 'public')}
                  className="px-3 py-1 rounded-control text-caption font-medium bg-accent text-on-accent hover:opacity-90 transition-opacity shrink-0 min-h-[44px] sm:min-h-0 cursor-pointer"
                >
                  Reconnect
                </button>
              </div>
            )}

            {/* Hairline list: Used In Rooms */}
            {github?.connected && github.usedInRooms && github.usedInRooms.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <span className="text-[12px] font-medium text-ink-muted uppercase tracking-wider block mb-2">
                  Used in
                </span>
                <ul className="divide-y divide-border">
                  {github.usedInRooms.map((room) => (
                    <li
                      key={room.roomId}
                      className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-caption"
                    >
                      <Link
                        to={`/app/room/${room.roomId}/github`}
                        className="text-ink hover:text-lav-600 font-medium inline-flex items-center gap-1"
                      >
                        <span>{room.roomName}</span>
                        <ExternalLink className="size-3 text-ink-muted" />
                      </Link>
                      <span className="font-mono text-ink-muted">{room.repoFullName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Google Row (Read-only Sign-In) ── */}
          <div className="py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-h-[44px]">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-control bg-surface border border-border shrink-0 mt-0.5">
                  <Globe className="size-5 text-ink" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-body font-medium text-ink">Google</span>
                    {google?.email && (
                      <span className="font-mono text-caption text-ink-muted">
                        {google.email}
                      </span>
                    )}
                  </div>
                  <p className="text-caption text-ink-muted mt-0.5">
                    {google?.connected ? 'Used to sign in' : 'Not connected'}
                  </p>
                </div>
              </div>

              {/* No actions for Google as it is the sign-in provider */}
              <div className="text-caption text-ink-muted self-start sm:self-center">
                <span>Sign-in account</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disconnect GitHub ConfirmDialog */}
      <ConfirmDialog
        open={disconnectModalOpen}
        onOpenChange={setDisconnectModalOpen}
        title="Disconnect GitHub?"
        description="Disconnecting GitHub deletes your stored access tokens. Your rooms will keep their repository links, but syncing and branch updates will be paused until you reconnect."
        confirmLabel="Disconnect"
        cancelLabel="Keep connected"
        variant="danger"
        isLoading={disconnectMutation.isPending}
        onConfirm={() => disconnectMutation.mutate()}
      />

      {/* Connect GitHub Dialog */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="max-w-md p-6 rounded-[14px] bg-card border border-border shadow-2xl">
          <DialogHeader className="space-y-1.5 text-left">
            <div className="size-10 rounded-full bg-ink/10 dark:bg-shell/10 flex items-center justify-center mb-1 text-ink">
              <GitBranch className="size-5" />
            </div>
            <DialogTitle className="text-lg font-semibold text-ink">
              Connect GitHub Account
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted">
              Connect your GitHub account to sync repositories, issues, and commits in [brackit].
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              connectWithTokenMutation.mutate({
                username: patUsername.trim(),
                token: patToken.trim(),
                privateAccess: patPrivateAccess,
              });
            }}
            className="space-y-4 my-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="gh-username" className="text-xs font-medium text-ink">
                GitHub Username
              </Label>
              <Input
                id="gh-username"
                value={patUsername}
                onChange={(e) => setPatUsername(e.target.value)}
                placeholder="e.g. cobalt_hawk"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="gh-pat" className="text-xs font-medium text-ink">
                  Personal Access Token (PAT)
                </Label>
                <span className="text-[10px] text-ink-muted">Optional</span>
              </div>
              <Input
                id="gh-pat"
                type="password"
                value={patToken}
                onChange={(e) => setPatToken(e.target.value)}
                placeholder="ghp_... (or leave blank to link via username)"
                className="h-9 text-xs font-mono"
              />
              <p className="text-[11px] text-ink-muted">
                Providing a token with <code className="font-mono text-ink">repo</code> scope enables automated GitHub syncing.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="gh-private"
                checked={patPrivateAccess}
                onCheckedChange={(c) => setPatPrivateAccess(Boolean(c))}
              />
              <Label htmlFor="gh-private" className="text-xs text-ink cursor-pointer">
                Include private repositories access
              </Label>
            </div>

            <DialogFooter className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                className="px-3 py-1.5 text-xs text-ink-muted hover:text-ink font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={connectWithTokenMutation.isPending || !patUsername.trim()}
                className="px-4 py-2 rounded-control text-xs font-medium bg-ink text-shell hover:opacity-90 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {connectWithTokenMutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
                Connect Account
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
