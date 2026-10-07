/**
 * MSW handlers — Phase 6a (S25 Prep, S26 Crowd Check, S27 Tools, S28 Settings)
 * PRD 6a §4
 *
 * x-mock-scenario header values:
 *   prep:   'default' | 'allowed' | 'no-event'
 *   crowd:  'default'
 *   tools:  'default' | 'empty'
 *   settings: 'default'
 */
import { http, HttpResponse, delay } from 'msw';
import {
  prepFixture,
  prepAllowedFixture,
  prepNoEventFixture,
  crowdCheckFixture,
  toolsFixture,
  settingsFixture,
} from './fixtures';
import type { CrowdRow, CrowdCheckResponse } from '../types';

// In-memory store for Crowd Check rows (per room, reset on page reload)
const crowdStores: Record<string, CrowdCheckResponse> = {};

function getCrowdStore(roomId: string): CrowdCheckResponse {
  if (!crowdStores[roomId]) {
    crowdStores[roomId] = { rows: [...crowdCheckFixture.rows.map(r => ({ ...r }))] };
  }
  return crowdStores[roomId];
}

export const phase6aHandlers = [
  // ── S25 Prep ──────────────────────────────────────────────────

  http.get('/api/v1/rooms/:roomId/prep', async ({ request }) => {
    await delay(300);
    const scenario = request.headers.get('x-mock-scenario') ?? 'default';
    if (scenario === 'allowed')   return HttpResponse.json(prepAllowedFixture);
    if (scenario === 'no-event')  return HttpResponse.json(prepNoEventFixture);
    return HttpResponse.json(prepFixture);
  }),

  http.patch('/api/v1/rooms/:roomId/prep/checklist/:itemId', async ({ params, request }) => {
    await delay(150);
    const body = await request.json() as { done: boolean };
    return HttpResponse.json({ id: params.itemId, done: body.done });
  }),

  // ── S26 Crowd Check ────────────────────────────────────────────

  http.get('/api/v1/rooms/:roomId/crowd-check', async ({ params }) => {
    await delay(300);
    return HttpResponse.json(getCrowdStore(params.roomId as string));
  }),

  http.post('/api/v1/rooms/:roomId/crowd-check/rows', async ({ params }) => {
    await delay(200);
    const store = getCrowdStore(params.roomId as string);
    const newRow: CrowdRow = {
      id: `r${Date.now()}`,
      option: '',
      likelyCompetingIdeas: '',
      collegeOverlap: null,
      crowdedness: null,
      notes: '',
    };
    store.rows.push(newRow);
    return HttpResponse.json(newRow, { status: 201 });
  }),

  http.patch('/api/v1/rooms/:roomId/crowd-check/rows/:rowId', async ({ params, request }) => {
    await delay(150);
    const store = getCrowdStore(params.roomId as string);
    const body = await request.json() as Partial<CrowdRow>;
    const row = store.rows.find(r => r.id === params.rowId);
    if (!row) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    Object.assign(row, body);
    return HttpResponse.json(row);
  }),

  http.delete('/api/v1/rooms/:roomId/crowd-check/rows/:rowId', async ({ params }) => {
    await delay(150);
    const store = getCrowdStore(params.roomId as string);
    store.rows = store.rows.filter(r => r.id !== params.rowId);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── S27 Tool Directory ─────────────────────────────────────────

  http.get('/api/v1/tools', async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const scenario = request.headers.get('x-mock-scenario') ?? 'default';
    if (scenario === 'empty') return HttpResponse.json({ tools: [] });

    let { tools } = toolsFixture;
    const category = url.searchParams.get('category');
    const cost = url.searchParams.get('cost');
    const license = url.searchParams.get('license');

    if (category) tools = tools.filter(t => t.category === category);
    if (cost)     tools = tools.filter(t => t.cost === cost);
    if (license)  tools = tools.filter(t => t.license === license);

    return HttpResponse.json({ tools });
  }),

  // ── S28 Settings ───────────────────────────────────────────────

  http.get('/api/v1/users/me/settings', async () => {
    await delay(300);
    return HttpResponse.json(settingsFixture);
  }),

  http.patch('/api/v1/users/me/settings', async ({ request }) => {
    await delay(200);
    const body = await request.json();
    return HttpResponse.json({ ...settingsFixture, ...(body as object) });
  }),

  http.post('/api/v1/users/me/export', async () => {
    await delay(500);
    return HttpResponse.json({ downloadUrl: 'https://example.com/export.zip' });
  }),

  http.delete('/api/v1/users/me', async () => {
    await delay(300);
    return new HttpResponse(null, { status: 204 });
  }),
];
