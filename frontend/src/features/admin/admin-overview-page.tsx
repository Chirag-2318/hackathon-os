import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, API_BASE_URL } from '@/design/api';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/design/components/confirm-dialog';
import { toast } from '@/design/components/toast';
import { Download, RefreshCw, Power } from 'lucide-react';
import { NotFoundPage } from '@/features/system-pages/system-pages';

export interface AdminOverviewDto {
  users: number;
  cap: number;
  spotsLeft: number | null;
  signups24h: number;
  waitlistCount: number;
  rooms: number;
  roomsActive24h: number;
  members: number;
  emailsSentToday: number;
  emailsFailed24h: number;
  outboxPending: number;
  usersWithAiKey: number;
  aiCallsToday: number;
  aiFailures24h: number;
  clientErrors24h: number;
  databaseSize: string;
  signupsOpen: boolean;
}

export function AdminOverviewPage() {
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    data: overview,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<AdminOverviewDto>({
    queryKey: ['admin-overview'],
    queryFn: () => apiFetch<AdminOverviewDto>('/api/v1/admin/overview'),
    enabled: Boolean(currentUser?.isAdmin),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    retry: false,
  });

  const toggleSignupsMutation = useMutation({
    mutationFn: (newOpen: boolean) =>
      apiFetch<{ signupsOpen: boolean }>('/api/v1/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ signupsOpen: newOpen }),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['public-capacity'] });
      toast.success(res.signupsOpen ? 'Sign-ups reopened' : 'Sign-ups closed');
      setConfirmOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update settings');
    },
  });

  if (isUserLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center font-mono text-xs text-muted-foreground">
        Loading admin console…
      </div>
    );
  }

  // Only for ADMIN_EMAILS; everyone else gets 404
  if (!currentUser?.isAdmin || isError) {
    return <NotFoundPage />;
  }

  const signupsOpen = overview?.signupsOpen ?? true;

  const handleDownloadCsv = () => {
    window.open(`${API_BASE_URL}/api/v1/admin/waitlist.csv`, '_blank');
  };

  const statItems = overview
    ? [
        { label: 'ACTIVE USERS', value: overview.users.toLocaleString() },
        { label: 'USER CAP', value: overview.cap === 0 ? 'UNLIMITED' : overview.cap.toLocaleString() },
        { label: 'SPOTS LEFT', value: overview.spotsLeft === null ? 'UNLIMITED' : overview.spotsLeft.toLocaleString() },
        { label: 'SIGNUPS (24H)', value: overview.signups24h.toLocaleString() },
        { label: 'WAITLIST TOTAL', value: overview.waitlistCount.toLocaleString() },
        { label: 'TOTAL ROOMS', value: overview.rooms.toLocaleString() },
        { label: 'ROOMS ACTIVE (24H)', value: overview.roomsActive24h.toLocaleString() },
        { label: 'TOTAL MEMBERS', value: overview.members.toLocaleString() },
        { label: 'EMAILS SENT TODAY', value: overview.emailsSentToday.toLocaleString() },
        { label: 'EMAILS FAILED (24H)', value: overview.emailsFailed24h.toLocaleString() },
        { label: 'OUTBOX PENDING', value: overview.outboxPending.toLocaleString() },
        { label: 'USERS WITH AI KEY', value: overview.usersWithAiKey.toLocaleString() },
        { label: 'AI CALLS TODAY', value: overview.aiCallsToday.toLocaleString() },
        { label: 'AI FAILURES (24H)', value: overview.aiFailures24h.toLocaleString() },
        { label: 'CLIENT ERRORS (24H)', value: overview.clientErrors24h.toLocaleString() },
        { label: 'DATABASE SIZE', value: overview.databaseSize },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl sm:text-3xl font-normal tracking-tight text-foreground"
              style={{ fontFamily: 'var(--font-display, "Instrument Serif", Georgia, serif)' }}
            >
              Admin Overview
            </h1>
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider uppercase ${
                signupsOpen
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}
            >
              {signupsOpen ? 'SIGN-UPS OPEN' : 'SIGN-UPS PAUSED'}
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Platform telemetry and launch controls. Auto-refreshes every 30s.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="font-mono text-xs gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCsv}
            className="font-mono text-xs gap-1.5"
          >
            <Download className="size-3.5" />
            Waitlist CSV
          </Button>

          <Button
            variant={signupsOpen ? 'destructive' : 'default'}
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="font-mono text-xs gap-1.5"
          >
            <Power className="size-3.5" />
            {signupsOpen ? 'Close sign-ups' : 'Reopen sign-ups'}
          </Button>
        </div>
      </div>

      {/* Grid of numbers in mono with hairlines (no cards inside cards) */}
      {isLoading ? (
        <div className="p-12 text-center font-mono text-xs text-muted-foreground border border-border">
          Gathering platform metrics…
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 border border-border divide-x divide-y divide-border bg-card">
          {statItems.map((item, idx) => (
            <div key={idx} className="p-5 flex flex-col justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                {item.label}
              </span>
              <span className="font-mono text-2xl font-semibold tracking-tight text-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ConfirmDialog for Toggle */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={signupsOpen ? 'Close platform sign-ups?' : 'Reopen platform sign-ups?'}
        description={
          signupsOpen
            ? 'New user registrations via OAuth will be refused immediately and redirected to the waitlist card. Existing user accounts will keep working without interruption.'
            : 'New users will once again be permitted to create accounts up to the platform capacity cap.'
        }
        confirmLabel={signupsOpen ? 'Close sign-ups' : 'Reopen sign-ups'}
        variant={signupsOpen ? 'danger' : 'primary'}
        isLoading={toggleSignupsMutation.isPending}
        onConfirm={() => toggleSignupsMutation.mutate(!signupsOpen)}
      />
    </div>
  );
}
