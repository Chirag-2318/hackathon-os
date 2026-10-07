/**
 * _fixture: Mock data. Illustrative milestones and values. PRD 5b §6.2.
 *
 * S24 Retro & Portfolio MSW fixture data.
 * Source: PRD 5b §6.2.
 *
 * Consistency checks:
 * - wrapped.rehearsals (3) = S23 "Demo rehearsed" value (3 runs)
 * - wrapped.firstWorkingDemoHour (14) = milestones "First end-to-end run" hour (14)
 * - Build actualHours 19 = highlighted bar (most overrun)
 * - Project identity = seed values [D §8.2]
 */
import type { RetroResponse } from '../types';

/** Default scenario — returning user, retro saved, no decision */
export const retroDefaultFixture: RetroResponse = {
  _fixture: 'Mock data. Illustrative milestones and values. PRD 5b §6.2.',
  wrapped: {
    hours: 36,
    tasksDone: 41,
    firstWorkingDemoHour: 14,
    rehearsals: 3,
  },
  milestones: [
    // ILLUSTRATIVE from D S24. Not a fixed list (OQ-11). Items come from data.
    { id: 'm1', title: 'Idea locked',          hour: 6,  phase: 'ideate' },
    { id: 'm2', title: 'First end-to-end run', hour: 14, phase: 'build'  },
    { id: 'm3', title: 'Submission started',   hour: 30, phase: 'ship'   },
  ],
  phaseTime: [
    // _phaseTime_note: Build overran by 3 h — the highlighted bar.
    { phase: 'ideate', label: 'Ideate', plannedHours: 6,  actualHours: 6  },
    { phase: 'plan',   label: 'Plan',   plannedHours: 3,  actualHours: 3  },
    { phase: 'build',  label: 'Build',  plannedHours: 16, actualHours: 19 },
    { phase: 'ship',   label: 'Ship',   plannedHours: 6,  actualHours: 6  },
  ],
  retro: {
    worked: 'Locking the idea at hour 6 kept us from re-debating scope.',
    didnt:  'We recorded the fallback demo video too late.',
    change: 'Start the fallback recording before feature freeze.',
  },
  decision: null,
  twoWeekPlan: {
    week1: [
      'Collect one week of real attendance from a hostel mess',
      'Replace the mocked forecast input with that data',
      'Book a 20-minute conversation with a mess manager',
    ],
    week2: [
      'Measure forecast error against the actual meals cooked',
      'Fix the top three problems from that conversation',
      'Decide whether to pilot in a second hostel',
    ],
  },
  portfolio: {
    project: {
      name: 'MessMeter',
      description: 'MessMeter is a tool that tells mess managers how many meals to cook tomorrow, for college hostels.',
    },
    role: 'Team leader, Backend',
    links: [
      { label: 'Repository', url: 'https://example.org/team-kaveri/messmeter' },
      { label: 'Demo video', url: 'https://example.org/team-kaveri/messmeter-demo' },
    ],
    awards: [
      { title: 'Second place', event: 'Campus Build Sprint 2026' },
    ],
  },
};

/** First-open scenario — Wrapped unseen, retro empty */
export const retroFirstOpenFixture: RetroResponse = {
  ...retroDefaultFixture,
  _fixture: 'Mock data. First-open scenario. PRD 5b §6.2.',
  retro: { worked: '', didnt: '', change: '' },
  decision: null,
};

/** First-use empty scenario — no wrapped numbers, milestones or phase data */
export const retroFirstUseEmptyFixture: RetroResponse = {
  _fixture: 'Mock data. First-use empty scenario. PRD 5b §6.2.',
  wrapped: { hours: 0, tasksDone: 0, firstWorkingDemoHour: 0, rehearsals: 0 },
  milestones: [],
  phaseTime: [],
  retro: { worked: '', didnt: '', change: '' },
  decision: null,
  twoWeekPlan: { week1: [], week2: [] },
  portfolio: {
    project: { name: 'MessMeter', description: '' },
    role: '',
    links: [],
    awards: [],
  },
};

/** Continue chosen scenario — 2-week plan card open */
export const retroContinueChosenFixture: RetroResponse = {
  ...retroDefaultFixture,
  _fixture: 'Mock data. Continue-chosen scenario. PRD 5b §6.2.',
  retro: {
    worked: 'Locking the idea at hour 6 kept us from re-debating scope.',
    didnt:  'We recorded the fallback demo video too late.',
    change: 'Start the fallback recording before feature freeze.',
  },
  decision: 'continue',
};

/** Archive chosen scenario */
export const retroArchiveChosenFixture: RetroResponse = {
  ...retroDefaultFixture,
  _fixture: 'Mock data. Archive-chosen scenario. PRD 5b §6.2.',
  decision: 'archive',
};

/** No awards scenario */
export const retroNoAwardsFixture: RetroResponse = {
  ...retroDefaultFixture,
  _fixture: 'Mock data. No-awards scenario. PRD 5b §6.2.',
  portfolio: {
    ...retroDefaultFixture.portfolio,
    awards: [],
  },
};

/** Long text scenario — tests truncation and layout shift resistance */
export const retroLongTextFixture: RetroResponse = {
  ...retroDefaultFixture,
  _fixture: 'Mock data. Long-text scenario. PRD 5b §6.2.',
  milestones: [
    {
      id: 'm-long-1',
      title: 'A very long milestone title that should truncate gracefully and not cause any layout shift in the timeline column whatsoever',
      hour: 6,
      phase: 'ideate',
    },
    { id: 'm-long-2', title: 'First end-to-end run', hour: 14, phase: 'build' },
    { id: 'm-long-3', title: 'Submission started', hour: 30, phase: 'ship' },
  ],
  retro: {
    worked: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10),
    didnt:  'Phasellus et nisi vel lorem maximus sollicitudin. '.repeat(10),
    change: 'Donec tincidunt risus in enim auctor, vitae hendrerit erat accumsan. '.repeat(10),
  },
  portfolio: {
    project: {
      name: 'MessMeter with a very long project name that should still truncate properly',
      description: 'MessMeter is a tool that tells mess managers how many meals to cook tomorrow, for college hostels. '.repeat(5),
    },
    role: 'Team leader, Backend, Frontend, DevOps, UX designer, and general problem solver for the entire team',
    links: [
      { label: 'Repository', url: 'https://example.org/team-kaveri/messmeter' },
      { label: 'Demo video', url: `https://example.org/${'x'.repeat(200)}` },
    ],
    awards: [
      { title: 'Second place with a very long award title that goes on and on', event: 'Campus Build Sprint 2026 International Grand Championship Edition' },
    ],
  },
};

/** Hostile text scenario — tests sanitization */
export const retroHostileTextFixture: RetroResponse = {
  ...retroDefaultFixture,
  _fixture: 'Mock data. Hostile-text scenario for sanitization tests. PRD 5b §6.2.',
  retro: {
    worked: '<script>alert("xss")</script> This should appear as plain text.',
    didnt:  '<img onerror="alert(1)" src="x"> This too should be inert.',
    change: 'javascript:alert("xss") and <b>bold</b> and &lt;escaped&gt;',
  },
  portfolio: {
    ...retroDefaultFixture.portfolio,
    awards: [
      { title: '<script>alert("award")</script>', event: 'Campus Build Sprint 2026' },
    ],
    links: [
      { label: 'Safe link', url: 'https://example.org/safe' },
      { label: 'JS link', url: 'javascript:alert("bad")' },
      { label: 'Data URI', url: 'data:text/html,<script>alert(1)</script>' },
    ],
  },
};
