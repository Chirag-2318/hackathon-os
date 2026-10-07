/**
 * InviteLandingPage — S03 page composition.
 * Source: PRD §3.3.
 *
 * One card, centered on canvas. Flat-card rule: surface, r-card, 1px border, no shadow.
 * Fetches invite by :token param. Shows skeleton → valid card or expired message.
 * Skeleton → content: 160ms cross-fade, no layout shift.
 * Standalone entry — does not pass through S01.
 */
import { useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useInvite } from './hooks/use-invite';
import { InviteCard } from './components/invite-card';
import { InviteExpired } from './components/invite-expired';
import { InviteSkeleton } from './components/invite-skeleton';
import { COPY } from '@/shared/constants/copy';

const queryClient = new QueryClient();

function InviteContent() {
  const { token = '' } = useParams<{ token: string }>();
  const { data, isLoading, isError, refetch } = useInvite(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
      <div className="w-full max-w-[480px] rounded-card border border-border bg-surface">
        {/* Loading */}
        {isLoading && <InviteSkeleton />}

        {/* Network / server error (different from expired) */}
        {isError && !isLoading && (
          <div
            className="flex flex-col items-center gap-4 p-8 text-center"
            role="alert"
            data-testid="invite-network-error"
          >
            <AlertCircle
              className="size-8 text-danger-text"
              strokeWidth={1.5}
            />
            <p className="text-body text-danger-text">
              {COPY.invite.errorMessage}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {/* Valid invite */}
        {!isLoading &&
          !isError &&
          data?.status === 'valid' &&
          data.room && (
            <div
              className="animate-in fade-in"
              style={{
                animationDuration: 'var(--t-fast)',
                animationTimingFunction: 'var(--ease-out)',
              }}
            >
              <InviteCard room={data.room} token={token} />
            </div>
          )}

        {/* Expired / invalid */}
        {!isLoading && !isError && data?.status === 'expired_or_invalid' && (
          <InviteExpired />
        )}
      </div>
    </div>
  );
}

export function InviteLandingPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <InviteContent />
    </QueryClientProvider>
  );
}
