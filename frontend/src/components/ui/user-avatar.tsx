import React, { useState } from 'react';
import { getPresetAvatarUrl } from '@/features/onboarding/preset-avatars';
import { cn } from '@/lib/utils';

export interface UserLike {
  id?: string | null;
  userId?: string | null;
  name?: string | null;
  displayName?: string | null;
  username?: string | null;
  avatarType?: string | null;
  avatarPreset?: number | null;
  avatarUrl?: string | null;
  initials?: string | null;
  email?: string | null;
}

export interface UserAvatarProps {
  user?: UserLike | null;
  size?: number | string;
  className?: string;
  alt?: string;
}

function computeInitials(user?: UserLike | null): string {
  if (!user) return '?';
  const name = (user.displayName || user.name || user.username || user.email || '').trim();
  if (!name) return '?';
  const clean = name.replace(/^@/, '');
  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return clean.slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({
  user,
  size = 32,
  className,
  alt,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // 1. Resolve image source
  let resolvedSrc: string | null = null;
  if (!imgError && user) {
    if (user.avatarType === 'PRESET' && user.avatarPreset) {
      resolvedSrc = getPresetAvatarUrl(user.avatarPreset);
    } else if (user.avatarUrl) {
      resolvedSrc = user.avatarUrl;
    } else if (user.avatarPreset) {
      resolvedSrc = getPresetAvatarUrl(user.avatarPreset);
    }
  }

  const dim = typeof size === 'number' ? `${size}px` : size;
  const initials = computeInitials(user);
  const displayName = user?.displayName || user?.name || user?.username || 'User';

  if (resolvedSrc) {
    return (
      <div
        className={cn(
          'relative shrink-0 rounded-full overflow-hidden bg-[var(--active)] select-none border border-[var(--border)]',
          className
        )}
        style={{ width: dim, height: dim }}
        title={displayName}
      >
        <img
          src={resolvedSrc}
          alt={alt || displayName}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full flex items-center justify-center font-semibold select-none',
        'bg-[var(--active)] text-[var(--ink)] border border-[var(--border)] text-xs',
        className
      )}
      style={{
        width: dim,
        height: dim,
        fontSize: typeof size === 'number' ? Math.max(10, Math.floor(size * 0.38)) : undefined,
      }}
      title={displayName}
      aria-label={displayName}
    >
      {initials}
    </div>
  );
}
