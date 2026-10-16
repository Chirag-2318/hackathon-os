import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  /** Page title, rendered in display font (Instrument Serif) */
  title: React.ReactNode;
  /** Explanatory subtitle */
  subtitle?: React.ReactNode;
  /** Right-aligned action buttons or elements */
  actions?: React.ReactNode;
  /** Optional breadcrumb or status badge rendered above title */
  eyebrow?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader component adhering to typography hierarchy:
 * Instrument Serif for title, neutral UI sans for subtitle, right-aligned actions.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60',
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        {eyebrow && <div className="text-xs font-mono text-muted-foreground mb-1">{eyebrow}</div>}
        <h1 className="text-3xl sm:text-4xl font-display font-normal tracking-tight text-foreground truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground font-sans">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 sm:self-auto self-start">
          {actions}
        </div>
      )}
    </div>
  );
}
