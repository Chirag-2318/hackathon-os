/**
 * S29 Notifications — MSW fixtures
 * Source: design.md §8.2 seed data (Team Kaveri / MessMeter)
 *
 * Fields limited to what NotificationRow displays (§5 fixtures rule).
 * "John Doe" is banned (§13); all names from §8.2 seed roster.
 */
import type { NotificationsResponse } from '../types';

export const notificationsFixture: NotificationsResponse = {
  lastSyncedAt: new Date().toISOString(),
  notifications: [
    {
      id: 'n-1',
      avatarInitials: 'IR',
      title: 'Ishita Rao mentioned you',
      body: 'Can you review the manager dashboard Figma mock before we hand it off?',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
      read: false,
      type: 'mention',
    },
    {
      id: 'n-2',
      avatarInitials: 'KN',
      title: 'Kabir Nair reported a blocker',
      body: 'Attendance CSV importer is blocked — biometric API returning 401 on staging.',
      timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(), // 18 min ago
      read: false,
      type: 'blocker',
    },
    {
      id: 'n-3',
      avatarInitials: 'SY',
      title: 'Hackathon OS',
      body: 'Feature Freeze starts in 3 hours. Finalise your Board tasks before then.',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
      read: false,
      type: 'system',
    },
    {
      id: 'n-4',
      avatarInitials: 'AM',
      title: 'Aarav Mehta posted an announcement',
      body: 'Sleep shift A (01:00–06:00): Ishita, Kabir and Sanjay are off. Aarav and Priya holding the build.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
      read: true,
      type: 'other',
    },
    {
      id: 'n-5',
      avatarInitials: 'SG',
      title: 'Sanjay Gupta mentioned you',
      body: 'Forecast endpoint is merged to main. Please pull and verify the dashboard widget.',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3h ago
      read: true,
      type: 'mention',
    },
    {
      id: 'n-6',
      avatarInitials: 'PL',
      title: 'Priya Lal reported a blocker',
      body: "QA can't access staging \u2014 deployment pipeline failing on the GitHub Actions step.",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
      read: true,
      type: 'blocker',
    },
    {
      id: 'n-7',
      avatarInitials: 'SY',
      title: 'Hackathon OS',
      body: 'Checkpoint 4 (Plan) has been confirmed by all judges. Phase is now complete.',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h ago
      read: true,
      type: 'system',
    },
    {
      id: 'n-8',
      avatarInitials: 'RJ',
      title: 'Rahul Jain posted an announcement',
      body: 'Demo video is recorded and uploaded to /docs/DEMO_FALLBACK.mp4. Fallback is live.',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8h ago
      read: true,
      type: 'other',
    },
  ],
};

export const notificationsEmptyFixture: NotificationsResponse = {
  lastSyncedAt: new Date().toISOString(),
  notifications: [],
};
