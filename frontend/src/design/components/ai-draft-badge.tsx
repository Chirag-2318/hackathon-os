import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { Chip } from './chip';
import { Tooltip } from './tooltip';
import { cn } from '@/lib/utils';

export interface AiDraftBadgeProps {
  /** Optional callback when user accepts the AI draft */
  onAccept?: () => void;
  className?: string;
}

/**
 * AI draft badge displayed on AI-generated content until accepted or edited.
 * Reinforces that AI assists and the team owns the work.
 */
export function AiDraftBadge({ onAccept, className }: AiDraftBadgeProps) {
  return (
    <Tooltip content="Drafted by [brackit] AI. Review, customize, and save to make it yours.">
      <span className={cn('inline-flex items-center gap-1.5 select-none', className)}>
        <Chip
          variant="brand"
          size="sm"
          icon={<Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />}
          className="border-indigo-200 bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
        >
          AI draft
        </Chip>

        {onAccept && (
          <button
            type="button"
            onClick={onAccept}
            title="Accept draft"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded px-1.5 py-0.5 cursor-pointer transition-colors"
          >
            <Check className="w-3 h-3" />
            <span>Accept</span>
          </button>
        )}
      </span>
    </Tooltip>
  );
}
