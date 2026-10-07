/**
 * S24 Retro & Portfolio — MSW handlers
 * PRD 5b §6.2. Stand-in contract pending OQ-21.
 *
 * Scenario is selected via the `x-mock-scenario` request header.
 */
import { http, HttpResponse, delay } from 'msw';
import {
  retroDefaultFixture,
  retroFirstOpenFixture,
  retroFirstUseEmptyFixture,
  retroContinueChosenFixture,
  retroArchiveChosenFixture,
  retroNoAwardsFixture,
  retroLongTextFixture,
  retroHostileTextFixture,
} from './fixtures';

export const retroHandlers = [
  /** GET /api/v1/rooms/:roomId/retro */
  http.get('/api/v1/rooms/:roomId/retro', async ({ request }) => {
    const scenario = request.headers.get('x-mock-scenario') ?? 'default';

    if (scenario === 'slow') await delay(3000);
    else await delay(500);

    if (scenario === 'chart-error') {
      // Return data without phaseTime to simulate a chart error
      const { phaseTime: _, ...rest } = retroDefaultFixture;
      return HttpResponse.json({ ...rest, phaseTime: null });
    }

    const fixtures: Record<string, typeof retroDefaultFixture> = {
      'default':             retroDefaultFixture,
      'first-open':          retroFirstOpenFixture,
      'first-use-empty':     retroFirstUseEmptyFixture,
      'returning':           { ...retroDefaultFixture, decision: null },
      'continue-chosen':     retroContinueChosenFixture,
      'archive-chosen':      retroArchiveChosenFixture,
      'no-awards':           retroNoAwardsFixture,
      'long-text':           retroLongTextFixture,
      'hostile-text':        retroHostileTextFixture,
    };

    return HttpResponse.json(fixtures[scenario] ?? retroDefaultFixture);
  }),

  /** PATCH /api/v1/rooms/:roomId/retro */
  http.patch('/api/v1/rooms/:roomId/retro', async ({ request }) => {
    const scenario = request.headers.get('x-mock-scenario') ?? 'default';
    await delay(400);

    if (scenario === 'save-error') {
      return new HttpResponse(null, { status: 500 });
    }

    return HttpResponse.json({ success: true });
  }),
];
