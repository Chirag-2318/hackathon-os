import React, { useState, useEffect } from 'react';
import type { DemoAsset } from '../api/pitch-kit-api';
import { toast } from 'sonner';

interface DemoProofOfWorkProps {
  assets: DemoAsset[];
  onSaveLink: (kind: string, url: string, title?: string) => Promise<void>;
  onCheckLink: (assetId: string) => Promise<void>;
  onRemoveAsset: (assetId: string) => Promise<void>;
}

interface RowConfig {
  kind: 'FULL_RECORDING' | 'BACKUP_RECORDING' | 'LIVE_LINK';
  requirement: string;
  placeholder: string;
}

const ROWS: RowConfig[] = [
  {
    kind: 'FULL_RECORDING',
    requirement: 'Full screen recording of the whole demo',
    placeholder: 'https://youtube.com/watch?v=... or loom.com/share/...',
  },
  {
    kind: 'BACKUP_RECORDING',
    requirement: 'Backup recording, about 60 seconds',
    placeholder: 'https://loom.com/share/... or drive.google.com/...',
  },
  {
    kind: 'LIVE_LINK',
    requirement: 'Live link a judge can open',
    placeholder: 'https://your-project.vercel.app',
  },
];

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return 'checked just now';
    const min = Math.floor(diffSec / 60);
    if (min < 60) return `checked ${min}m ago`;
    const h = Math.floor(min / 60);
    if (h < 24) return `checked ${h}h ago`;
    const d = Math.floor(h / 24);
    return `checked ${d}d ago`;
  } catch {
    return '';
  }
}

function statusColor(status: string) {
  switch (status) {
    case 'REACHABLE':
      return 'text-emerald-600 dark:text-emerald-400 font-medium';
    case 'CHECKING':
      return 'text-amber-600 dark:text-amber-400 font-medium animate-pulse';
    case 'NEEDS_LOGIN':
      return 'text-amber-600 dark:text-amber-400 font-medium';
    case 'NOT_FOUND':
    case 'UNREACHABLE':
      return 'text-destructive font-medium';
    default:
      return 'text-muted-foreground';
  }
}

function statusText(status: string) {
  switch (status) {
    case 'REACHABLE':
      return 'Reachable';
    case 'CHECKING':
      return 'Checking';
    case 'NEEDS_LOGIN':
      return 'Needs login';
    case 'NOT_FOUND':
      return 'Not found';
    case 'UNREACHABLE':
      return 'Unreachable';
    default:
      return 'Not added';
  }
}

export function DemoProofOfWork({
  assets,
  onSaveLink,
  onCheckLink,
  onRemoveAsset,
}: DemoProofOfWorkProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    assets.forEach((a) => {
      if (a.url) next[a.kind] = a.url;
    });
    setInputs(next);
  }, [assets]);

  const handleBlurOrSubmit = async (kind: string) => {
    const val = (inputs[kind] || '').trim();
    const existing = assets.find((a) => a.kind === kind);
    if (existing && existing.url === val) return;
    if (!existing && !val) return;

    if (kind === 'LIVE_LINK' && val) {
      const lower = val.toLowerCase();
      if (lower.includes('localhost') || lower.includes('127.0.0.1')) {
        setLocalErrors((prev) => ({ ...prev, [kind]: 'A localhost link will not work on stage.' }));
        return;
      }
    }
    setLocalErrors((prev) => ({ ...prev, [kind]: '' }));

    setSavingKey(kind);
    try {
      if (!val && existing) {
        await onRemoveAsset(existing.id);
      } else if (val) {
        await onSaveLink(kind, val);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update link');
    } finally {
      setSavingKey(null);
    }
  };

  const handleManualCheck = async (asset: DemoAsset) => {
    setCheckingId(asset.id);
    try {
      await onCheckLink(asset.id);
      toast.success('Link re-checked');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to check link');
    } finally {
      setCheckingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-2">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider font-mono">
          Proof of work
        </h2>
      </div>

      <div className="divide-y divide-border/60 space-y-5">
        {ROWS.map((row) => {
          const asset = assets.find((a) => a.kind === row.kind);
          const currentVal = inputs[row.kind] ?? asset?.url ?? '';
          const hasUrl = Boolean(asset?.url);
          const isChecking = checkingId === asset?.id || asset?.status === 'CHECKING';
          const errorMsg = localErrors[row.kind];

          return (
            <div key={row.kind} className="pt-4 first:pt-0 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <p className="text-sm font-normal text-foreground">
                  {row.requirement}
                </p>

                {hasUrl && asset && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground font-normal">{asset.provider}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className={statusColor(asset.status)}>
                      {statusText(asset.status)}
                    </span>
                    {asset.checkedAt && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
                          {formatTimeAgo(asset.checkedAt)}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={currentVal}
                  placeholder={row.placeholder}
                  onChange={(e) => {
                    const v = e.target.value;
                    setInputs((p) => ({ ...p, [row.kind]: v }));
                    if (localErrors[row.kind]) {
                      setLocalErrors((p) => ({ ...p, [row.kind]: '' }));
                    }
                  }}
                  onBlur={() => handleBlurOrSubmit(row.kind)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  disabled={savingKey === row.kind}
                  className="flex-1 text-xs font-mono px-3 py-2 border border-border/80 rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground/50 transition-colors"
                />

                {hasUrl && asset && (
                  <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono">
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-accent hover:underline"
                    >
                      Open ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => handleManualCheck(asset)}
                      disabled={isChecking}
                      className="px-2 py-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      {isChecking ? 'Checking...' : 'Re-check'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInputs((p) => ({ ...p, [row.kind]: '' }));
                        onRemoveAsset(asset.id);
                      }}
                      className="px-2 py-1 text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {errorMsg && (
                <p className="text-xs text-destructive font-normal mt-1">{errorMsg}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
