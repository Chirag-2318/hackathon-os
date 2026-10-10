import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

export function FilterSearch({
  value,
  onChange,
  placeholder = 'Search',
  className,
  'aria-label': ariaLabel = 'Search',
  'data-testid': testId,
}: FilterSearchProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search
        className="absolute left-3 size-4 text-ink-2 pointer-events-none shrink-0"
        strokeWidth={1.75}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        data-testid={testId}
        className={cn(
          'h-8 w-full rounded-full border border-border bg-card pl-9 pr-3',
          'text-[13px] text-ink placeholder:text-ink-2',
          'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
          'transition-colors duration-150'
        )}
      />
    </div>
  );
}
