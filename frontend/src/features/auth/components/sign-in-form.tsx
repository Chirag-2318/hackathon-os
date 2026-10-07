/**
 * SignInForm — S02 left panel.
 * Source: PRD §3.2.
 *
 * Logo · H1 · Continue with GitHub (primary) · Continue with Google (outline)
 * · permissions line · privacy link.
 * Error: inline above buttons, rises 8px, announced via aria-live.
 * No browser storage for session data.
 */
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { COPY } from '@/shared/constants/copy';
import { ROUTES } from '@/shared/constants/routes';
import { useAuthGitHub, useAuthGoogle } from '../hooks/use-auth';
import { authApi } from '../api';
import { announce } from '@/shared/utils/announce';
import { useEffect, useState } from 'react';

export function SignInForm() {
  const navigate = useNavigate();
  const github = useAuthGitHub();
  const google = useAuthGoogle();
  const [error, setError] = useState<string | null>(null);

  const isLoading = github.isPending || google.isPending;

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
      </div>

      {/* Permissions line */}
      <p className="mt-6 text-caption text-ink-muted max-w-sm">
        {COPY.signIn.permissionsLine}
      </p>

      {/* Privacy link */}
      <a
        href={COPY.signIn.privacyUrl}
        className="mt-2 text-caption text-lav-600 hover:underline"
      >
        {COPY.signIn.privacyLabel}
      </a>
    </div>
  );
}
