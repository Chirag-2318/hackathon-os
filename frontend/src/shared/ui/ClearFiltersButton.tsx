import { cn } from '@/lib/utils';

export interface ClearFiltersButtonProps {
  active: boolean;
  onClick: () => void;
  className?: string;
  'data-testid'?: string;
}

export function ClearFiltersButton({
  active,
  onClick,
  className,
  'data-testid': testId,
}: ClearFiltersButtonProps) {
  if (!active) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'inline-flex items-center h-8 px-2.5 rounded-full text-[13px] font-medium text-ink-2 hover:text-ink',
        'hover:bg-hover transition-colors duration-150 cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
        className
      )}
    >
      Clear filters
    </button>
  );
}
