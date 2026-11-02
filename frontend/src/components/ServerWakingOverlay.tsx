import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Server, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

let setWakingStateGlobal: ((waking: boolean) => void) | null = null;
let isWakingGlobal = false;

export function triggerServerWaking() {
  if (!isWakingGlobal && setWakingStateGlobal) {
    isWakingGlobal = true;
    setWakingStateGlobal(true);
  }
}

export function isServerWakingUp(): boolean {
  return isWakingGlobal;
}

export function ServerWakingOverlay() {
  const [isWaking, setIsWaking] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(3);
  const [isChecking, setIsChecking] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);
  const queryClient = useQueryClient();
  const pollTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setWakingStateGlobal = (val: boolean) => {
      setIsWaking(val);
      if (val) {
        setPollAttempt(0);
        setSecondsRemaining(2);
      }
    };
    return () => {
      setWakingStateGlobal = null;
    };
  }, []);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/v1/health', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        // Backend has successfully booted!
        isWakingGlobal = false;
        setIsWaking(false);
        setIsChecking(false);
        queryClient.invalidateQueries();
        return;
      }
    } catch {
      // Backend is still unreachable
    }
    setIsChecking(false);

    // Schedule next health check with exponential backoff up to 10 seconds
    const nextInterval = Math.min(2 + pollAttempt * 2, 10);
    setPollAttempt((prev) => prev + 1);
    setSecondsRemaining(nextInterval);
  }, [pollAttempt, queryClient]);

  useEffect(() => {
    if (!isWaking) {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    countdownTimerRef.current = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          checkHealth();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isWaking, checkHealth]);

  if (!isWaking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 shadow-2xl text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
          <Server className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Backend is waking up
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Free cloud instances go to sleep after periods of inactivity.
            Booting the backend typically takes 30 to 60 seconds.
          </p>
        </div>

        <div className="py-2">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-indeterminate" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isChecking
              ? 'Probing server health...'
              : `Checking health in ${secondsRemaining}s...`}
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkHealth()}
            disabled={isChecking}
            className="w-full gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            Check Connection Now
          </Button>
        </div>
      </div>
    </div>
  );
}

