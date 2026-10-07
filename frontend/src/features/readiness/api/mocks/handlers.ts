/**
 * S23 Readiness — MSW handlers
 * PRD 5b §6.1. Stand-in contract pending OQ-21.
 *
 * Scenario is selected via the `x-mock-scenario` request header.
 * Default scenario is used when no header is present.
 */
import { http, HttpResponse, delay } from 'msw';
import {
  readinessDefaultFixture,
  readinessFirstUseFixture,
  readinessValidationFailedFixture,
  readinessWeakSpotsManyFixture,
} from './fixtures';
import type { ValidateResult } from '../types';

export const readinessHandlers = [
  /** GET /api/v1/rooms/:roomId/readiness */
  http.get('/api/v1/rooms/:roomId/readiness', async ({ request }) => {
    const scenario = request.headers.get('x-mock-scenario') ?? 'default';

    if (scenario === 'slow') {
      await delay(3000);
    } else {
      await delay(500);
    }

    if (scenario === 'rings-error') {
      return new HttpResponse(null, { status: 500 });
    }

    const fixtures: Record<string, typeof readinessDefaultFixture> = {
      'default': readinessDefaultFixture,
      'first-use': readinessFirstUseFixture,
      'weak-spots-empty': { ...readinessDefaultFixture, weakSpots: [] },
      'weak-spots-many': readinessWeakSpotsManyFixture,
      'validation-failed': readinessValidationFailedFixture,
      'simulator-error': readinessDefaultFixture,
    };

    return HttpResponse.json(fixtures[scenario] ?? readinessDefaultFixture);
  }),

  /** POST /api/v1/rooms/:roomId/readiness/simulate/validate */
  http.post('/api/v1/rooms/:roomId/readiness/simulate/validate', async ({ request }) => {
    const scenario = request.headers.get('x-mock-scenario') ?? 'default';
    await delay(1200);

    if (scenario === 'simulator-error') {
      return new HttpResponse(null, { status: 500 });
    }

    if (scenario === 'validation-failed') {
      const result: ValidateResult = {
        success: false,
        missingItems: [
          'Judge reasoning for the Presentation score was not included',
          'At least one likely question must be listed',
        ],
        repairPrompt: 'Please add a short reasoning for Presentation and list 3 likely judge questions.',
      };
      return HttpResponse.json(result);
    }

    const result: ValidateResult = {
      success: true,
    };
    return HttpResponse.json(result);
  }),
];
