import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BellIcon } from '@/components/icons';
import { AlertTriangle, AtSign, Clock, MessageSquare, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification, NotificationsResponse } from '@/features/notifications/api/types';
import {
  fetchNotifications as fetchRoomNotifications,
  markRead as markNotificationRead,
  markAllRead as markAllNotificationsRead,
} from '@/features/notifications/api/notifications-api';

interface NotificationsPopoverProps {
  currentRoomId?: string;
  roomList?: { id: string; title: string }[];
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationsPopover({ currentRoomId, roomList = [] }: NotificationsPopoverProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activeRoomId = currentRoomId || roomList[0]?.id || 'r-1';

  // Fetch notifications for the active room (refetches every 60s)
  const { data: notifData, refetch } = useQuery({
    queryKey: ['notifications', activeRoomId],
    queryFn: () => fetchRoomNotifications(activeRoomId),
    refetchInterval: 60000,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (notifId: string) => markNotificationRead(activeRoomId, notifId),
    onSuccess: (_data, notifId) => {
      queryClient.setQueryData<NotificationsResponse>(['notifications', activeRoomId], (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n) => (n.id === notifId ? { ...n, read: true } : n)),
        };
      });
    },
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: () => markAllNotificationsRead(activeRoomId),
    onSuccess: () => {
      queryClient.setQueryData<NotificationsResponse>(['notifications', activeRoomId], (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.map((n) => ({ ...n, read: true })),
        };
      });
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) refetch();
  };

  const allNotifications = notifData?.notifications ?? [];
  const unreadCount = allNotifications.filter((n) => !n.read).length;

  const filteredNotifications =
    filter === 'unread' ? allNotifications.filter((n) => !n.read) : allNotifications;

  const handleRowClick = (item: Notification) => {
    if (!item.read) {
      markRead(item.id);
    }
    setOpen(false);

    // Target navigation based on notification content
    if (item.type === 'blocker') {
      navigate(`/app/room/${activeRoomId}/board`);
    } else if (item.type === 'system') {
      navigate(`/app/room/${activeRoomId}/overview`);
    } else {
      navigate(`/app/room/${activeRoomId}/overview`);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'group relative flex items-center justify-center size-9 rounded-full',
            'text-ink-2 hover:bg-hover hover:text-ink',
            'transition-colors duration-150 cursor-pointer',
            'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2'
          )}
          aria-label="Notifications"
          data-testid="header-bell-trigger"
        >
          <BellIcon size={18} />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5',
                'flex items-center justify-center',
                'min-w-4 h-4 px-1 rounded-full',
                'bg-danger text-white text-[10px] font-semibold tabular-nums',
                'ring-2 ring-surface'
              )}
              aria-label={`${unreadCount} notifications`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 rounded-[20px] bg-card border border-border shadow-xl font-[var(--font-inter)] overflow-hidden z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-ink">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold tabular-nums">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}

            {/* Compact Segmented Control */}
            <div className="flex items-center p-0.5 rounded-lg bg-surface border border-border text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={cn(
                  'px-2 py-0.5 rounded-md transition-all cursor-pointer',
                  filter === 'all' ? 'bg-card text-ink font-semibold shadow-2xs' : 'text-ink-2 hover:text-ink'
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={cn(
                  'px-2 py-0.5 rounded-md transition-all cursor-pointer',
                  filter === 'unread' ? 'bg-card text-ink font-semibold shadow-2xs' : 'text-ink-2 hover:text-ink'
                )}
              >
                Unread
              </button>
            </div>
          </div>
        </div>

        {/* Room Header Label */}
        <div className="px-4 py-1.5 bg-surface/80 border-b border-border/50">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            {roomList.find((r) => r.id === activeRoomId)?.title ?? 'Active Room'}
          </span>
        </div>

        {/* Notifications list */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-border/50">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center gap-2">
              <div className="size-10 rounded-full bg-surface border border-border flex items-center justify-center text-ink-3">
                <Check className="size-5 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-ink">You're all caught up</p>
              <p className="text-xs text-ink-2">No unread notifications at the moment.</p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              // Icon tile color mapping:
              // amber = deadline / system, blue = mention, red = blocker, gray = other
              let tileClass = 'bg-gray-100 text-gray-700';
              let IconComp = MessageSquare;

              if (item.type === 'mention') {
                tileClass = 'bg-blue-100 text-blue-700';
                IconComp = AtSign;
              } else if (item.type === 'blocker') {
                tileClass = 'bg-red-100 text-red-700';
                IconComp = AlertTriangle;
              } else if (item.type === 'system') {
                tileClass = 'bg-amber-100 text-amber-800';
                IconComp = Clock;
              }

              return (
                <div
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className={cn(
                    'group relative flex items-start h-[56px] px-4 py-2 gap-3 hover:bg-hover transition-colors cursor-pointer',
                    !item.read ? 'bg-blue-50/20' : 'bg-card'
                  )}
                >
                  {/* Blue unread dot at far left */}
                  {!item.read && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-blue-600" />
                  )}

                  {/* Icon Tile (32px) */}
                  <div className={cn('size-8 rounded-xl shrink-0 flex items-center justify-center text-xs', tileClass)}>
                    <IconComp className="size-4" />
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[13px] font-medium text-ink truncate group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </p>
                      <span className="text-[11px] text-ink-3 shrink-0 tabular-nums">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-[12px] text-ink-2 truncate leading-tight mt-0.5">
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
