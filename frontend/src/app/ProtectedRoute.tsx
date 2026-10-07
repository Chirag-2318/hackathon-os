import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/useCurrentUser';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useCurrentUser();

  if (isLoading) return <div>Loading...</div>;
  if (isError || !data) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
