import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import type { GithubCheck } from '@/services/githubService';
import { Button } from '@/components/ui/button';

interface GithubSubmissionChecksProps {
  checks: GithubCheck[];
  loading: boolean;
  onRefresh?: () => void;
  onActionClick?: (check: GithubCheck) => void;
}

export function GithubSubmissionChecks({
  checks,
  loading,
  onActionClick,
}: GithubSubmissionChecksProps) {
  const [showPassing, setShowPassing] = useState(false);

  if (loading) {
    return (
      <div className="p-5 rounded-xl border border-border bg-card space-y-3">
        <div className="h-5 w-40 bg-muted/40 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-10 bg-muted/20 rounded-lg animate-pulse" />
          <div className="h-10 bg-muted/20 rounded-lg animate-pulse" />
          <div className="h-10 bg-muted/20 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const passingChecks = checks.filter((c) => c.status === 'PASS');
  const actionChecks = checks.filter((c) => c.status !== 'PASS');
  const passCount = passingChecks.length;
  const totalCount = checks.length;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground">Before you submit</h2>
          <p className="text-xs text-muted-foreground">
            Checks that judges evaluate during repository inspection
          </p>
        </div>
        <span
          className={`font-mono text-xs px-2.5 py-1 rounded-full border font-medium ${
            passCount === totalCount && totalCount > 0
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-muted text-muted-foreground border-border/50'
          }`}
        >
          {passCount} OF {totalCount} PASS
        </span>
      </div>

      {/* Actionable items: Failures & Warnings */}
      <div className="divide-y divide-border/30">
        {actionChecks.map((check) => {
          const isFail = check.status === 'FAIL';
          const isWarn = check.status === 'WARN';

          return (
            <div
              key={check.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5 shrink-0">
                  {isFail ? (
                    <XCircle className="size-4 text-rose-500" />
                  ) : isWarn ? (
                    <AlertTriangle className="size-4 text-amber-500" />
                  ) : (
                    <Info className="size-4 text-blue-500" />
                  )}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{check.label}</span>
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                        isFail
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          : isWarn
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-muted text-muted-foreground border-border/40'
                      }`}
                    >
                      {check.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{check.detail}</p>
                </div>
              </div>

              {check.fixLabel && (
                <div className="shrink-0 pl-6 sm:pl-0">
                  {check.fixUrl ? (
                    <a
                      href={check.fixUrl}
                      target={check.fixUrl.startsWith('/') ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium px-2.5 py-1 rounded-lg border border-border/80 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <span>{check.fixLabel}</span>
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </a>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2.5 cursor-pointer"
                      onClick={() => onActionClick && onActionClick(check)}
                    >
                      {check.fixLabel}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Passing disclosure */}
      {passingChecks.length > 0 && (
        <div className="pt-2 border-t border-border/30">
          <button
            type="button"
            onClick={() => setShowPassing(!showPassing)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
          >
            {showPassing ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            <span>{passingChecks.length} passing checks</span>
          </button>

          {showPassing && (
            <div className="mt-3 divide-y divide-border/20 pl-2">
              {passingChecks.map((check) => (
                <div
                  key={check.id}
                  className="py-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span className="font-medium text-foreground truncate">{check.label}</span>
                    <span className="text-muted-foreground truncate hidden sm:inline">
                      — {check.detail}
                    </span>
                  </div>
                  {check.fixUrl && (
                    <a
                      href={check.fixUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
