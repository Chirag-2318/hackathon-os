import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/useCurrentUser';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useCurrentUser();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-canvas text-ink-muted">Loading...</div>;
  if (isError || !data) return <Navigate to="/login" replace />;
  if (!data.onboardingCompleted) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}
