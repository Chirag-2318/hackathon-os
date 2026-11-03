import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppRouter } from '@/app/routes/router';
import { useMotionModeSync, useIsMotionReduced } from '@/shared/motion/use-motion-mode';
import { Toaster } from '@/components/ui/sonner';
import { OfflineBanner } from '@/components/OfflineBanner';
import { SessionExpiryDialog } from '@/components/SessionExpiryDialog';
import { ServerWakingOverlay, triggerServerWaking, isServerWakingUp } from '@/components/ServerWakingOverlay';
import { SoundEffects } from '@/shared/sound/sound-effects';
import { useNotificationStream } from '@/api/useNotificationStream';
import { useCurrentUser } from '@/features/auth/useCurrentUser';

const lastErrorToastTimes = new Map<string, number>();

function showThrottledErrorToast(requestType: string, rawMessage: string) {
  if (isServerWakingUp()) {
    // Suppress error toast storms while backend is cold starting
    return;
  }
  const now = Date.now();
  const lastTime = lastErrorToastTimes.get(requestType) ?? 0;
  if (now - lastTime >= 60_000) {
    lastErrorToastTimes.set(requestType, now);
    let message = rawMessage;
    if (message.includes('<!doctype') || message.includes('<!DOCTYPE') || message.includes("Unexpected token '<'")) {
      message = 'Backend service is starting or unreachable. Please retry.';
    }
    toast.error(message);
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      if (error?.name === 'AbortError') return;
      const status = error?.status ?? error?.response?.status;

      // When encountering gateway/timeout/wake errors, trigger waking overlay
      if (status === 502 || status === 503 || status === 504 || (error?.name === 'TypeError' && navigator.onLine)) {
        triggerServerWaking();
        return;
      }

      const queryType = Array.isArray(query.queryKey) ? String(query.queryKey[0]) : 'query';
      if (status !== 401 && status !== 429) {
        showThrottledErrorToast(queryType, error?.message || `Request failed (${queryType})`);
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        const status = error?.status ?? error?.response?.status;
        if (status === 400 || status === 401 || status === 403 || status === 404 || status === 429) {
          return false;
        }
        // Retry network errors and 5xx only, max 2 times, with jitter
        const is5xx = typeof status === 'number' && status >= 500 && status < 600;
        const isNetworkError = !status || status === 0 || error?.name === 'TypeError';
        if ((is5xx || isNetworkError) && failureCount < 2) {
          return true;
        }
        return false;
      },
      retryDelay: (attemptIndex) => {
        const base = Math.min(1000 * Math.pow(2, attemptIndex), 30000);
        const jitter = Math.floor(Math.random() * 500);
        return base + jitter;
      },
    },
  },
});

function MotionTreeWrapper({ children }: { children: React.ReactNode }) {
  useMotionModeSync();
  const isReduced = useIsMotionReduced();
  return (
    <MotionConfig reducedMotion={isReduced ? "always" : "never"}>
      {children}
    </MotionConfig>
  );
}

if (import.meta.env.DEV) {
  import('@/utils/contrast-checker').then((m) => m.initContrastChecker());
}

function NotificationStreamWatcher() {
  useNotificationStream();
  return null;
}

function AuthenticatedNotificationStream() {
  const { data: currentUser } = useCurrentUser();
  if (!currentUser) return null;
  return <NotificationStreamWatcher />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider delayDuration={300}>
          <SoundEffects>
            <MotionTreeWrapper>
              <AuthenticatedNotificationStream />
              <OfflineBanner />
              <AppRouter />
              <SessionExpiryDialog />
              <ServerWakingOverlay />
              <Toaster position="bottom-right" />
            </MotionTreeWrapper>
          </SoundEffects>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
