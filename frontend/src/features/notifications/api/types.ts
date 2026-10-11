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
  /** Initials for avatar fallback (C09 §2.8 pastel) */
  avatarInitials?: string;
  avatarUrl?: string;
  title: string;
  /** Single-line truncated body */
  body: string;
  /** ISO-8601 timestamp */
  timestamp: string;
  read: boolean;
  type: NotificationType;
  roomId?: string;
  roomName?: string;
  link?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  /** Server-side last-synced ISO timestamp */
  lastSyncedAt: string;
}

export type NotificationFilter = 'all' | 'mention' | 'blocker' | 'system';
