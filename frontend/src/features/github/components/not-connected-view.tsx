import React, { useState } from 'react';
import {
  GitBranch, ShieldCheck, CheckCircle2, ArrowRight, Loader2,
  AlertCircle, Sparkles, Pin, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@/components/primitives/segmented-control';

interface NotConnectedViewProps {
  onConnect: (repoInput: string) => Promise<void>;
}

export function NotConnectedView({ onConnect }: NotConnectedViewProps) {
  const [tab, setTab] = useState<'paste' | 'oauth'>('paste');
  const [repoInput, setRepoInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const steps = ['Finding repository...', 'Reading branch heads...', 'Running judge checks...'];

  const sampleRepos = [
    'octocat/Hello-World',
    'open-build/sprint-app',
  ];

  const handleConnect = async (targetRepo?: string) => {
    const input = targetRepo || repoInput;
    if (!input.trim()) {
      setErrorMessage('Please enter a valid owner/repo or GitHub URL');
      return;
    }
    setErrorMessage('');
    setIsConnecting(true);
    setStepIndex(0);

    // Simulate 3 progress steps over 2 seconds
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 600);

    try {
      await new Promise((r) => setTimeout(r, 1900));
      await onConnect(input.trim());
    } catch (err: any) {
      setErrorMessage(err?.message || 'Repository not found or private. Make sure it is public.');
    } finally {
      clearInterval(interval);
      setIsConnecting(false);
    }
  };

  return (
    <div className="max-w-[560px] mx-auto py-12 px-4 font-[var(--font-inter)] space-y-8">
      {/* ── Main Connect Card ── */}
      <div className="rounded-[24px] bg-card border border-border shadow-xs p-6 sm:p-8 space-y-6">
        {/* Large Icon Tile + Title + Subtitle */}
        <div className="text-center space-y-2">
          <div className="size-14 rounded-2xl bg-muted/80 text-foreground flex items-center justify-center mx-auto shadow-2xs">
            <GitBranch className="size-7" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Connect your repo
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            See branches, pull requests and judge-readiness checks in one place. We read branch names,
            pull request status, commit info, the README and file names. We never read your code and never write to your repo.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex justify-center">
          <SegmentedControl>
            <SegmentedControlItem
              active={tab === 'paste'}
              onClick={() => {
                setTab('paste');
                setErrorMessage('');
              }}
              className="cursor-pointer text-xs"
            >
              Paste repo
            </SegmentedControlItem>
            <SegmentedControlItem
              active={tab === 'oauth'}
              onClick={() => {
                setTab('oauth');
                setErrorMessage('');
              }}
              className="cursor-pointer text-xs"
            >
              Sign in with GitHub
            </SegmentedControlItem>
          </SegmentedControl>
        </div>

        {/* ── Option A: Paste Repo ── */}
        {tab === 'paste' ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Repository path or URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="owner/repo or https://github.com/owner/repo"
                  value={repoInput}
                  disabled={isConnecting}
                  onChange={(e) => setRepoInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  className="flex-1 h-10 px-3 rounded-lg border border-border bg-surface text-xs font-mono text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  onClick={() => handleConnect()}
                  disabled={isConnecting}
                  className="h-10 px-4 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 cursor-pointer text-xs font-medium"
                >
                  {isConnecting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <span>Connect</span>
                  )}
                </Button>
              </div>
            </div>

            {/* Connecting progress state */}
            {isConnecting && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs text-foreground flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>{steps[stepIndex]}</span>
              </div>
            )}

            {/* Error message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{errorMessage}</p>
                  <p className="mt-0.5">
                    For private repositories, use{' '}
                    <button
                      type="button"
                      onClick={() => setTab('oauth')}
                      className="underline font-bold hover:text-rose-900"
                    >
                      Sign in with GitHub
                    </button>
                    .
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── Option B: Sign in with GitHub ── */
          <div className="space-y-4 text-center">
            <Button
              onClick={() => handleConnect('octocat/Hello-World')}
              disabled={isConnecting}
              className="w-full h-10 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 gap-2 cursor-pointer text-xs font-medium"
            >
              <GitBranch className="size-4" />
              <span>Continue with GitHub OAuth</span>
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Read-only access to repositories you choose
            </p>

            {/* Sample Repos to Pick */}
            <div className="pt-2 text-left border-t border-border/50 space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Or pick a demo repository
              </span>
              {sampleRepos.map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={isConnecting}
                  onClick={() => handleConnect(r)}
                  className="w-full p-2 rounded-lg hover:bg-muted/50 border border-border/40 text-left font-mono text-xs text-foreground flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>{r}</span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 3-Item Preview Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
        <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-2.5">
          <GitBranch className="size-4 text-primary shrink-0" />
          <span className="font-medium text-foreground">Branch map with purposes</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-2.5">
          <Pin className="size-4 text-blue-600 shrink-0" />
          <span className="font-medium text-foreground">Demo freeze checkpoint</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-2.5">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
          <span className="font-medium text-foreground">Judge-readiness checks</span>
        </div>
      </div>
    </div>
  );
}
