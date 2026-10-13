/**
 * S29 Notifications — API types
 * Source: PRD Phase 6b §3.1, design.md §6 S29
 *
 * Filter mapping: type drives the four filter tabs.
 * 'other' appears only under 'All' (announcements etc).
 */

export type NotificationType = 'mention' | 'blocker' | 'system' | 'other';

export interface Notification {
  id: string;
  avatarInitials?: string;
  avatarUrl?: string;
  actorUsername?: string;
  actorName?: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
  roomId?: string;
  roomName?: string;
  link?: string;
  deepLink?: string;
  count?: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  /** Server-side last-synced ISO timestamp */
  lastSyncedAt: string;
}

export type NotificationFilter = 'all' | 'mention' | 'blocker' | 'system';
