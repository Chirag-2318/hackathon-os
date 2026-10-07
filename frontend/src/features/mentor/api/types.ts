/**
 * S30 Mentor View — API types
 * Source: PRD Phase 6b §3.2, design.md §6 S30
 *
 * MentorContext is an opaque "already-packaged" object from the backend
 * Context pack builder (tech_stack.md §9.1). This phase only renders it.
 * Schema is provisional — the backend finalises it.
 */

export interface MentorContextSnapshot {
  teamName: string;
  problemStatement: string;
  currentPhase: string;
  rubricItems: Array<{ name: string; weightPercent: number }>;
  /** ISO timestamp */
  snapshotAt: string;
}

export interface MentorContextResponse {
  context: MentorContextSnapshot;
  /** OQ-7: exact field list unresolved */
  lastSyncedAt: string;
}

export type MentorNavItem = 'summary' | 'plan' | 'board' | 'ask';
