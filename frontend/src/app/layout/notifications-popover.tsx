import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { BellIcon } from '@/components/icons';
import { Settings, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';
import { getRoomCover } from '@/shared/utils/room-cover';
import { useSyncTabTitleUnread } from '@/shared/hooks/use-unread-title';
import { playSound } from '@/shared/sound/sound-effects';
import type { Notification } from '@/features/notifications/api/types';
import {
  useUserNotifications,
  useUnreadCount,
  useMarkAllUserNotificationsRead,
  useMarkNotificationRead,
} from '@/features/notifications/api/notifications-api';

interface NotificationsPopoverProps {
  currentRoomId?: string;
  roomList?: { id: string; title: string }[];
}

function formatRelativeTime(isoString: string): string {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch {
    return 'recently';
  }
}

export function NotificationsPopover({ currentRoomId, roomList = [] }: NotificationsPopoverProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread');
  const navigate = useNavigate();

  const { data: allNotifications = [], refetch } = useUserNotifications();
  const { data: unreadCountServer = 0 } = useUnreadCount();
  const { mutate: markAllRead } = useMarkAllUserNotificationsRead();
  const { mutate: markSingleRead } = useMarkNotificationRead();

  const localUnreadCount = allNotifications.filter((n) => !n.read).length;
  const unreadCount = Math.max(unreadCountServer, localUnreadCount);

  // Sync tab title: e.g. "(3) [brackit]"
  useSyncTabTitleUnread(unreadCount);

  const prevCount = useRef(unreadCount);
  useEffect(() => {
    if (unreadCount > prevCount.current && prevCount.current !== 0) {
      playSound('notification');
    }
    prevCount.current = unreadCount;
  }, [unreadCount]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) refetch();
  };

  const displayedList = useMemo(() => {
    if (activeTab === 'unread') {
      return allNotifications.filter((n) => !n.read);
    }
    return allNotifications;
  }, [allNotifications, activeTab]);

  // Group notifications by room
  const groupedByRoom = useMemo(() => {
    const map = new Map<string, { roomName: string; items: Notification[] }>();

    for (const item of displayedList) {
      const rId = item.roomId || 'general';
      const rName =
        item.roomName ||
        roomList.find((r) => r.id === rId)?.title ||
        (rId === 'general' ? 'General' : 'Hackathon Room');

      if (!map.has(rId)) {
        map.set(rId, { roomName: rName, items: [] });
      }
      map.get(rId)!.items.push(item);
    }

    return Array.from(map.entries()).map(([roomId, data]) => ({
      roomId,
      roomName: data.roomName,
      items: data.items,
    }));
  }, [displayedList, roomList]);

  const handleItemClick = (item: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.read) {
      markSingleRead(item.id);
    }
    setOpen(false);

    const targetUrl = item.deepLink || item.link;
    if (targetUrl) {
      navigate(targetUrl);
    } else if (item.roomId) {
      navigate(`/app/room/${item.roomId}/overview`);
    } else {
      navigate('/app/notifications');
    }
  };

  const handleMarkItemRead = (item: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    markSingleRead(item.id);
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
                'bg-danger text-on-danger text-[10px] font-semibold tabular-nums font-mono',
                'ring-2 ring-surface animate-in zoom-in-75'
              )}
              aria-label={`${unreadCount} notifications`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 rounded-[18px] bg-card border border-border shadow-xl font-[var(--font-inter)] overflow-hidden z-50 text-ink"
      >
        {/* Header with Title, Tab switcher, Mark All Read & Settings */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border bg-surface/60">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-ink">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-medium">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tabs: Unread / All */}
            <div className="flex items-center p-0.5 rounded-lg bg-surface border border-border text-[11px] font-medium mr-1">
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={cn(
                  'px-2 py-0.5 rounded-md transition-all cursor-pointer',
                  activeTab === 'unread'
                    ? 'bg-card text-ink font-semibold shadow-2xs'
                    : 'text-ink-2 hover:text-ink'
                )}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={cn(
                  'px-2 py-0.5 rounded-md transition-all cursor-pointer',
                  activeTab === 'all'
                    ? 'bg-card text-ink font-semibold shadow-2xs'
                    : 'text-ink-2 hover:text-ink'
                )}
              >
                All
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                title="Mark all as read"
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 p-1 rounded hover:bg-hover transition-colors cursor-pointer"
              >
                <CheckCheck className="size-3.5" />
              </button>
            )}

            <Link
              to="/app/settings/notifications"
              onClick={() => setOpen(false)}
              className="text-ink-3 hover:text-ink p-1 rounded hover:bg-hover transition-colors cursor-pointer"
              title="Notification settings"
            >
              <Settings className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Grouped Notifications List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40 panel-scroll">
          {groupedByRoom.length === 0 ? (
            /* Empty state: animated checkmark */
            <div className="flex flex-col items-center justify-center p-8 text-center gap-2.5">
              <div className="size-11 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Check className="size-5 stroke-[2.5] animate-in zoom-in-50 duration-300" />
              </div>
              <p className="text-[13px] font-medium text-ink">Nothing new. Go build something.</p>
              <p className="text-[11px] text-ink-3 max-w-[220px]">
                You are all caught up across your hackathons and teams.
              </p>
            </div>
          ) : (
            groupedByRoom.map((group) => {
              const cover = getRoomCover(group.roomId);
              return (
                <div key={group.roomId} className="bg-card">
                  {/* Room group header with small room cover tile */}
                  <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-surface/90 backdrop-blur-xs border-b border-border/40 text-[11px] font-medium text-ink-2">
                    <div
                      className="size-3.5 rounded-sm shrink-0 border border-black/10"
                      style={{ background: cover.gradient }}
                    />
                    <span className="truncate flex-1 font-semibold text-ink-2">{group.roomName}</span>
                    <span className="text-[10px] text-ink-3 font-mono">{group.items.length}</span>
                  </div>

                  {/* Items in room */}
                  <div className="divide-y divide-border/20">
                    {group.items.map((item) => {
                      const actor = {
                        username: item.actorUsername || 'system',
                        name: item.actorName || item.actorUsername || 'Teammate',
                        avatarUrl: item.avatarUrl,
                      };

                      return (
                        <div
                          key={item.id}
                          onClick={(e) => handleItemClick(item, e)}
                          className={cn(
                            'group relative flex items-start gap-2.5 px-3 py-2 hover:bg-hover transition-colors cursor-pointer text-left',
                            !item.read ? 'bg-blue-50/20 dark:bg-blue-950/20' : 'bg-card'
                          )}
                        >
                          {/* Left: unread dot */}
                          <div className="pt-1 w-2 shrink-0 flex justify-center">
                            {!item.read ? (
                              <span className="size-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                            ) : (
                              <span className="size-1.5" />
                            )}
                          </div>

                          {/* Actor UserAvatar */}
                          <div className="shrink-0 mt-0.5">
                            <UserAvatar user={actor} size={24} />
                          </div>

                          {/* Message and entity text */}
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-1.5 text-[12px] leading-snug">
                              <span className="font-medium text-ink truncate">
                                {item.title || item.body}
                              </span>
                              {item.count && item.count > 1 && (
                                <span className="px-1 py-0.2 rounded text-[10px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                                  x{item.count}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-ink-3 font-mono">
                                {formatRelativeTime(item.timestamp)}
                              </span>
                              {item.body && item.title && (
                                <span className="text-[11px] text-ink-2 truncate">
                                  {item.body}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hover action: Mark read */}
                          {!item.read && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkItemRead(item, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[10px] text-ink-3 hover:text-blue-600 rounded hover:bg-card shrink-0"
                              title="Mark read"
                            >
                              <Check className="size-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: link to full page */}
        <div className="px-3 py-2 border-t border-border bg-surface/40 flex items-center justify-between text-[11px]">
          <Link
            to="/app/notifications"
            onClick={() => setOpen(false)}
            className="text-ink-2 hover:text-ink font-medium transition-colors"
          >
            Open full notifications →
          </Link>
          <span className="text-[10px] text-ink-3 font-mono">
            {displayedList.length} items
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
