import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ErrorRowProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
  'data-testid'?: string;
}

export function ErrorRow({
  message = 'Failed to load data. Please check your connection and try again.',
  onRetry,
  className,
  'data-testid': testId,
}: ErrorRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-4 rounded-[var(--r-card)] border border-border bg-card',
        className
      )}
      data-testid={testId}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertCircle className="size-4 shrink-0 text-danger" strokeWidth={1.75} />
        <span className="text-sm text-danger truncate">{message}</span>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="h-8 px-3 rounded-[var(--r-control)] border-border bg-card text-ink text-[13px] font-medium hover:bg-hover shrink-0"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
