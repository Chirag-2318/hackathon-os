/**
 * Centralized route paths for the application.
 * All screens import from here — no hard-coded paths in components.
 * Source: PRD Phase 1a §5 navigation map, Q2/Q3 defaults.
 */

export const ROUTES = {
  /** S01 Landing (public) */
  LANDING: '/',
  /** S02 Sign in (public) */
  SIGN_IN: '/signin',
  /** S03 Invite landing (public, parameterized) */
  INVITE: '/invite/:token',
  /** S04 Playbooks — Phase 1b */
  PLAYBOOKS: '/playbooks',
  PLAYBOOK_DETAIL: '/playbooks/:slug',

  // ── Post-action destinations (configurable) ──
  /** Where to navigate after successful sign-in (Q2) */
  POST_AUTH: '/app/situation',
  /** Where to navigate after successful room join (Q2) */
  POST_JOIN: '/app',

  // ── Authenticated shell routes ──
  APP_ROOT: '/app',
  /** S05 Situation Picker */
  SITUATION: '/app/situation',
  /** S06 Create Room */
  CREATE_ROOM: '/app/create-room',

  // ── Phase 2a: Home & Room Overview ──
  /** S07 Home (My hackathons) */
  HOME: '/app/home',
  /** S08 Room Overview (command center) */
  ROOM_OVERVIEW: '/app/room/:roomId/overview',
} as const;

/**
 * Build the invite route for a specific token.
 */
export function invitePath(token: string): string {
  return `/invite/${encodeURIComponent(token)}`;
}

/**
 * Build the playbook detail route.
 */
export function playbookPath(slug: string): string {
  return `/playbooks/${encodeURIComponent(slug)}`;
}

/**
 * Build the room overview route.
 */
export function roomOverviewPath(roomId: string): string {
  return `/app/room/${encodeURIComponent(roomId)}/overview`;
}
