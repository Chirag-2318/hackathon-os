import React, { useState, useEffect } from 'react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ConfirmDialog } from '@/design';
import { AlertCircle } from 'lucide-react';
import { playSound } from '@/shared/sound/sound-effects';

export interface LeaderInfo {
  id?: string;
  username?: string;
  name?: string;
  avatarUrl?: string;
}

export interface SubmissionStateAProps {
  isLeader: boolean;
  leader?: LeaderInfo | null;
  deadlineAt?: string | null;
  clockStatus?: string | null;
  isOnline: boolean;
  onSubmit: () => Promise<void>;
  submitting: boolean;
  submitError: string | null;
}

export function SubmissionStateA({
  isLeader,
  leader,
  deadlineAt,
  clockStatus,
  isOnline,
  onSubmit,
  submitting,
  submitError,
}: SubmissionStateAProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const countdownText = React.useMemo(() => {
    if (clockStatus === 'ENDED' || clockStatus === 'PASSED') {
      return 'Submission window has closed';
    }
    if (!deadlineAt) return null;
    const deadlineMs = new Date(deadlineAt).getTime();
    if (isNaN(deadlineMs)) return null;
    const diffMs = deadlineMs - now;
    if (diffMs <= 0) {
      return 'Submission window has closed';
    }
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `Submissions close in ${hours}h ${minutes}m`;
  }, [deadlineAt, clockStatus, now]);

  const handleOpenConfirm = () => {
    if (!isOnline || submitting) return;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    playSound('success');
    await onSubmit();
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[560px] text-center flex flex-col items-center">
        {/* Headline --font-display 52px */}
        <h1
          className="text-[40px] md:text-[52px] font-normal tracking-tight text-foreground leading-[1.08]"
          style={{ fontFamily: 'var(--font-display, serif)' }}
        >
          Have you submitted?
        </h1>

        {/* One muted 15px line */}
        <p className="text-[15px] text-muted-foreground leading-relaxed mt-4 mb-8">
          Submit your project on the event&apos;s own platform. When that&apos;s done, mark it here to close out this room.
        </p>

        {/* Inline submission error if failed */}
        {submitError && (
          <div className="mb-6 flex items-center justify-center gap-2 text-xs font-mono text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Leader action or Member notice */}
        {isLeader ? (
          <div className="flex flex-col items-center">
            <button
              type="button"
              disabled={submitting || !isOnline}
              onClick={handleOpenConfirm}
              className="min-h-[44px] px-8 py-3.5 text-base font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors duration-160 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {submitting ? 'Marking submitted...' : "Yes, we've submitted"}
            </button>
            {!isOnline && (
              <span className="text-xs text-muted-foreground font-mono mt-2">
                Offline (read-only)
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-[15px] text-muted-foreground">
            <span>Only the leader can mark this. Ask</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <UserAvatar user={leader} size={20} className="inline-block" />
              <span>@{leader?.username || 'leader'}</span>
            </span>
            <span>when it&apos;s done.</span>
          </div>
        )}

        {/* Real mono countdown info line */}
        {countdownText && (
          <p className="mt-6 text-sm font-mono text-muted-foreground">
            {countdownText}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Mark this project as submitted?"
        description="This marks the room complete for everyone. You can reopen it later."
        confirmLabel="Mark as submitted"
        cancelLabel="Not yet"
        variant="primary"
        isLoading={submitting}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
