import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchAiStatus,
  testUserAiKey,
  deleteUserAiKey,
  type AiStatusResponse,
} from '@/features/prep/api/settings-api';
import { useAiKeyDialogStore } from '@/features/ai-gate/use-ai-key-dialog-store';
import { ConfirmDialog } from '@/design/components/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/design/components/button';
import { Loader2, ExternalLink, RefreshCw, Trash2, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/features/auth/useAuthStore';

export function AiKeysSection() {
  const queryClient = useQueryClient();
  const openDialog = useAiKeyDialogStore((s) => s.openDialog);

  const [isTesting, setIsTesting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const {
    data: aiStatus,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<AiStatusResponse>({
    queryKey: ['ai-status'],
    queryFn: fetchAiStatus,
    staleTime: 30_000,
  });

  const handleTestKey = async () => {
    setIsTesting(true);
    try {
      const res = await testUserAiKey();
      if (res.ok) {
        toast.success(`Key verified. Responded in ${res.latencyMs ?? 0} ms`);
        queryClient.invalidateQueries({ queryKey: ['ai-status'] });
      } else {
        toast.error(res.error || 'Groq connection test failed');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Groq connection test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const handleRemoveKey = async () => {
    setIsRemoving(true);
    try {
      await deleteUserAiKey();
      toast.success('API key removed');
      setShowRemoveConfirm(false);

      const currentUser = useAuthStore.getState().user;
      const keyInfo = {
        hasKey: false,
        status: null,
        last4: null,
      };

      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          aiKey: keyInfo,
        });
      }

      queryClient.setQueryData(['currentUser'], (prev: any) =>
        prev ? { ...prev, aiKey: keyInfo } : prev
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ai-status'] }),
        queryClient.invalidateQueries({ queryKey: ['currentUser'] }),
        queryClient.invalidateQueries({ queryKey: ['meta'] }),
      ]);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove API key');
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 max-w-3xl">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="divide-y divide-border border-y border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !aiStatus) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink">AI Settings</h1>
          <p className="text-caption text-ink-muted mt-1">Bring your own Groq API key for AI features.</p>
        </div>
        <div className="p-4 rounded-control border border-danger/30 bg-danger/5 flex items-center justify-between">
          <span className="text-body text-danger">Failed to load AI settings.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-control text-caption font-medium text-ink border border-border hover:bg-hover transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Status mapping
  let statusWord = 'Not connected';
  let dotColor = 'bg-neutral-400';
  if (aiStatus.keyConfigured && aiStatus.keyStatus === 'VALID') {
    statusWord = 'Connected';
    dotColor = 'bg-emerald-500';
  } else if (aiStatus.keyConfigured && (aiStatus.keyStatus === 'INVALID' || aiStatus.keyStatus === 'RATE_LIMITED')) {
    statusWord = 'Needs attention';
    dotColor = 'bg-amber-500';
  }

  const maskedKey = aiStatus.keyConfigured
    ? `gsk_•••• ${aiStatus.last4 || '••••'}`
    : 'No key configured';

  const usageList = aiStatus.usage || [];
  const totalCalls = usageList.reduce((acc, curr) => acc + (curr.calls || 0), 0);
  const maxCalls = Math.max(...usageList.map((u) => u.calls || 0), 1);

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink">AI Settings</h1>
        <p className="text-caption text-ink-muted mt-1">
          Every AI feature uses your own Groq API key. Zero platform AI costs.
        </p>
      </div>

      {/* Main Settings Rows */}
      <section aria-labelledby="section-ai-configuration">
        <h2 id="section-ai-configuration" className="text-[13px] font-medium text-ink-muted uppercase tracking-wider mb-2">
          Configuration
        </h2>

        <div className="divide-y divide-border border-y border-border">
          {/* Row 1: Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 min-h-[44px]">
            <div>
              <span className="text-body font-medium text-ink block">Status</span>
              <p className="text-caption text-ink-muted mt-0.5">Groq API key connection state</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className={`size-2.5 rounded-full ${dotColor} shrink-0`} aria-hidden="true" />
              <span className="text-body font-medium text-ink">{statusWord}</span>
            </div>
          </div>

          {/* Row 2: Key */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 min-h-[44px]">
            <div>
              <span className="text-body font-medium text-ink block">API Key</span>
              <p className="font-mono text-caption text-ink-muted mt-0.5">{maskedKey}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
              {aiStatus.keyConfigured ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openDialog('settings')}
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isTesting || isFetching}
                    onClick={handleTestKey}
                    className="flex items-center gap-1.5"
                  >
                    {isTesting ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                    Test
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setShowRemoveConfirm(true)}
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => openDialog('settings')}
                  className="flex items-center gap-1.5"
                >
                  <KeyRound className="size-3.5" />
                  Add key
                </Button>
              )}
            </div>
          </div>

          {/* Row 3: How to get a key */}
          <div className="py-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <span className="text-body font-medium text-ink block">How to get a key</span>
                <p className="text-caption text-ink-muted mt-0.5">
                  Groq&apos;s free tier does not require a credit card.
                </p>
              </div>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control text-caption font-medium text-ink border border-border hover:bg-hover transition-colors shrink-0 self-start sm:self-center"
              >
                <span>Open Groq console</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>

            <ol className="text-caption text-ink-muted space-y-1.5 pl-4 list-decimal">
              <li>Open the Groq console and sign in or sign up.</li>
              <li>Create an API key (starts with <code className="font-mono text-ink">gsk_</code>).</li>
              <li>Click &quot;{aiStatus.keyConfigured ? 'Replace' : 'Add key'}&quot; above and paste it.</li>
            </ol>
            <p className="text-[12px] text-ink-muted italic">
              Note: This is Groq (groq.com), not xAI&apos;s Grok.
            </p>
          </div>

          {/* Row 4: Models */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 min-h-[44px]">
            <div>
              <span className="text-body font-medium text-ink block">Models</span>
              <p className="text-caption text-ink-muted mt-0.5">Inference models used for features</p>
            </div>
            <div className="font-mono text-caption text-ink self-start sm:self-center text-right space-y-0.5">
              <div>default: {aiStatus.defaultModel || 'llama-3.3-70b-versatile'}</div>
              <div>fast: {aiStatus.fastModel || 'llama-3.1-8b-instant'}</div>
              <div>smart: {aiStatus.smartModel || 'llama-3.3-70b-versatile'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Row 5: Your usage last 7 days */}
      <section aria-labelledby="section-usage">
        <h2 id="section-usage" className="text-[13px] font-medium text-ink-muted uppercase tracking-wider mb-2">
          Your usage (Last 7 days)
        </h2>

        <div className="border-y border-border py-2">
          {totalCalls === 0 ? (
            <p className="text-caption text-ink-muted py-4">
              No AI calls recorded for your account in the last 7 days.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {usageList.map((dayStat) => {
                const calls = dayStat.calls || 0;
                const failures = dayStat.failures || 0;
                const barWidth = Math.max(Math.round((calls / maxCalls) * 100), 2);

                return (
                  <div
                    key={dayStat.day}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-caption"
                  >
                    <span className="font-mono text-ink-muted w-28 shrink-0">{dayStat.day}</span>
                    <div className="flex-1 max-w-xs h-2 bg-surface rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-lav-600 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center font-mono">
                      <span className="text-ink">{calls} calls</span>
                      {failures > 0 && (
                        <span className="text-danger">({failures} failed)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Privacy Line */}
      <div className="pt-2 border-t border-border">
        <p className="text-caption text-ink-muted">
          Your key is encrypted on our server and only used for your own requests. When you use an AI feature, the room text involved is sent to Groq.
        </p>
      </div>

      {/* Confirm Remove Dialog */}
      <ConfirmDialog
        open={showRemoveConfirm}
        onOpenChange={setShowRemoveConfirm}
        title="Remove Groq API key"
        description="AI features will be unavailable until you add a new key. Are you sure you want to remove your key?"
        confirmLabel="Remove key"
        variant="danger"
        isLoading={isRemoving}
        onConfirm={handleRemoveKey}
      />
    </div>
  );
}
