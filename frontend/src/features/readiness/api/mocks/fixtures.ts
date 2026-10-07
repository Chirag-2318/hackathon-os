/**
 * _fixture: Mock data. Not produced by any scoring algorithm. PRD 5b §6.1.
 *
 * S23 Readiness MSW fixture data.
 * Source: PRD 5b §6.1.
 */
import type { ReadinessResponse } from '../types';

/** Default scenario — event in progress, simulator validated */
export const readinessDefaultFixture: ReadinessResponse = {
  _fixture: 'Mock data. Not produced by any scoring algorithm. PRD 5b §6.1.',
  rings: [
    { id: 'rubric-coverage',     label: 'Rubric coverage',     progress: 0.83, valueText: '5 of 6',   destination: '/app/room/:roomId/brief' },
    { id: 'mvp-runs',            label: 'MVP runs',            progress: 1.0,  valueText: '100%',     destination: '/app/room/:roomId/mvp' },
    { id: 'demo-rehearsed',      label: 'Demo rehearsed',      progress: 0.6,  valueText: '3 runs',   destination: '/app/room/:roomId/demo' },
    { id: 'submission-complete', label: 'Submission complete', progress: 0.8,  valueText: '12 of 15', destination: '/app/room/:roomId/submit' },
    { id: 'roles-set',           label: 'Roles set',           progress: 1.0,  valueText: '6 of 6',   destination: '/app/room/:roomId/team' },
    { id: 'fallback-recorded',   label: 'Fallback recorded',   progress: 0.0,  valueText: '0%',       destination: '/app/room/:roomId/demo' },
  ],
  weakSpots: [
    { id: 'ws1', code: 'FB', title: 'No fallback demo video recorded',               severity: 'high',   percent: 0,  owner: 'Tanvi Kulkarni', updatedAt: '2026-11-21T23:40:00+05:30' },
    { id: 'ws2', code: 'PR', title: 'No slide addresses the Presentation criterion', severity: 'medium', percent: 0,  owner: 'Ishita Rao',     updatedAt: '2026-11-21T23:40:00+05:30' },
    { id: 'ws3', code: 'SU', title: '3 of 15 submission items are still open',       severity: 'low',    percent: 80, owner: 'Aarav Mehta',    updatedAt: '2026-11-21T23:40:00+05:30' },
  ],
  simulator: {
    mode: 'free',
    bridgeStep: 'validated',
    scores: [
      { criterion: 'Innovation',      weight: 25, score: 17 },
      { criterion: 'Feasibility',     weight: 20, score: 15 },
      { criterion: 'Impact',          weight: 20, score: 14 },
      { criterion: 'Technical depth', weight: 15, score: 11 },
      { criterion: 'UX',              weight: 10, score: 8  },
      { criterion: 'Presentation',    weight: 10, score: 5  },
    ],
    likelyQuestions: [
      'How accurate is the forecast, and how did you measure it?',
      'What data does a mess need before MessMeter works, and what if it has no digital attendance records?',
      'Which parts of the demo run on real data and which are mocked?',
      'Who would adopt this first, and who pays for it?',
      'What happens on a day with an event or holiday the forecast has not seen?',
    ],
  },
};

/** First-use scenario — rings at zero, simulator not started */
export const readinessFirstUseFixture: ReadinessResponse = {
  _fixture: 'Mock data. First-use scenario. PRD 5b §6.1.',
  rings: [
    { id: 'rubric-coverage',     label: 'Rubric coverage',     progress: 0,   valueText: '0 of 6',  destination: '/app/room/:roomId/brief' },
    { id: 'mvp-runs',            label: 'MVP runs',            progress: 0,   valueText: '0%',      destination: '/app/room/:roomId/mvp' },
    { id: 'demo-rehearsed',      label: 'Demo rehearsed',      progress: 0,   valueText: '0 runs',  destination: '/app/room/:roomId/demo' },
    { id: 'submission-complete', label: 'Submission complete', progress: 0,   valueText: '0 of 15', destination: '/app/room/:roomId/submit' },
    { id: 'roles-set',           label: 'Roles set',           progress: 0,   valueText: '0 of 6',  destination: '/app/room/:roomId/team' },
    { id: 'fallback-recorded',   label: 'Fallback recorded',   progress: 0,   valueText: '0%',      destination: '/app/room/:roomId/demo' },
  ],
  weakSpots: [],
  simulator: {
    mode: 'free',
    bridgeStep: 'not_started',
    scores: [],
    likelyQuestions: [],
  },
};

/** Validation-failed scenario — paste validator returns errors */
export const readinessValidationFailedFixture: ReadinessResponse = {
  ...readinessDefaultFixture,
  _fixture: 'Mock data. Validation-failed scenario. PRD 5b §6.1.',
  simulator: {
    ...readinessDefaultFixture.simulator,
    bridgeStep: 'answer_pasted',
    scores: [],
    likelyQuestions: [],
  },
};

/** Many weak spots — tests virtualization (60 rows) */
export const readinessWeakSpotsManyFixture: ReadinessResponse = {
  ...readinessDefaultFixture,
  _fixture: 'Mock data. Many weak spots scenario for virtualization test. PRD 5b §6.1.',
  weakSpots: Array.from({ length: 60 }, (_, i) => ({
    id: `ws-many-${i}`,
    code: String.fromCharCode(65 + (i % 26)) + String.fromCharCode(65 + ((i + 1) % 26)),
    title: `Weak spot ${i + 1}: Sample issue text for testing virtualization`,
    severity: (['high', 'medium', 'low'] as const)[i % 3],
    percent: Math.round((i / 60) * 100),
    owner: 'Aarav Mehta',
    updatedAt: '2026-11-21T23:40:00+05:30',
  })),
};
