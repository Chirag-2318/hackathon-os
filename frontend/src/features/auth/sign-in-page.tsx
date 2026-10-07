/**
 * SignInPage — S02 page composition.
 * Source: PRD §3.2.
 *
 * Split layout: form left, illustration right.
 * Full viewport height. Illustration hidden below 768px.
 * No sidebar, topbar, or command palette (public screen).
 * Wrapped in QueryClientProvider for mutation hooks.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SignInForm } from './components/sign-in-form';
import { SignInIllustration } from './components/sign-in-illustration';

const queryClient = new QueryClient();

export function SignInPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="grid min-h-screen grid-cols-1 bg-canvas md:grid-cols-2">
        {/* Left: form */}
        <SignInForm />

        {/* Right: illustration */}
        <SignInIllustration />
      </div>
    </QueryClientProvider>
  );
}
