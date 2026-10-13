import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

import { SpotIllustration, type SpotIllustrationType } from './spot-illustrations';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
}

export interface EmptyStateProps {
  /** Optional spot illustration type ('rocket', 'clipboard', 'checklist', 'plug', 'magnifier', 'flag', 'bolt') */
  illustration?: SpotIllustrationType;
  /** Optional custom graphic or SVG node */
  icon?: React.ReactNode;
  /** Primary headline */
  headline: string;
  /** Explanatory subtext */
  subtext?: string;
  /** Primary call to action */
  primaryAction?: EmptyStateAction;
  /** Secondary action */
  secondaryAction?: EmptyStateAction;
  /** Compact mode for small cards or sidebars */
  compact?: boolean;
  className?: string;
}

/**
 * EmptyState component with subtle geometric SVG illustration, headline,
 * subtext, and clear call-to-actions.
 */
export function EmptyState({
  illustration,
  icon,
  headline,
  subtext,
  primaryAction,
  secondaryAction,
  compact = false,
  className,
}: EmptyStateProps) {
  const defaultIllustration = (
    <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-400">
      <svg
        className="w-6 h-6 stroke-current"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    </div>
  );

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-[10px] border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
        compact ? 'p-4 gap-2' : 'p-8 gap-3',
        className
      )}
    >
      <div className="shrink-0">
        {illustration ? (
          <SpotIllustration name={illustration} size={compact ? 36 : 48} />
        ) : (
          icon || defaultIllustration
        )}
      </div>
      <div className="max-w-sm space-y-1">
        <h3
          className={cn(
            'font-medium text-zinc-900 dark:text-zinc-100',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {headline}
        </h3>
        {subtext && (
          <p
            className={cn(
              'text-zinc-500 dark:text-zinc-400',
              compact ? 'text-[11px]' : 'text-xs leading-relaxed'
            )}
          >
            {subtext}
          </p>
        )}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-2 mt-1">
          {primaryAction && (
            <Button
              size={compact ? 'sm' : 'md'}
              variant={primaryAction.variant || 'primary'}
              onClick={primaryAction.onClick}
              leftIcon={primaryAction.icon}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              size={compact ? 'sm' : 'md'}
              variant={secondaryAction.variant || 'secondary'}
              onClick={secondaryAction.onClick}
              leftIcon={secondaryAction.icon}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
