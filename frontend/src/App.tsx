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
import { SoundEffects } from '@/shared/sound/sound-effects';

const lastErrorToastTimes = new Map<string, number>();

function showThrottledErrorToast(requestType: string, rawMessage: string) {
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
      const queryType = Array.isArray(query.queryKey) ? String(query.queryKey[0]) : 'query';
      const status = error?.status ?? error?.response?.status;
      if (status !== 401) {
        showThrottledErrorToast(queryType, error?.message || `Request failed (${queryType})`);
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        const status = error?.status ?? error?.response?.status;
        if (status === 400 || status === 403 || status === 404) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 60000),
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider delayDuration={300}>
          <SoundEffects>
            <MotionTreeWrapper>
              <OfflineBanner />
              <AppRouter />
              <SessionExpiryDialog />
              <Toaster position="bottom-right" />
            </MotionTreeWrapper>
          </SoundEffects>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
