import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    'data-testid'?: string;
  };
  className?: string;
  'data-testid'?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  'data-testid': testId,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
      data-testid={testId}
    >
      <div className="size-8 rounded-full bg-active flex items-center justify-center mb-3">
        <Icon className="size-4 text-ink-2" strokeWidth={1.75} />
      </div>
      <h3 className="text-sm font-medium text-ink">{title}</h3>
      <p className="mt-1 text-[13px] leading-5 text-ink-2 max-w-sm">{description}</p>
      {action && (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={action.onClick}
            data-testid={action['data-testid']}
            className="h-8 px-3.5 rounded-[var(--r-control)] text-[13px] font-medium text-ink border-border hover:bg-hover bg-card"
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
