import React from 'react';
import { cn } from '@/lib/utils';
import type { UserLike } from './user-avatar';

export interface UserNameProps {
  user?: UserLike | null;
  showDisplayName?: boolean;
  className?: string;
  secondaryClassName?: string;
  fallback?: string;
}

export function UserName({
  user,
  showDisplayName = false,
  className,
  secondaryClassName,
  fallback = 'User',
}: UserNameProps) {
  if (!user) {
    return <span className={cn('truncate', className)}>{fallback}</span>;
  }

  const handle = user.username ? `@${user.username}` : null;
  const displayName = user.displayName || user.name || null;

  if (handle && showDisplayName && displayName && displayName !== user.username) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 min-w-0 truncate', className)}>
        <span className="font-medium text-[var(--ink)] truncate">{handle}</span>
        <span className={cn('text-xs text-[var(--ink-2)] truncate font-normal', secondaryClassName)}>
          ({displayName})
        </span>
      </span>
    );
  }

  if (handle) {
    return <span className={cn('font-medium text-[var(--ink)] truncate', className)}>{handle}</span>;
  }

  return (
    <span className={cn('text-[var(--ink)] truncate', className)}>
      {displayName || user.email || fallback}
    </span>
  );
}
