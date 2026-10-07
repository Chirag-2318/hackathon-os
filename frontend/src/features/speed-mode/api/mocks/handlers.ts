/**
 * S31 Speed Mode — MSW handlers
 * Source: PRD Phase 6b §5
 */
import { http, HttpResponse, delay } from 'msw';
import {
  speedModeFixture,
  speedModeNoTaskFixture,
  speedModeNoBlockersFixture,
} from './fixtures';
import type { SpeedModeState } from '../types';

// In-memory store per room (reset on reload)
const stores: Record<string, SpeedModeState> = {};

function getStore(roomId: string): SpeedModeState {
  if (!stores[roomId]) {
    stores[roomId] = JSON.parse(JSON.stringify(speedModeFixture));
  }
  return stores[roomId];
}

export const speedModeHandlers = [
  http.get('/api/v1/rooms/:roomId/speed-mode', async ({ params, request }) => {
    await delay(300);
    const scenario = request.headers.get('x-mock-scenario');
    if (scenario === 'no-task') return HttpResponse.json(speedModeNoTaskFixture);
    if (scenario === 'no-blockers') return HttpResponse.json(speedModeNoBlockersFixture);
    if (scenario === 'error') return new HttpResponse(null, { status: 500 });
    return HttpResponse.json(getStore(params.roomId as string));
  }),

  // Mark current task done — M07 trigger
  http.post('/api/v1/rooms/:roomId/speed-mode/tasks/:taskId/done', async ({ params }) => {
    await delay(200);
    const store = getStore(params.roomId as string);
    if (store.currentTask?.id === params.taskId) {
      // OQ-10: auto-swap or leader confirm? Defaulting to auto for mock.
      const next = store.nextUpTasks.shift() ?? null;
      store.currentTask = next;
    }
    return HttpResponse.json({ success: true });
  }),

  // Quick capture
  http.post('/api/v1/rooms/:roomId/speed-mode/capture', async ({ request }) => {
    await delay(150);
    const body = await request.json() as { text: string };
    if (!body.text?.trim()) return new HttpResponse(null, { status: 400 });
    // OQ-12: destination list unresolved — appends to backlog (not shown in column)
    return HttpResponse.json({ success: true, id: `cap-${Date.now()}` });
  }),
];
