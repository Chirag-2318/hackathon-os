import React, { useState } from 'react';
import {
  AlertCircle, AlertTriangle, ShieldAlert, GitPullRequest, FileText, CheckCircle2,
  X, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import { InlineHighlight } from '@/features/home/components/HomeDesignSystem';
import type { AttentionItem } from '@/services/types';

interface NeedsAttentionCardProps {
  items: AttentionItem[];
  onActionClick: (item: AttentionItem) => void;
  onDismiss: (itemId: string) => void;
}

export function NeedsAttentionCard({
  items,
  onActionClick,
  onDismiss,
}: NeedsAttentionCardProps) {
  const [showAll, setShowAll] = useState(false);

  const displayedItems = showAll ? items : items.slice(0, 4);

  const renderIcon = (severity: AttentionItem['severity']) => {
    switch (severity) {
      case 'rule':
      case 'conflict':
      case 'secret':
        return (
          <div className="size-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle className="size-4" />
          </div>
        );
      case 'demo':
      case 'drift':
        return (
          <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="size-4" />
          </div>
        );
      case 'health':
        return (
          <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-4" />
          </div>
        );
      default:
        return (
          <div className="size-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <FileText className="size-4" />
          </div>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border shadow-xs overflow-hidden font-[var(--font-inter)] flex flex-col">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 min-h-[48px]">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold text-foreground">Needs attention</h3>
          <span className="h-5 px-2 rounded-full bg-muted text-[11px] font-bold text-muted-foreground tabular-nums flex items-center justify-center">
            {items.length}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="divide-y divide-border/40">
        {items.length === 0 ? (
          <div className="py-8 px-5 flex items-center gap-3">
            <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Nothing needs attention</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All branch PRs, health items and demo rules are in order.
              </p>
            </div>
          </div>
        ) : (
          displayedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-2.5 min-h-[52px] hover:bg-muted/30 transition-colors group relative"
            >
              {renderIcon(item.severity)}

              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-medium text-foreground truncate leading-tight">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                  {item.helper}
                </p>
              </div>

              {/* Action Link + Dismiss X */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onActionClick(item)}
                  className="cursor-pointer text-xs"
                >
                  <InlineHighlight>{item.actionLabel}</InlineHighlight>
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(item.id)}
                  className="size-5 rounded text-muted-foreground/40 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  title="Dismiss item"
                  aria-label="Dismiss"
                >
                  <X className="size-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Expander Footer (if > 4 items) ── */}
      {items.length > 4 && (
        <div className="border-t border-border/60 p-2 text-center bg-muted/10">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{showAll ? 'Show fewer' : `View all ${items.length} items`}</span>
            {showAll ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        </div>
      )}
    </div>
  );
}
