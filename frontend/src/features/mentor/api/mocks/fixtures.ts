/**
 * S30 Mentor View — MSW fixtures
 * Source: design.md §8.2 seed data (Team Kaveri / MessMeter)
 *
 * Schema is provisional (OQ-7). Uses plausible-but-clearly-placeholder content.
 * No fabricated task counts on the empty frames.
 */
import type { MentorContextResponse } from '../types';

export const mentorContextFixture: MentorContextResponse = {
  lastSyncedAt: new Date().toISOString(),
  context: {
    teamName: 'Team Kaveri',
    problemStatement: 'College mess managers waste 30% of food daily because they cook for peak capacity, not actual demand.',
    currentPhase: 'Build',
    rubricItems: [
      { name: 'Innovation', weightPercent: 30 },
      { name: 'Execution', weightPercent: 40 },
      { name: 'UI/UX', weightPercent: 30 },
    ],
    snapshotAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
};
