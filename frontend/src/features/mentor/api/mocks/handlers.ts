/**
 * S30 Mentor View — MSW handlers
 * Source: PRD Phase 6b §5
 */
import { http, HttpResponse, delay } from 'msw';
import { mentorContextFixture } from './fixtures';

export const mentorHandlers = [
  http.get('/api/v1/mentor/:token/context', async ({ request }) => {
    await delay(350);
    if (request.headers.get('x-mock-scenario') === 'error') {
      return new HttpResponse(null, { status: 500 });
    }
    return HttpResponse.json(mentorContextFixture);
  }),

  // OQ-7: submit/send is stubbed — mocked action only, no backend.
  http.post('/api/v1/mentor/:token/ask', async ({ request }) => {
    await delay(800);
    if (request.headers.get('x-mock-scenario') === 'error') {
      return new HttpResponse(null, { status: 500 });
    }
    return HttpResponse.json({ success: true, submittedAt: new Date().toISOString() });
  }),

  // OQ-18: join-code submit (403 page)
  http.post('/api/v1/rooms/join', async ({ request }) => {
    await delay(500);
    const body = await request.json() as { code?: string };
    if (!body.code || body.code.length < 4) {
      return HttpResponse.json({ success: false, error: 'Invalid code' }, { status: 400 });
    }
    return HttpResponse.json({ success: true, roomId: 'r-1' });
  }),
];
