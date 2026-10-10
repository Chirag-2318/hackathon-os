import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: FilterSelectOption[];
  placeholder?: string;
  className?: string;
  'data-testid'?: string;
}

export function FilterSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  'data-testid': testId,
}: FilterSelectProps) {
  const isFiltered = value !== '' && value !== 'all' && value !== 'any';

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        data-testid={testId}
        className={cn(
          'h-8 w-auto min-w-[120px] rounded-full px-3 bg-card',
          'text-[13px] font-normal text-ink',
          'transition-colors duration-150',
          isFiltered ? 'border-ink text-ink font-medium' : 'border-border text-ink',
          'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-card border border-border shadow-none">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="text-[13px] cursor-pointer text-ink hover:bg-hover focus:bg-hover"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
