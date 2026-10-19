/**
 * Privacy settings section
 * Built with shared Settings row pattern:
 * - What we store (real counts/sizes, retention periods, no passwords/payments disclosure)
 * - Export your data (authenticated streaming ZIP download with rate-limit handling)
 * - Delete account (2-step modal with blockers/anonymisation preview and auto-transfer)
 */
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  fetchDataSummary,
  downloadUserDataExport,
  fetchDeletePreview,
  deleteUserAccount,
  type DataSummary,
  type DeletePreview,
} from '@/features/prep/api/settings-api';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Download, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

export function PrivacySection() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Queries
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['userDataSummary'],
    queryFn: fetchDataSummary,
  });

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteStep, setDeleteStep] = React.useState<1 | 2>(1);
  const [autoTransfer, setAutoTransfer] = React.useState(false);
  const [confirmInput, setConfirmInput] = React.useState('');
  const [confirmCheckbox, setConfirmCheckbox] = React.useState(false);

  const {
    data: preview,
    isLoading: isPreviewLoading,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ['userDeletePreview'],
    queryFn: fetchDeletePreview,
    enabled: deleteDialogOpen,
  });

  // Export Mutation
  const [isExporting, setIsExporting] = React.useState(false);
  const handleExport = async () => {
    try {
      setIsExporting(true);
      await downloadUserDataExport();
      toast.success('Your data archive has been downloaded.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to export data archive.');
    } finally {
      setIsExporting(false);
    }
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUserAccount,
    onSuccess: () => {
      queryClient.clear();
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      navigate('/goodbye');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete account. Please try again.');
    },
  });

  const openDeleteDialog = () => {
    setDeleteStep(1);
    setAutoTransfer(false);
    setConfirmInput('');
    setConfirmCheckbox(false);
    setDeleteDialogOpen(true);
    refetchPreview();
  };

  if (isSummaryLoading) {
    return (
      <div className="flex flex-col max-w-4xl pb-16 space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="border-y border-border divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="py-5 flex justify-between items-center gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isSummaryError || !summary) {
    return (
      <div className="flex flex-col max-w-4xl pb-16 space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-ink tracking-tight">Privacy</h1>
          <p className="text-sm text-ink-2 mt-1">Unable to load privacy metrics.</p>
        </div>
        <div className="p-6 rounded-md border border-border bg-surface flex items-center justify-between">
          <p className="text-sm text-ink">An error occurred while fetching your data summary.</p>
          <Button variant="outline" size="sm" onClick={() => refetchSummary()} className="gap-2">
            <RefreshCw className="size-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const hasBlockers = Boolean(preview?.blockers && preview.blockers.length > 0);
  const canProceedToStep2 = !hasBlockers || autoTransfer;
  const username = summary.profile.username || '';
  const canSubmitDelete =
    confirmInput.trim().toLowerCase() === username.toLowerCase() && confirmCheckbox && !deleteMutation.isPending;

  return (
    <div className="flex flex-col max-w-4xl pb-16">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-ink tracking-tight">Privacy</h1>
        <p className="text-sm text-ink-2 mt-1">
          Review what data [brackit] stores, export an archive of your account, or delete your account.
        </p>
      </div>

      {/* Section 1: What we store */}
      <div className="mb-10">
        <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-2">
          What we store
        </h2>
        <div className="border-y border-border divide-y divide-border">
          {/* Account */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between py-4 gap-2">
            <div className="max-w-xl">
              <span className="text-sm font-medium text-ink">Account</span>
              <p className="text-xs text-ink-2 mt-0.5">
                {summary.account.email ? summary.account.email : 'No email provided'} • Sign-in:{' '}
                {summary.account.signInProviders.join(', ') || 'OAuth'}
              </p>
              <p className="text-xs text-ink-muted mt-1">Why: Authenticates your login sessions and links your identity.</p>
            </div>
            <div className="text-xs font-mono text-ink-muted shrink-0">
              {summary.account.lastLoginAt
                ? `Last login: ${new Date(summary.account.lastLoginAt).toLocaleDateString()}`
                : 'Active session'}
            </div>
          </div>

          {/* Profile */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between py-4 gap-2">
            <div className="max-w-xl">
              <span className="text-sm font-medium text-ink">Profile</span>
              <p className="text-xs text-ink-2 mt-0.5">
                @{summary.profile.username} ({summary.profile.displayName || 'No name'}) • Experience:{' '}
                {summary.profile.experience || 'Not set'} • Goal: {summary.profile.goal || 'Not set'}
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Why: Displays your card to collaborators inside your team rooms.
              </p>
            </div>
            <div className="text-xs font-mono text-ink-muted shrink-0">
              {summary.profile.roles.length} roles, {summary.profile.stack.length} stack
            </div>
          </div>

          {/* Rooms */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between py-4 gap-2">
            <div className="max-w-xl">
              <span className="text-sm font-medium text-ink">Rooms</span>
              <p className="text-xs text-ink-2 mt-0.5">
                {summary.rooms.length > 0
                  ? summary.rooms.map((r) => `${r.roomName} (${r.role})`).join(', ')
                  : 'No active room memberships'}
              </p>
              <p className="text-xs text-ink-muted mt-1">Why: Manages your permissions and access inside team workspaces.</p>
            </div>
            <div className="text-xs font-mono text-ink-muted shrink-0">
              {summary.rooms.length} {summary.rooms.length === 1 ? 'room' : 'rooms'}
            </div>
          </div>

          {/* Content created */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between py-4 gap-2">
            <div className="max-w-xl">
              <span className="text-sm font-medium text-ink">Content you created</span>
              <p className="text-xs text-ink-2 mt-0.5">
                Ideas authored, tasks assigned or created, comments posted, and document revisions.
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Why: Powers your team's live brainstorm board, kanban roadmap, and project documentation.
              </p>
            </div>
            <div className="text-xs font-mono text-ink-muted shrink-0">
              {summary.content.ideasCount} ideas, {summary.content.tasksCount} tasks, {summary.content.commentsCount} comments
            </div>
          </div>

          {/* Files */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between py-4 gap-2">
            <div className="max-w-xl">
              <span className="text-sm font-medium text-ink">Files</span>
              <p className="text-xs text-ink-2 mt-0.5">
                Custom avatar photo and brief files uploaded to room storage.
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Why: Provides profile customisation and attachments for problem briefs.
              </p>
            </div>
            <div className="text-xs font-mono text-ink-muted shrink-0">
              {summary.files.count} files ({summary.files.formattedTotalSize})
            </div>
          </div>

          {/* Notifications */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between py-4 gap-2">
            <div className="max-w-xl">
              <span className="text-sm font-medium text-ink">Notifications</span>
              <p className="text-xs text-ink-2 mt-0.5">
                In-app notices for task assignments, mentions, and deadline alerts.
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Why: Keeps you informed of live team changes. Retained for {summary.retention.notificationsDays} days.
              </p>
            </div>
            <div className="text-xs font-mono text-ink-muted shrink-0">
              {summary.notifications.count} items
            </div>
          </div>

          {/* Email log */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between py-4 gap-2">
            <div className="max-w-xl">
              <span className="text-sm font-medium text-ink">Email log</span>
              <p className="text-xs text-ink-2 mt-0.5">
                Metadata log of transactional messages sent to your email address (subject, template, and timestamp only).
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Why: Delivery diagnostics and duplicate prevention. Retained for {summary.retention.emailLogDays} days.
              </p>
            </div>
            <div className="text-xs font-mono text-ink-muted shrink-0">
              {summary.emailLog.count} sent
            </div>
          </div>

          {/* Integrations */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between py-4 gap-2">
            <div className="max-w-xl">
              <span className="text-sm font-medium text-ink">Integrations</span>
              <p className="text-xs text-ink-2 mt-0.5">
                OAuth access grants and connected third-party tools.
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Why: Enables branch synchronization and room automation.
              </p>
            </div>
            <div className="text-xs font-mono text-ink-muted shrink-0">
              GitHub token encrypted: {summary.integrations.githubTokenStoredEncrypted ? 'yes' : 'no'}
            </div>
          </div>

          {/* Preferences */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between py-4 gap-2">
            <div className="max-w-xl">
              <span className="text-sm font-medium text-ink">Preferences</span>
              <p className="text-xs text-ink-2 mt-0.5">
                Theme, text sizing, motion mode, sidebar state, and timezone settings.
              </p>
              <p className="text-xs text-ink-muted mt-1">Why: Stores interface layout choices across your devices.</p>
            </div>
            <div className="text-xs font-mono text-ink-muted shrink-0">
              {summary.preferences.theme || 'system'} / {summary.preferences.timeFormat || '12h'}
            </div>
          </div>
        </div>

        {/* Disclosures block */}
        <div className="mt-5 space-y-2 text-xs text-ink-muted">
          <p>
            <strong className="text-ink font-medium">What we never store:</strong> Your sign-in passwords (you sign in
            with Google or GitHub) and payment details (there are no payments yet).
          </p>
          <p>
            When you use AI features, the relevant room text is sent to the AI provider shown in AI settings.
          </p>
        </div>
      </div>

      {/* Section 2: Export your data */}
      <div className="mb-10">
        <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-2">
          Export your data
        </h2>
        <div className="border-y border-border py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-ink">Export your data</p>
            <p className="text-xs text-ink-2 mt-0.5">
              Everything linked to your account, as a ZIP of JSON and Markdown files.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="min-h-[44px] px-5 gap-2 shrink-0 border-border text-ink hover:bg-hover-row"
          >
            {isExporting ? (
              <RefreshCw className="size-4 animate-spin text-ink-muted" />
            ) : (
              <Download className="size-4 text-ink-muted" />
            )}
            {isExporting ? 'Generating ZIP…' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Section 3: Delete account */}
      <div>
        <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-2">
          Delete account
        </h2>
        <div className="border-y border-border py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-ink">Delete account</p>
            <p className="text-xs text-ink-2 mt-0.5">
              Permanently delete your account, authentication links, personal files, and private rooms.
            </p>
          </div>
          <button
            type="button"
            onClick={openDeleteDialog}
            className="min-h-[44px] px-3 text-sm font-medium text-danger hover:underline hover:opacity-90 self-start sm:self-auto cursor-pointer"
          >
            Delete account
          </button>
        </div>
      </div>

      {/* Two-step Deletion Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-lg p-6 bg-surface border border-border text-ink">
          <DialogHeader>
            <DialogTitle className="text-lg font-serif">
              {deleteStep === 1 ? 'Review account deletion' : 'Confirm account deletion'}
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-2">
              {deleteStep === 1
                ? 'Review what will be deleted, what will be anonymised, and resolve room leadership.'
                : 'This action is immediate and cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          {deleteStep === 1 && (
            <div className="py-3 space-y-4 text-xs text-ink">
              {isPreviewLoading ? (
                <div className="space-y-2 py-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <>
                  {/* Blockers Notice */}
                  {hasBlockers && (
                    <div className="p-3.5 rounded-md border border-danger/30 bg-danger/5 space-y-2">
                      <div className="flex items-center gap-2 text-danger font-medium">
                        <AlertTriangle className="size-4 shrink-0" />
                        <span>Leadership blockers detected</span>
                      </div>
                      <p className="text-ink-2 leading-relaxed">
                        You are the leader of active rooms with teammates:
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        {preview?.blockers.map((b) => (
                          <li key={b.id}>
                            <span className="font-medium text-ink">{b.name}</span> ({b.memberCount} members) —{' '}
                            <Link
                              to={`/app/rooms/${b.id}/team`}
                              target="_blank"
                              className="text-primary underline hover:opacity-80"
                            >
                              Team page
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-2 flex items-start gap-2 border-t border-danger/20">
                        <Checkbox
                          id="autoTransferCheckbox"
                          checked={autoTransfer}
                          onCheckedChange={(checked) => setAutoTransfer(Boolean(checked))}
                          className="mt-0.5"
                        />
                        <label
                          htmlFor="autoTransferCheckbox"
                          className="text-ink font-medium cursor-pointer leading-tight"
                        >
                          Transfer leadership automatically to the longest-standing member
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Rooms to be deleted */}
                  <div className="space-y-1">
                    <p className="font-medium text-ink">Rooms that will be deleted:</p>
                    {preview?.willDelete && preview.willDelete.length > 0 ? (
                      <p className="text-ink-2">
                        {preview.willDelete.map((r) => r.name).join(', ')} (you are the only member)
                      </p>
                    ) : (
                      <p className="text-ink-muted">No solo rooms will be deleted.</p>
                    )}
                  </div>

                  {/* Shared rooms anonymisation */}
                  <div className="space-y-1">
                    <p className="font-medium text-ink">Rooms that stay:</p>
                    <p className="text-ink-2 leading-relaxed">
                      Your memberships and presence will be removed. Your ideas (
                      <span className="font-mono">{preview?.willAnonymise.ideasCount ?? 0}</span>), tasks (
                      <span className="font-mono">{preview?.willAnonymise.tasksCount ?? 0}</span> unassigned), and
                      comments (<span className="font-mono">{preview?.willAnonymise.commentsCount ?? 0}</span>) will be
                      retained under a generic{' '}
                      <span className="font-mono text-ink">Deleted user</span> profile.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {deleteStep === 2 && (
            <div className="py-3 space-y-4 text-xs text-ink">
              <div className="p-3 rounded-md bg-muted/40 border border-border space-y-1 text-ink-2">
                <p>
                  Type your username <span className="font-mono font-medium text-ink">@{username}</span> to confirm
                  deletion:
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-ink text-xs">Confirm username</label>
                <Input
                  type="text"
                  placeholder={`@${username}`}
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value.replace(/^@/, ''))}
                  className="font-mono text-sm bg-background border-border text-ink h-11"
                />
              </div>

              <div className="flex items-start gap-2 pt-2">
                <Checkbox
                  id="understandCheckbox"
                  checked={confirmCheckbox}
                  onCheckedChange={(checked) => setConfirmCheckbox(Boolean(checked))}
                  className="mt-0.5"
                />
                <label
                  htmlFor="understandCheckbox"
                  className="text-ink cursor-pointer leading-tight text-xs"
                >
                  I understand this can't be undone.
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2 justify-between items-center">
            {deleteStep === 1 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="min-h-[44px] gap-2 border-border text-ink w-full sm:w-auto"
                >
                  <Download className="size-3.5" /> Export my data first
                </Button>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(false)}
                    className="min-h-[44px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setDeleteStep(2)}
                    disabled={!canProceedToStep2}
                    className="min-h-[44px] gap-1.5 bg-ink text-surface hover:opacity-90"
                  >
                    Continue <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteStep(1)}
                  disabled={deleteMutation.isPending}
                  className="min-h-[44px]"
                >
                  Back
                </Button>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={deleteMutation.isPending}
                    className="min-h-[44px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!canSubmitDelete}
                    onClick={() =>
                      deleteMutation.mutate({
                        confirmUsername: username,
                        autoTransferLeadership: autoTransfer,
                      })
                    }
                    className="min-h-[44px] bg-danger text-on-danger hover:bg-danger/90 font-medium cursor-pointer"
                  >
                    {deleteMutation.isPending ? 'Deleting account…' : 'Delete my account'}
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
