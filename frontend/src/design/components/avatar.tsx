import React from 'react';
import { UserAvatar, type UserAvatarProps, type UserLike } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';

export interface AvatarStackProps {
  users: (UserLike | null | undefined)[];
  max?: number;
  size?: number;
  className?: string;
}

/**
 * AvatarStack component showing grouped overlapping member avatars with +N counter.
 */
export function AvatarStack({
  users,
  max = 4,
  size = 28,
  className,
}: AvatarStackProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className={cn('flex items-center -space-x-2 overflow-hidden', className)}>
      {visible.map((user, idx) => (
        <div
          key={user?.id || user?.username || idx}
          className="ring-2 ring-white dark:ring-zinc-900 rounded-full inline-block"
        >
          <UserAvatar user={user} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          style={{ width: size, height: size }}
          className="inline-flex items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 font-mono text-[10px] font-semibold ring-2 ring-white dark:ring-zinc-900 shrink-0"
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

export { UserAvatar as Avatar };
export type { UserAvatarProps as AvatarProps, UserLike };
