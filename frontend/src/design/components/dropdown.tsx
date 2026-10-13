import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';

export interface DropdownItemConfig {
  id?: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  separatorBefore?: boolean;
}

export interface SimpleDropdownProps {
  trigger: React.ReactNode;
  items: DropdownItemConfig[];
  align?: 'start' | 'center' | 'end';
}

/**
 * Dropdown Menu component with keyboard navigation, items configuration,
 * and standard Radix primitives export.
 */
export function Dropdown({
  trigger,
  items,
  align = 'end',
}: SimpleDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-44 p-1 rounded-[8px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md">
        {items.map((item, idx) => (
          <React.Fragment key={item.id || idx}>
            {item.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem
              disabled={item.disabled}
              onClick={item.onClick}
              className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-[6px] cursor-pointer outline-none select-none transition-colors ${
                item.danger
                  ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
};
