import React from 'react';
import {
  Popover as RadixPopover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface PopoverProps extends React.ComponentProps<typeof RadixPopover> {
  trigger?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

/**
 * Popover component with accessible trigger, portal rendering, and escape-key handling.
 */
export function Popover({
  trigger,
  children,
  contentClassName,
  align = 'center',
  sideOffset = 6,
  ...props
}: PopoverProps) {
  if (trigger) {
    return (
      <RadixPopover {...props}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align={align}
          sideOffset={sideOffset}
          className={cn('rounded-[10px] p-3 shadow-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900', contentClassName)}
        >
          {children}
        </PopoverContent>
      </RadixPopover>
    );
  }

  return <RadixPopover {...props}>{children}</RadixPopover>;
}

export { PopoverTrigger, PopoverContent, PopoverAnchor };
