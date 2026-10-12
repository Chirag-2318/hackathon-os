import React, { useState } from 'react';
import {
  Check, AlertTriangle, ExternalLink, RefreshCw, Edit3, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ui/progress-ring';
import type { HealthItem } from '@/services/types';

interface RepoHealthCardProps {
  health: HealthItem[];
  repoFullName: string;
  onRecheck: () => Promise<void>;
}

export function RepoHealthCard({
  health,
  repoFullName,
  onRecheck,
}: RepoHealthCardProps) {
  const [isRechecking, setIsRechecking] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState('');

  const safeHealth = health || [];
  const passedCount = safeHealth.filter((h) => h.status === 'pass').length;
  const totalCount = safeHealth.length;
  const progressPct = Math.round((passedCount / Math.max(1, totalCount)) * 100);

  // Failed rows sort to the top
  const sortedHealth = [...safeHealth].sort((a, b) => {
    if (a.status === 'fail' && b.status === 'pass') return -1;
    if (a.status === 'pass' && b.status === 'fail') return 1;
    return 0;
  });

  const handleRecheckClick = async () => {
    setIsRechecking(true);
    try {
      await onRecheck();
    } finally {
      setTimeout(() => setIsRechecking(false), 1000);
    }
  };

  return (
    <div
      data-testid="repo-health-card"
      className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden font-[var(--font-inter)] flex flex-col"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 min-h-[48px]">
        <h3 className="text-[15px] font-semibold text-foreground">Repo health</h3>

        <div className="flex items-center gap-2">
          <ProgressRing
            value={progressPct}
            size={24}
            strokeWidth={3}
            className="text-primary"
          />
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            {passedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* ── Rows ── */}
      <div className="divide-y divide-border/40">
        {sortedHealth.map((item) => {
          const isPass = item.status === 'pass';

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 px-4 py-2 min-h-[44px] hover:bg-muted/20 transition-colors text-xs"
            >
              {/* Left: Status Icon + Label + Required Chip */}
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                {/* 20px status icon */}
                {isPass ? (
                  <div className="size-5 rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center shrink-0 shadow-2xs">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                ) : (
                  <div
                    className={`size-5 rounded-full border flex items-center justify-center shrink-0 ${
                      item.required
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                        : 'border-border bg-muted/60 text-muted-foreground'
                    }`}
                  >
                    <AlertTriangle className="size-3" />
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-sm leading-tight ${
                        isPass
                          ? 'text-muted-foreground font-normal'
                          : 'text-foreground font-medium'
                      }`}
                    >
                      {item.label}
                    </span>

                    {item.required && (
                      <span className="h-4 px-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 text-[10px] font-bold tracking-wide uppercase inline-flex items-center">
                        Required
                      </span>
                    )}
                  </div>

                  {/* Secret scanned note */}
                  {item.id === 'gc-4' && (
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      {item.detail || 'Checked file names for .env files, keys and credentials'}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Detail or Action Button */}
              <div className="shrink-0 flex items-center gap-2">
                {/* Deployed link row detail */}
                {item.id === 'gc-6' ? (
                  <div className="flex items-center gap-1.5">
                    {editingUrl ? (
                      <input
                        type="text"
                        value={deployedUrl}
                        onChange={(e) => setDeployedUrl(e.target.value)}
                        onBlur={() => setEditingUrl(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingUrl(false)}
                        className="bg-surface border border-input rounded px-1.5 py-0.5 text-xs font-mono outline-none"
                      />
                    ) : (
                      <a
                        href={deployedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded transition-colors"
                      >
                        <span className="truncate max-w-[120px]">{deployedUrl}</span>
                        <ExternalLink className="size-2.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingUrl(!editingUrl)}
                      className="text-muted-foreground/60 hover:text-foreground p-0.5 cursor-pointer"
                      title="Edit deployed URL"
                    >
                      <Edit3 className="size-3" />
                    </button>
                  </div>
                ) : item.action && !isPass ? (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-7 px-2.5 text-xs font-medium cursor-pointer"
                  >
                    <a
                      href={item.action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1"
                    >
                      <span>{item.action.label}</span>
                      <ExternalLink className="size-2.5" />
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Card Footer: Re-check Button ── */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-border/60 text-xs bg-muted/5 min-h-[40px]">
        <span className="text-muted-foreground">Ties directly to Hackathon rubric</span>
        <button
          type="button"
          onClick={handleRecheckClick}
          disabled={isRechecking}
          className="text-xs font-medium text-foreground hover:text-primary inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`size-3 ${isRechecking ? 'animate-spin' : ''}`} />
          <span>{isRechecking ? 'Checking...' : 'Re-check'}</span>
        </button>
      </div>
    </div>
  );
}
