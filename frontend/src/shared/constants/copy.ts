/**
 * Central copy module — all TBD strings live here with TODO sentinels.
 * Source: PRD Phase 1a §3, AC-14.
 *
 * Voice rules (D§8.1): direct, calm, specific, short sentences.
 * Banned words: seamless, unleash, supercharge, elevate, effortless, "let's get started!".
 *
 * A test scans for TODO_SENTINEL to track remaining TBD copy.
 */

function TODO(label: string): string {
  return `[TODO: ${label}]`;
}

export const TODO_SENTINEL = '[TODO:';

export const COPY = {
  // ── S01 Landing ──
  landing: {
    heroHeadline: TODO('hero headline'),
    heroSentence: TODO('hero sentence'),
    fiveWaysTitle: 'Five ways teams lose',
    fiveWaysItems: [
      {
        label: 'no demo running by the halfway point',
        description: TODO('five-ways item 1 sub-text'),
      },
      {
        label: 'scope larger than the clock',
        description: TODO('five-ways item 2 sub-text'),
      },
      {
        label: 'rubric never read',
        description: TODO('five-ways item 3 sub-text'),
      },
      {
        label: 'submission started last',
        description: TODO('five-ways item 4 sub-text'),
      },
      {
        label: 'no fallback if wifi fails',
        description: TODO('five-ways item 5 sub-text'),
      },
    ] as const,
    walkthroughTitle: TODO('walkthrough section title'),
    phases: [
      { name: 'Prep', description: TODO('prep phase description') },
      { name: 'Ideate', description: TODO('ideate phase description') },
      { name: 'Plan', description: TODO('plan phase description') },
      { name: 'Build', description: TODO('build phase description') },
      { name: 'Freeze', description: TODO('freeze phase description') },
      { name: 'Ship', description: TODO('ship phase description') },
      { name: 'Retro', description: TODO('retro phase description') },
    ] as const,
    plansTitle: TODO('plans section title'),
    planRows: [
      'Free (Prompt Bridge)',
      'Bring your key',
      'Pro',
    ] as const,
    playbookTitle: TODO('playbook section title'),
    playbookEmptyAction: TODO('playbook empty state action label'),
    playbookEmptyDescription: TODO('playbook empty state description'),
    playbookErrorMessage: TODO('playbook error message — what happened + what to do'),
    footer: TODO('footer content'),
  },

  // ── S02 Sign in ──
  signIn: {
    h1: TODO('sign in heading'),
    githubButton: 'Continue with GitHub',
    googleButton: 'Continue with Google',
    permissionsLine: TODO('minimal GitHub permissions requested'),
    privacyLabel: TODO('privacy link label'),
    privacyUrl: TODO('privacy link destination'),
    errorMessage: TODO('auth error — what happened + what to do'),
    illustrationAlt: TODO('sign-in illustration alt text'),
  },

  // ── S03 Invite landing ──
  invite: {
    expiredHeading: TODO('expired invite heading'),
    expiredMessage: 'Ask the leader for a new link',
    joinAs: 'Join as',
    joinRoom: 'Join room',
    errorMessage: TODO('invite error — what happened + what to do'),
  },

  // ── Common ──
  logo: 'Hackathon OS',
  nav: {
    playbooks: 'Playbooks',
    pricing: 'Pricing',
    signIn: 'Sign in',
    startRoom: 'Start a room',
  },

  // ── S29 Notifications ──
  notifications: {
    pageTitle: TODO('OQ-4: S29 page H1 copy'),
    filterAll: 'All',
    filterMentions: 'Mentions',
    filterBlockers: 'Blockers',
    filterSystem: 'System',
    emptyFirstUseTitle: TODO('OQ-4: S29 empty first-use headline'),
    emptyFirstUseBody: TODO('OQ-4: S29 empty first-use guidance sentence'),
    emptyFirstUseAction: TODO('OQ-4: S29 empty first-use primary action label'),
    emptyFilteredTitle: TODO('OQ-4: S29 filtered-empty headline'),
    emptyFilteredClear: 'Clear filters',
    errorMessage: 'Could not load notifications.',
    offlineBanner: 'Offline — showing cached notifications.',
    rowClickDestination: TODO('OQ-4: S29 row-click destination route'),
    timeFormat: TODO('OQ-4: S29 timestamp format — relative vs absolute, timezone toggle'),
    systemAvatarTreatment: TODO('OQ-4: avatar for system-generated notification rows'),
    filterBarOverflowAt360: TODO('OQ-4: filter-bar overflow behavior at 360px'),
    unreadBlackHex: '#070707',
    unreadSecondaryTextDark: '#9A9AA3',
  },

  // ── S30 Mentor view ──
  mentor: {
    readOnlyChipLabel: TODO('OQ-6: read-only chip exact copy'),
    askPlaceholder: TODO('OQ-7: ask-a-mentor question field placeholder'),
    askLabel: TODO('OQ-7: ask-a-mentor question field label'),
    askSubmitLabel: TODO('OQ-7: ask-a-mentor submit button label'),
    askSubmitSuccess: TODO('OQ-7: ask-a-mentor post-submit confirmation copy'),
    contextFieldLabels: TODO('OQ-7: mentor context-summary field labels'),
    summaryFramePlaceholder: TODO('OQ-5: S30 Summary page placeholder text'),
    planFramePlaceholder: TODO('OQ-5: S30 Plan page placeholder text'),
    boardFramePlaceholder: TODO('OQ-5: S30 Board snapshot page placeholder text'),
    entryMechanism: TODO('OQ-6: how S30 is reached — link format, token, auth model'),
    reducedSidebarBreakpoint: TODO('OQ-6: reduced sidebar collapse behavior'),
    errorMessage: 'Could not load mentor context.',
    offlineBanner: 'Offline — showing cached data.',
  },



  // ── S32 System pages ──
  system: {
    notFoundTitle: TODO('OQ-19: 404 headline'),
    notFoundAction: TODO('OQ-19: 404 primary action label'),
    serverErrorTitle: TODO('OQ-19: 500 headline'),
    serverErrorAction: TODO('OQ-19: 500 primary action label (Retry conventional)'),
    forbiddenTitle: TODO('OQ-18: 403 headline'),
    forbiddenBody: 'Ask the leader for an invite',
    forbiddenJoinFieldLabel: TODO('OQ-18: 403 join-code field label'),
    forbiddenJoinButtonLabel: TODO('OQ-18: 403 join-code submit button label'),
    forbiddenJoinSuccessMessage: TODO('OQ-18: 403 join-code success message'),
    forbiddenJoinErrorMessage: TODO('OQ-18: 403 join-code error message'),
    forbiddenTriggerConditions: TODO('OQ-18: which room-access scenarios produce 403'),
    offlineTitle: TODO('OQ-20: offline system page headline'),
    offlineAmbiguity: TODO('OQ-20: offline: dedicated full-page or banner-over-cache?'),
    maintenanceTitle: TODO('OQ-21: maintenance page headline'),
    maintenanceAction: TODO('OQ-21: maintenance page primary action label'),
    shellChrome: TODO('OQ-17: does any shell chrome (logo, top bar) wrap S32 pages?'),
    s32NoTraceabilityRow: TODO('OQ-15: S32 has no design.md §14 traceability row — intentional?'),
    guidanceSentenceRequired: TODO('OQ-16: S32 pages require C28 full anatomy (guidance sentence) or just headline+action?'),
  },
} as const;
