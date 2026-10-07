import { cn } from 'cn';
import type { CharterPollOption } from '@/api/client';
import { ProgressRow } from '@/components/primitives/progress-row';

export interface CharterPollBarProps {
  title: string;
  options: CharterPollOption[];
  className?: string;
}

export function CharterPollBar({ title, options, className }: CharterPollBarProps) {
  return (
    <div className={cn("flex flex-col gap-3 min-w-0 w-full", className)}>
      <span className="text-label text-ink">{title}</span>
      
      <div className="flex flex-col gap-3 w-full min-w-0">
        {options.length > 0 ? (
          options.map((opt, i) => (
            <ProgressRow 
              key={i} 
              label={opt.label} 
              percent={opt.percent} 
              color={opt.color} 
            />
          ))
        ) : (
          <div className="h-8 w-full rounded-pill flex items-center justify-center text-caption text-ink-muted bg-surface-sunken">
            No votes yet
          </div>
        )}
      </div>
    </div>
  );
}
