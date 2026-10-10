/**
 * MSW handlers — mock API for Phase 1a screens.
 * Source: PRD §4, tech_stack.md §4.4.
 *
 * All data flows through these handlers via the typed API client.
 * No real backend exists. Operation names match the client stubs.
 */
import { http, HttpResponse, delay } from 'msw';
import {
  playbookFixtures,
  authSuccessFixture,
  authFailureFixture,
  inviteValidFixture,
  inviteExpiredFixture,
  VALID_INVITE_TOKEN,
  eventTemplateFixtures,
  homeFixture,
  overviewFixture,
  briefFixture,
  teamFixture,
  ideateFixture,
} from './fixtures';
import { readinessHandlers } from '@/features/readiness/api/mocks/handlers';
import { retroHandlers } from '@/features/retro/api/mocks/handlers';
import { phase6aHandlers } from '@/features/prep/api/mocks/handlers';
import { notificationsHandlers } from '@/features/notifications/api/mocks/handlers';
import { mentorHandlers } from '@/features/mentor/api/mocks/handlers';
import { speedModeHandlers } from '@/features/speed-mode/api/mocks/handlers';

export const handlers = [
  // ── Auth ───────────────────────────────────────────────────────
  http.get('/api/v1/me', async () => {
    await delay(300);
    return HttpResponse.json({
      id: 1,
      displayName: 'Aarav Mehta',
      email: 'aarav@example.com',
      avatarUrl: ''
    });
  }),
  http.post('/api/v1/logout', async () => {
    await delay(300);
    return HttpResponse.json(authFailureFixture);
  }),

  // ── Phase 2a: Home & Room Overview ────────────────────────────
  http.get('/api/v1/home', async () => {
    await delay(400);
    return HttpResponse.json(homeFixture);
  }),

  http.get('/api/v1/rooms', async () => {
    await delay(300);
    return HttpResponse.json([overviewFixture]);
  }),

  http.post('/api/v1/rooms', async ({ request }) => {
    await delay(400);
    const body = (await request.json().catch(() => ({}))) as any;
    const newRoom = {
      id: 'r-' + Date.now().toString(36),
      name: body.name || 'New Room',
      description: body.description || '',
      projectDescription: body.projectDescription || '',
      templateId: body.templateId || 'pb-sih',
      createdAt: new Date().toISOString(),
      eventStart: body.eventStart || null,
      eventEnd: body.eventEnd || null,
      timezone: body.timezone || 'Asia/Kolkata',
      ownerId: 'u-aarav',
      memberIds: ['u-aarav'],
      stage: 'brief',
      stageDone: { brief: false, ideate: false, crowd: false, plan: false },
    };
    return HttpResponse.json(newRoom);
  }),

  http.get('/api/v1/rooms/:roomId/overview', async () => {
    await delay(500);
    return HttpResponse.json(overviewFixture);
  }),

  // ── Phase 2b: Brief & Team ────────────────────────────────────
  http.get('/api/v1/rooms/:roomId/brief', async () => {
    await delay(500);
    return HttpResponse.json(briefFixture);
  }),
  http.get('/api/v1/rooms/:roomId/team', async () => {
    await delay(500);
    return HttpResponse.json(teamFixture);
  }),

  // ── Phase 3a: Ideate ──────────────────────────────────────────
  http.get('/api/v1/rooms/:roomId/ideate', async () => {
    await delay(500);
    return HttpResponse.json(ideateFixture);
  }),

  // ── F-1: Playbook list (S01) ──────────────────────────────────
  http.get('/api/v1/playbooks', async ({ request }) => {
    await delay(300);
    if (request.headers.get('x-test-force-error') === 'true') {
      return new HttpResponse(null, { status: 500 });
    }
    return HttpResponse.json(playbookFixtures);
  }),

  // ── S04: Playbook Detail ──────────────────────────────────────
  http.get('/api/v1/playbooks/:slug', async ({ params }) => {
    await delay(300);
    const playbook = playbookFixtures.find((p) => p.slug === params.slug);
    if (playbook) {
      return HttpResponse.json(playbook);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // ── S06: Event Templates ──────────────────────────────────────
  http.get('/api/v1/event-templates', async () => {
    await delay(300);
    return HttpResponse.json(eventTemplateFixtures);
  }),

  http.get('/api/v1/rooms/suggest-name', async () => {
    await delay(200);
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return HttpResponse.json({ suggestion: `My room — ${dateStr}` });
  }),

  // ── Phase 3b: Plan & Docs Vault ───────────────────────────────
  http.get('/api/v1/rooms/:roomId/plan', async () => {
    await delay(400);
    const { planStateFixture } = await import('./fixtures');
    return HttpResponse.json(planStateFixture);
  }),

  http.post('/api/v1/rooms/:roomId/plan/validate', async ({ request }) => {
    await delay(1200); // simulate some LLM time
    const { planValidateSuccessFixture, planValidateFailFixture } = await import('./fixtures');
    const forceError = request.headers.get('x-test-force-error');
    if (forceError === 'true') {
      return HttpResponse.json(planValidateFailFixture);
    }
    return HttpResponse.json(planValidateSuccessFixture);
  }),

  http.get('/api/v1/rooms/:roomId/docs', async () => {
    await delay(500);
    const { docsVaultFixture } = await import('./fixtures');
    return HttpResponse.json(docsVaultFixture);
  }),

  // ── Phase 4a: Board, Schedule, MVP Studio ─────────────────────
  http.get('/api/v1/rooms/:roomId/board', async () => {
    await delay(400);
    const { boardResponseFixture } = await import('./fixtures');
    return HttpResponse.json(boardResponseFixture);
  }),

  http.get('/api/v1/rooms/:roomId/schedule', async () => {
    await delay(400);
    const { scheduleFixture } = await import('./fixtures');
    return HttpResponse.json(scheduleFixture);
  }),

  http.get('/api/v1/rooms/:roomId/mvp', async () => {
    await delay(400);
    const { mvpStudioFixture } = await import('./fixtures');
    return HttpResponse.json(mvpStudioFixture);
  }),

  // ── Phase 4b: GitHub, APIs, Diagrams ──────────────────────────
  http.get('/api/v1/rooms/:roomId/github', async () => {
    await delay(400);
    const { githubFixture } = await import('./fixtures');
    return HttpResponse.json(githubFixture);
  }),

  http.get('/api/v1/rooms/:roomId/apis', async () => {
    await delay(400);
    const { apiHubFixture } = await import('./fixtures');
    return HttpResponse.json(apiHubFixture);
  }),

  http.get('/api/v1/rooms/:roomId/diagrams', async () => {
    await delay(400);
    const { diagramStudioFixture } = await import('./fixtures');
    return HttpResponse.json(diagramStudioFixture);
  }),

  // ── Phase 5a: Pitch, Demo, Submission ─────────────────────────
  http.get('/api/v1/rooms/:roomId/pitch/deck', async () => {
    await delay(400);
    const { pitchDeckFixture } = await import('./fixtures');
    return HttpResponse.json(pitchDeckFixture);
  }),

  http.get('/api/v1/rooms/:roomId/pitch/rehearse', async () => {
    await delay(400);
    const { rehearseFixture } = await import('./fixtures');
    return HttpResponse.json(rehearseFixture);
  }),

  http.get('/api/v1/rooms/:roomId/pitch/qa', async () => {
    await delay(400);
    const { qaFixture } = await import('./fixtures');
    return HttpResponse.json(qaFixture);
  }),

  http.get('/api/v1/rooms/:roomId/demo', async () => {
    await delay(400);
    const { demoFixture } = await import('./fixtures');
    return HttpResponse.json(demoFixture);
  }),

  http.get('/api/v1/rooms/:roomId/submission', async () => {
    await delay(400);
    const { submissionFixture } = await import('./fixtures');
    return HttpResponse.json(submissionFixture);
  }),

  // ── Phase 5b: Readiness (S23) & Retro (S24) ───────────────────
  ...readinessHandlers,
  ...retroHandlers,

  // ── Phase 6a: Prep (S25), Crowd Check (S26), Tools (S27), Settings (S28) ──
  ...phase6aHandlers,

  // ── Phase 6b: Notifications (S29), Mentor (S30), Speed Mode (S31) ──
  ...notificationsHandlers,
  ...mentorHandlers,
  ...speedModeHandlers,
];
