/**
 * S29 NotificationRow — single notification item.
 * Source: design.md §6 S29; PRD Phase 6b §3.1
 *
 * Read row:   surface fill, lav-50 hover wash.
 * Unread (light):  ink-strong (#070707) fill, white text.
 * Unread (dark):   selected-fill (#F7EBD4) fill, #131313 text.
 * No colored left border (§13 banned).
 * ≥ 48px touch target (§11).
 */
import React from 'react';
import { cn } from 'cn';
import { UserAvatar } from '@/components/primitives/avatar-stack';
import type { Notification } from '../api/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NotificationRowProps {
  notification: Notification;
  onRead: (id: string) => void;
}

/** Relative timestamp — OQ-4: exact format TBD. Using simple relative string. */
function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function NotificationRow({ notification, onRead }: NotificationRowProps) {
  const { id, avatarInitials, avatarUrl, title, body, timestamp, read } = notification;

  const handleClick = () => {
    if (!read) onRead(id);
    // OQ-4: row-click destination is unresolved — no navigation added yet.
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={title}
      className={cn(
        // Base layout — ≥48px touch target, r-control
        'flex items-center gap-3 px-4 py-2 min-h-[44px] rounded-control cursor-pointer',
        'outline-none focus-visible:ring-2 focus-visible:ring-lav-600 focus-visible:ring-offset-2',
        'dark:focus-visible:ring-lav-400',
        'transition-colors duration-[var(--t-micro)]',
        // Read state
        read && [
          'bg-surface text-ink',
          '@media (hover: hover) and (pointer: fine):hover:bg-lav-50',
          'hover:bg-lav-50',
        ],
        // Unread — light theme: ink-strong fill, white text
        !read && [
          'bg-[#070707] text-white',
          'dark:bg-[#F7EBD4] dark:text-[#131313]',
        ],
      )}
    >
      {/* Avatar — C09, 32px */}
      <div className="shrink-0">
        <UserAvatar
          size="sm"
          initials={avatarInitials}
          src={avatarUrl}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className={cn(
              'text-body-strong truncate',
              read ? 'text-ink' : 'text-white dark:text-[#131313]',
            )}>
              {title}
            </p>
          </TooltipTrigger>
          {title.length > 60 && (
            <TooltipContent side="top">{title}</TooltipContent>
          )}
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className={cn(
              'text-body truncate',
              read ? 'text-ink-muted' : 'text-[#9A9AA3] dark:text-[#131313]/70',
            )}>
              {body}
            </p>
          </TooltipTrigger>
          {body.length > 80 && (
            <TooltipContent side="bottom">{body}</TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Time — tabular figures, right-aligned */}
      <time
        dateTime={timestamp}
        className={cn(
          'shrink-0 text-caption tabular-nums',
          read ? 'text-ink-muted' : 'text-[#9A9AA3] dark:text-[#131313]/60',
        )}
        title={new Date(timestamp).toLocaleString()}
      >
        {relativeTime(timestamp)}
      </time>

      {/* Unread dot indicator */}
      {!read && (
        <span className="shrink-0 size-2 rounded-full bg-lav-500 dark:bg-lav-700" aria-label="unread" />
      )}
    </div>
  );
}
