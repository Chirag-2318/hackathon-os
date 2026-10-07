/**
 * useAuth — mutation hooks for OAuth sign-in.
 * Source: PRD §3.2, T§7.1.
 *
 * No localStorage/sessionStorage for session data.
 * Auth is a server-side cookie session.
 */
import { useMutation } from '@tanstack/react-query';
import { authWithGitHub, authWithGoogle, type AuthResult } from '@/api/client';

export function useAuthGitHub() {
  return useMutation<AuthResult, Error>({
    mutationFn: authWithGitHub,
  });
}

export function useAuthGoogle() {
  return useMutation<AuthResult, Error>({
    mutationFn: authWithGoogle,
  });
}
