import React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  name?: string;
}

/**
 * SegmentedControl with keyboard navigation (arrows/enter), smooth pill active state,
 * and high-contrast labels.
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  name,
}: SegmentedControlProps<T>) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (index + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (index - 1 + options.length) % options.length;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      const nextOption = options[nextIndex];
      if (!nextOption.disabled) {
        onChange(nextOption.value);
      }
    }
  };

  const sizeContainer = size === 'sm' ? 'p-0.5 text-xs' : 'p-1 text-sm';
  const sizeOption = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5';

  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn(
        'inline-flex items-center rounded-[8px] bg-zinc-100 p-1 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60',
        sizeContainer,
        className
      )}
    >
      {options.map((option, idx) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={option.disabled}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => !option.disabled && onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'relative inline-flex items-center justify-center gap-1.5 rounded-[6px] font-medium transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
              sizeOption,
              isSelected
                ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100 font-semibold'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            )}
          >
            {option.icon && <span className="h-3.5 w-3.5 shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
            {option.badge && <span className="ml-1 shrink-0">{option.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
