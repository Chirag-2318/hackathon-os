/**
 * SignInForm — S02 left panel.
 * Source: PRD §3.2.
 *
 * Logo · H1 · Continue with GitHub (primary) · Continue with Google (outline)
 * · permissions line · privacy link.
 * Error: inline above buttons, rises 8px, announced via aria-live.
 * No browser storage for session data.
 */
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { COPY } from '@/shared/constants/copy';
import { ROUTES } from '@/shared/constants/routes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthGitHub, useAuthGoogle } from '../hooks/use-auth';
import { authApi } from '../api';
import { announce } from '@/shared/utils/announce';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/design/api';
import { FullCapacityCard } from '@/features/public/full-capacity-card';

interface CapacityDto {
  open: boolean;
  cap: number;
  spotsLeft: number | null;
}

export function SignInForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const github = useAuthGitHub();
  const google = useAuthGoogle();
  const [error, setError] = useState<string | null>(null);
  const [showSignInAnyway, setShowSignInAnyway] = useState(false);

  const { data: capacity } = useQuery<CapacityDto>({
    queryKey: ['public-capacity'],
    queryFn: () => apiFetch<CapacityDto>('/api/v1/public/capacity'),
    staleTime: 30000,
  });

  const isLoading = github.isPending || google.isPending;

  // Invalidate stale user session on login page load
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
  }, [queryClient]);

  // Preserve invite redirect token across OAuth sign-in flow
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect && redirect.startsWith('/invite/')) {
        const parts = redirect.split('/');
        const token = parts[parts.length - 1];
        if (token) {
          sessionStorage.setItem('pending_invite_token', token);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Announce error to assistive tech
  useEffect(() => {
    if (error) {
      announce(error, 'assertive');
    }
  }, [error]);

  const handleGitHub = () => {
    window.location.href = authApi.githubLoginUrl;
  };

  const handleGoogle = () => {
    window.location.href = authApi.googleLoginUrl;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 md:items-start md:px-16 lg:px-24">
      {/* Logo */}
      <span className="text-h3 text-ink font-bold mb-8">{COPY.logo}</span>

      {/* H1 */}
      <h1 className="text-h1 text-ink-strong mb-8">{COPY.signIn.h1}</h1>

      {/* Error — inline above buttons, 8px rise + fade */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 flex items-start gap-2 text-caption text-danger-text animate-in fade-in slide-in-from-bottom-2"
          style={{
            animationDuration: 'var(--t-base)',
            animationTimingFunction: 'var(--ease-out)',
          }}
          data-testid="auth-error"
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      {/* When capacity is full or closed, show the card inline unless user chose to sign in */}
      {capacity && !capacity.open && !showSignInAnyway ? (
        <FullCapacityCard
          reason={capacity.spotsLeft === 0 ? 'capacity' : 'closed'}
          isInline
          onSignIn={() => setShowSignInAnyway(true)}
        />
      ) : (
        <>
          {/* Provider buttons */}
          <div className="flex w-full max-w-sm flex-col gap-3">
            <Button
              size="lg"
              onClick={handleGitHub}
              disabled={isLoading}
              className="w-full"
              data-testid="btn-github"
            >
              {github.isPending ? 'Signing in…' : COPY.signIn.githubButton}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleGoogle}
              disabled={isLoading}
              className="w-full"
              data-testid="btn-google"
            >
              {google.isPending ? 'Signing in…' : COPY.signIn.googleButton}
            </Button>

            {/* Muted mono line under buttons from capacity endpoint */}
            {capacity && capacity.open && capacity.cap > 0 && capacity.spotsLeft !== null && (
              <p className="mt-2 text-center font-mono text-xs text-ink-muted">
                Early access, {capacity.cap.toLocaleString()} spots. {capacity.spotsLeft.toLocaleString()} left.
              </p>
            )}
          </div>

          {/* Permissions line */}
          <p className="mt-6 text-caption text-ink-muted max-w-sm">
            {COPY.signIn.permissionsLine}
          </p>
        </>
      )}

      {/* Footer links: Terms, Privacy */}
      <div className="mt-8 flex items-center gap-3 text-caption text-ink-muted">
        <Link to="/terms" className="hover:text-ink hover:underline">
          Terms
        </Link>
        <span className="text-zinc-600">·</span>
        <Link to="/privacy" className="hover:text-ink hover:underline">
          Privacy
        </Link>
      </div>
    </div>
  );
}
