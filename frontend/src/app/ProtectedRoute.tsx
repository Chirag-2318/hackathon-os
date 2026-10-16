import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/useCurrentUser';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useCurrentUser();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-canvas text-ink-muted">Loading...</div>;
  if (isError || !data) return <Navigate to="/login" replace />;
  if (!data.onboardingCompleted) return <Navigate to="/onboarding" replace />;

  const pendingInvite = typeof window !== 'undefined' ? sessionStorage.getItem('pending_invite_token') : null;
  if (pendingInvite) {
    sessionStorage.removeItem('pending_invite_token');
    return <Navigate to={`/invite/${pendingInvite}`} replace />;
  }

  return <>{children}</>;
}
