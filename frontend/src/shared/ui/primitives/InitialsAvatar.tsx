/**
 * Shared primitive: InitialsAvatar
 * Circle with initials. Sizes: 24px (xs), 32px (sm), 40px (md).
 */
import * as React from 'react';
import { cn } from 'cn';

interface InitialsAvatarProps {
  initials: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const sizeMap = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
};

export function InitialsAvatar({ initials, size = 'sm', className }: InitialsAvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-active flex items-center justify-center font-semibold text-ink shrink-0 select-none',
        sizeMap[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
