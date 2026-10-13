import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

/**
 * Toggle component with optional label and subtext description.
 */
export function Toggle({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  size = 'default',
  className,
}: ToggleProps) {
  if (label) {
    return (
      <label
        className={cn(
          'flex items-center justify-between gap-3 select-none cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div className="flex flex-col">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
          {description && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{description}</span>
          )}
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          size={size}
        />
      </label>
    );
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      size={size}
      className={className}
    />
  );
}
