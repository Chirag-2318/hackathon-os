/**
 * Central copy module — finished copy adhering to voice rules.
 * Source: PRD Phase 1a §3, AC-14.
 *
 * Voice rules (D§8.1): direct, calm, specific, short sentences.
 * Banned words: seamless, unleash, supercharge, elevate, effortless, "let's get started!".
 */

export const BRAND_NAME = 'bracket.';
export const BRAND_DESCRIPTOR = 'the hackathon OS';

export const TODO_SENTINEL = '';

export const COPY = {
  // ── S01 Landing ──
  landing: {
    heroHeadline: 'Build together. Ship on time.',
    heroSentence: 'Plans, rooms and deadlines for hackathon teams. One clock from brief to demo.',
    fiveWaysTitle: 'Five ways teams lose',
    fiveWaysItems: [
      {
        label: 'no demo running by the halfway point',
        description: 'Ship an end-to-end slice early so judges see a working app.',
      },
      {
        label: 'scope larger than the clock',
        description: 'Cut features to fit the remaining hours rather than rushing.',
      },
      {
        label: 'rubric never read',
        description: 'Align every commit and slide with the scoring criteria.',
      },
      {
        label: 'submission started last',
        description: 'Give your team a two-hour buffer before the deadline.',
      },
      {
        label: 'no fallback if wifi fails',
        description: 'Pre-record your demo video and host offline fallbacks.',
      },
    ] as const,
    walkthroughTitle: 'From problem statement to polished submission',
    phases: [
      { name: 'Prep', description: 'Parse the prompt, identify constraints, and establish your workspace.' },
      { name: 'Ideate', description: 'Generate concepts, critique feasibility, and vote on the core thesis.' },
      { name: 'Plan', description: 'Break the project into milestones, assign owners, and track dependencies.' },
      { name: 'Build', description: 'Implement core features under live progress tracking.' },
      { name: 'Freeze', description: 'Lock scope, resolve blockers, and rehearse the presentation.' },
      { name: 'Ship', description: 'Package deliverables, record video, and submit ahead of the bell.' },
      { name: 'Retro', description: 'Review scoring, reflect on takeaways, and archive your project.' },
    ] as const,
    plansTitle: 'Choose how your team builds',
    planRows: [
      'Free (Prompt Bridge)',
      'Bring your key',
      'Pro',
    ] as const,
    playbookTitle: 'Battle-tested sprint playbooks',
    playbookEmptyAction: 'Browse all playbooks',
    playbookEmptyDescription: 'No playbooks found matching your filter.',
    playbookErrorMessage: 'Unable to load playbooks right now. Please refresh.',
    footer: 'Built for hackathon teams worldwide.',
  },

  // ── S02 Sign in ──
  signIn: {
    h1: 'Step inside.',
    h1Returning: 'Welcome back.',
    subline: 'Plans, rooms and deadlines for hackathon teams. Sign in to continue, or start something new.',
    githubButton: 'Continue with GitHub',
    googleButton: 'Continue with Google',
    permissionsLine: 'We only ask for your name, email and public profile. Private repositories stay private unless you allow them later.',
    privacyLabel: 'Privacy',
    privacyUrl: '/privacy',
    errorMessage: 'Something went wrong. Please try again.',
    illustrationAlt: 'Two tall black stone brackets facing each other in a quiet hall, with warm light spilling through the gap between them.',
  },

  // ── S03 Invite landing ──
  invite: {
    expiredHeading: 'This invite has expired',
    expiredMessage: 'Ask the leader for a new link',
    joinAs: 'Join as',
    joinRoom: 'Join room',
    errorMessage: 'Unable to load this invitation. Please check the link or ask your team leader.',
  },

  // ── Common ──
  logo: BRAND_NAME,
  nav: {
    playbooks: 'Playbooks',
    pricing: 'Pricing',
    signIn: 'Sign in',
    startRoom: 'Start a room',
  },

  // ── S29 Notifications ──
  notifications: {
    pageTitle: 'Notifications',
    filterAll: 'All',
    filterMentions: 'Mentions',
    filterBlockers: 'Blockers',
    filterSystem: 'System',
    emptyFirstUseTitle: 'No notifications yet',
    emptyFirstUseBody: 'Activity, mentions, and blocker alerts for your room will appear here.',
    emptyFirstUseAction: 'Go to Home',
    emptyFilteredTitle: 'No notifications in this view',
    emptyFilteredClear: 'Clear filters',
    errorMessage: 'Could not load notifications.',
    offlineBanner: 'Offline — showing cached notifications.',
    rowClickDestination: '/app/home',
    timeFormat: 'relative',
    systemAvatarTreatment: 'system-icon',
    filterBarOverflowAt360: 'scroll',
    unreadBlackHex: '#070707',
    unreadSecondaryTextDark: '#9A9AA3',
  },

  // ── S30 Mentor view ──
  mentor: {
    readOnlyChipLabel: 'Read only',
    askPlaceholder: 'Ask a question about the prompt, architecture, or tech stack...',
    askLabel: 'Ask a Mentor',
    askSubmitLabel: 'Send Question',
    askSubmitSuccess: 'Your question has been sent to the mentor queue.',
    contextFieldLabels: 'Room overview and project summary',
    summaryFramePlaceholder: 'Summary of the room problem statement and solution.',
    planFramePlaceholder: 'Milestone breakdown and active sprint progress.',
    boardFramePlaceholder: 'Current board status and open blocker tasks.',
    entryMechanism: 'mentor-link',
    reducedSidebarBreakpoint: 'collapsed',
    errorMessage: 'Could not load mentor context.',
    offlineBanner: 'Offline — showing cached data.',
  },

  // ── S32 System pages ──
  system: {
    notFoundTitle: 'Page not found',
    notFoundAction: 'Back to Home',
    serverErrorTitle: 'Something went wrong',
    serverErrorAction: 'Retry',
    forbiddenTitle: 'Access restricted',
    forbiddenBody: 'Ask the leader for an invite',
    forbiddenJoinFieldLabel: 'Room Code',
    forbiddenJoinButtonLabel: 'Enter Room',
    forbiddenJoinSuccessMessage: 'Room code accepted. Welcome!',
    forbiddenJoinErrorMessage: 'Invalid or expired room code.',
    forbiddenTriggerConditions: 'Room is private or you are not a member',
    offlineTitle: 'You are offline',
    offlineAmbiguity: 'banner-over-cache',
    maintenanceTitle: 'Under scheduled maintenance',
    maintenanceAction: 'Check status',
    shellChrome: 'none',
    s32NoTraceabilityRow: 'intentional',
    guidanceSentenceRequired: 'headline-and-action',
  },
} as const;
