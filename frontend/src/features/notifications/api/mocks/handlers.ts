/**
 * S29 Notifications — MSW handlers
 * Source: PRD Phase 6b §5, tech_stack.md §4.3 item 6
 */
import { http, HttpResponse, delay } from 'msw';
import { notificationsFixture, notificationsEmptyFixture } from './fixtures';

// In-memory read-state store (reset on page reload)
let notificationStore = { ...notificationsFixture, notifications: [...notificationsFixture.notifications] };

export const notificationsHandlers = [
  http.get('/api/v1/rooms/:roomId/notifications', async ({ request }) => {
    await delay(350);
    const scenario = request.headers.get('x-mock-scenario');
    if (scenario === 'empty') return HttpResponse.json(notificationsEmptyFixture);
    if (scenario === 'error') return new HttpResponse(null, { status: 500 });
    return HttpResponse.json(notificationStore);
  }),

  http.patch('/api/v1/rooms/:roomId/notifications/:notifId/read', async ({ params }) => {
    await delay(100);
    const n = notificationStore.notifications.find(n => n.id === params.notifId);
    if (!n) return new HttpResponse(null, { status: 404 });
    n.read = true;
    return HttpResponse.json({ id: n.id, read: true });
  }),

  http.post('/api/v1/rooms/:roomId/notifications/mark-all-read', async () => {
    await delay(150);
    notificationStore.notifications = notificationStore.notifications.map(n => ({ ...n, read: true }));
    return HttpResponse.json({ success: true });
  }),
];
