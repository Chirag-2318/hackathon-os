import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface AttentionItemData {
  id: string;
  dotColor: 'red' | 'amber' | 'blue';
  sentence: string;
  actionText: string;
  href: string;
}

export interface OverviewNeedsAttentionProps {
  items: AttentionItemData[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function OverviewNeedsAttention({
  items,
  isLoading,
  isError,
  onRetry,
}: OverviewNeedsAttentionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[22px] font-normal text-foreground tracking-tight">
          Needs attention
        </h2>
        {items.length > 0 && (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {items.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 py-2">
          <div className="h-4 bg-muted/40 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-muted/30 rounded w-1/2 animate-pulse" />
        </div>
      ) : isError ? (
        <div className="flex items-center justify-between py-2 text-xs text-muted-foreground">
          <span>Failed to load attention items.</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-foreground hover:underline font-medium cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground font-normal py-1">
          Nothing needs you right now.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between gap-4 text-sm group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    'size-2 rounded-full shrink-0',
                    item.dotColor === 'red' && 'bg-danger',
                    item.dotColor === 'amber' && 'bg-accent',
                    item.dotColor === 'blue' && 'bg-info'
                  )}
                />
                <span className="truncate text-foreground font-normal">
                  {item.sentence}
                </span>
              </div>
              <Link
                to={item.href}
                className="text-xs font-medium text-foreground hover:underline shrink-0 whitespace-nowrap min-h-[44px] flex items-center cursor-pointer"
              >
                {item.actionText}
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
