/**
 * Shared primitive: SectionTitle
 * 16px / 600 section heading with optional count pill.
 */
import * as React from 'react';
import { cn } from 'cn';

interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  count?: number;
  className?: string;
  right?: React.ReactNode;
}

export function SectionTitle({ children, count, className, right, ...props }: SectionTitleProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)} {...props}>
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] leading-[20px] font-semibold tracking-[-0.005em] text-ink">{children}</h2>
        {count !== undefined && (
          <span className="inline-flex items-center rounded-full bg-active px-2 py-0.5 text-xs text-ink-2 tabular-nums">
            {count}
          </span>
        )}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
