/**
 * MSW fixture data for Phase 1a screens.
 * Source: PRD §4, D§8.2 seed data.
 *
 * Every fixture is limited to fields that screens actually display.
 * Values come from D§8.2 seed data wherever it covers them.
 */

import type { PlaybookDetail, EventTemplate, InviteView } from '@/api/client';

export const playbookFixtures: PlaybookDetail[] = [
  {
    id: 'pb-sih',
    slug: 'sih-style-hackathon',
    title: 'SIH-style hackathon',
    eventType: '36-hour team',
    teamSizeLabel: 'Team of 6',
    teamSize: 6,
    phaseCount: 7,
    phases: '7 phases',
    illustrationKey: 'sih',
    defaultRubric: ['Innovation', 'Technical Complexity', 'Feasibility'],
    checklistPreview: ['Form team', 'Submit idea', 'Build MVP'],
  },
  {
    id: 'pb-devpost',
    slug: '48-hour-online',
    title: '48-hour online Devpost-style',
    eventType: '48-hour online',
    teamSizeLabel: '1-4 members',
    teamSize: null,
    phaseCount: 7,
    phases: '7 phases',
    illustrationKey: 'devpost',
    defaultRubric: ['Originality', 'Design', 'Impact'],
    checklistPreview: ['Register', 'Build', 'Record demo video'],
  },
  {
    id: 'pb-mlh',
    slug: 'weekend-mlh',
    title: 'Weekend MLH-style',
    eventType: '36-hour team',
    teamSizeLabel: 'Team of 4',
    teamSize: 4,
    phaseCount: 7,
    phases: '7 phases',
    illustrationKey: 'mlh',
    defaultRubric: ['Learning', 'Hack', 'Usefulness'],
    checklistPreview: ['Attend team building', 'Build', 'Demo to judges'],
  },
  {
    id: 'pb-sprint',
    slug: '4-hour-sprint',
    title: '4-hour AI sprint',
    eventType: '4-hour sprint',
    teamSizeLabel: 'Team of 3',
    teamSize: 3,
    phaseCount: 5,
    phases: '5 phases',
    illustrationKey: 'sprint',
    defaultRubric: ['Prompt Engineering', 'Speed', 'Result quality'],
    checklistPreview: ['Analyze problem', 'Draft prompts', 'Test'],
  },
  {
    id: 'pb-corporate',
    slug: 'corporate-hackathon',
    title: 'Corporate Hackathon',
    eventType: '1-week internal',
    teamSizeLabel: '2-5 members',
    teamSize: 5,
    phaseCount: 4,
    phases: '4 phases',
    illustrationKey: 'corporate',
    defaultRubric: ['Business Value', 'Integration', 'Security'],
    checklistPreview: ['Formulate pitch', 'Build prototype', 'Executive review'],
  },
  {
    id: 'pb-solo',
    slug: 'solo-builder',
    title: 'Solo Builder Weekend',
    eventType: 'Weekend solo',
    teamSizeLabel: '1 member',
    teamSize: 1,
    phaseCount: 3,
    phases: '3 phases',
    illustrationKey: 'solo',
    defaultRubric: ['Completion', 'Polish'],
    checklistPreview: ['Plan architecture', 'Code', 'Deploy'],
  },
];

export const playbookEmptyFixture: PlaybookDetail[] = [];

export const eventTemplateFixtures: EventTemplate[] = playbookFixtures.map(pb => ({
  id: pb.id,
  name: pb.title,
  teamSizeDefault: pb.teamSize || 4,
  phaseDefaults: [
    { label: 'Prep', duration: '1h' },
    { label: 'Build', duration: '24h' },
    { label: 'Wrap', duration: '2h' },
  ],
}));

// ── F-2: Auth (S02) ─────────────────────────────────────────────

export const authSuccessFixture = {
  success: true as const,
};

export const authFailureFixture = {
  success: false as const,
  error: 'Authentication failed. Please try again.',
};

// ── F-3: Invite (S03) ───────────────────────────────────────────

/** Valid invite token for testing */
export const VALID_INVITE_TOKEN = 'valid-invite';

export const inviteValidFixture: InviteView = {
  status: 'valid',
  room: {
    name: 'Team Kaveri',
    eventName: 'Campus Build Sprint 2026',
    leader: {
      name: 'Aarav Mehta',
    },
    rolesNeeded: [
      { label: 'ML/AI', color: 'var(--pastel-violet)' },
      { label: 'Domain expert', color: 'var(--pastel-cream)' },
      { label: 'QA/Demo operator', color: 'var(--pastel-lime)' },
    ],
    members: [
      { name: 'Aarav Mehta' },
      { name: 'Ishita Rao' },
      { name: 'Kabir Nair' },
    ],
    joinableRoles: [
      { label: 'ML/AI', color: 'var(--pastel-violet)' },
      { label: 'Domain expert', color: 'var(--pastel-cream)' },
      { label: 'QA/Demo operator', color: 'var(--pastel-lime)' },
    ],
  },
};

export const inviteExpiredFixture: InviteView = {
  status: 'expired_or_invalid',
};

// ── Phase 2a: Home & Room Overview ──────────────────────────────

import type { HomeSummaryResponse, RoomOverviewResponse } from '@/api/client';

export const homeFixture: HomeSummaryResponse = {
  greeting: 'Aarav Mehta',
  rooms: [
    {
      id: 'r-1',
      name: 'Campus Build Sprint 2026',
      eventTag: 'Campus Sprint',
      progressPercent: 62,
      participantAvatarIds: ['AM', 'IR', 'KN'],
      leaderName: 'Aarav Mehta',
      tasksLeft: 18,
    },
    {
      id: 'r-2',
      name: 'Internal Round: Software Edition',
      eventTag: 'Internal',
      progressPercent: 30,
      participantAvatarIds: ['AM', 'JD'],
      leaderName: 'Jane Doe',
      tasksLeft: 42,
    },
  ],
  roomList: [
    {
      id: 'r-1',
      title: 'Campus Build Sprint 2026',
      meta: {
        avatarId: 'AM',
        name: 'Aarav Mehta',
        time: 'Active',
      },
      progressPercent: 62,
      metaIconCounts: { tasks: 18, attachments: 3, comments: 12 },
      status: 'Active',
    },
    {
      id: 'r-2',
      title: 'Internal Round: Software Edition',
      meta: {
        avatarId: 'JD',
        name: 'Jane Doe',
        time: 'Active',
      },
      progressPercent: 30,
      metaIconCounts: { tasks: 42, attachments: 1, comments: 4 },
      status: 'Active',
    },
  ],
  upcoming: [
    { id: 'u-1', label: 'Freeze', href: '#freeze' },
    { id: 'u-2', label: 'Submit', href: '#submit' },
  ],
  weekDays: [
    { date: '2026-11-20', isToday: true, hasEvent: false },
    { date: '2026-11-21', isToday: false, hasEvent: true },
    { date: '2026-11-22', isToday: false, hasEvent: true },
    { date: '2026-11-23', isToday: false, hasEvent: false },
    { date: '2026-11-24', isToday: false, hasEvent: false },
    { date: '2026-11-25', isToday: false, hasEvent: false },
    { date: '2026-11-26', isToday: false, hasEvent: true },
  ],
};

export const overviewFixture: RoomOverviewResponse = {
  kpis: {
    timeLeft: '09:05',
    checkpointsPassed: { value: '3', total: '7', delta: '+1' },
    tasksOpen: { value: '18', delta: '-4' },
    blockedTasksCount: 2,
  },
  clockStrip: {
    phaseSegments: [
      { id: 'prep', color: 'var(--pastel-peach)', widthPercent: 10 },
      { id: 'ideate', color: 'var(--pastel-yellow)', widthPercent: 15 },
      { id: 'plan', color: 'var(--pastel-lime)', widthPercent: 15 },
      { id: 'build', color: 'var(--pastel-sky)', widthPercent: 40 },
      { id: 'wrap', color: 'var(--pastel-lavender)', widthPercent: 20 },
    ],
    nowPercent: 55, // In "build" phase
    freezeInText: '3h 20m',
    submitInText: '9h 05m',
    freezeCrossed: false,
    lastHour: false,
  },
  decisionTimer: {
    decisionOpen: false,
    timeRemaining: '',
    expired: false,
  },
  progressChart: [
    { label: '9 AM', actual: 0, planned: 0, series1: 0, series2: 0, series3: 0 },
    { label: '12 PM', actual: 10, planned: 15, series1: 5, series2: 3, series3: 2 },
    { label: '3 PM', actual: 25, planned: 30, series1: 10, series2: 10, series3: 5 },
    { label: '6 PM', actual: 40, planned: 45, series1: 15, series2: 15, series3: 10 },
    { label: '9 PM', actual: 55, planned: 60, series1: 20, series2: 20, series3: 15 },
    { label: '12 AM', actual: 62, planned: 70, series1: 25, series2: 22, series3: 15 },
  ],
  heatmap: [
    { hour: '09', day: '2026-11-21', category: 'code', intensityOrPresent: 1 },
    { hour: '10', day: '2026-11-21', category: 'docs', intensityOrPresent: 1 },
    { hour: '11', day: '2026-11-21', category: 'design', intensityOrPresent: 1 },
    { hour: '12', day: '2026-11-21', category: 'empty', intensityOrPresent: 0 },
    { hour: '13', day: '2026-11-21', category: 'code', intensityOrPresent: 1 },
    { hour: '14', day: '2026-11-21', category: 'code', intensityOrPresent: 1 },
  ],
  myTasks: [
    { id: 't-1', title: 'Setup repository', checklistProgressPercent: 100, isBlocked: false },
    { id: 't-2', title: 'Design DB schema', checklistProgressPercent: 100, isBlocked: false },
    { id: 't-3', title: 'Build auth API', checklistProgressPercent: 50, isBlocked: true },
    { id: 't-4', title: 'Connect frontend to API', checklistProgressPercent: 0, isBlocked: true },
    { id: 't-5', title: 'Write tests', checklistProgressPercent: 0, isBlocked: false },
    { id: 't-6', title: 'Deploy to staging', checklistProgressPercent: 0, isBlocked: false },
  ],
  teamMembers: [
    { id: 'm-1', avatarId: 'AM', name: 'Aarav Mehta', role: 'Leader', presenceOnline: true },
    { id: 'm-2', avatarId: 'IR', name: 'Ishita Rao', role: 'Developer', presenceOnline: true },
    { id: 'm-3', avatarId: 'KN', name: 'Kabir Nair', role: 'Designer', presenceOnline: false },
    { id: 'm-4', avatarId: 'SG', name: 'Sanjay Gupta', role: 'Developer', presenceOnline: true },
    { id: 'm-5', avatarId: 'PL', name: 'Priya Lal', role: 'QA', presenceOnline: false },
    { id: 'm-6', avatarId: 'RJ', name: 'Rahul Jain', role: 'DevOps', presenceOnline: true },
  ],
  phase: 'build',
};

// ── Phase 2b: Brief & Team ──────────────────────────────────────

import type { BriefResponse, TeamResponse } from '@/api/client';

export const briefFixture: BriefResponse = {
  roomId: 'r-1',
  sourceText: `Welcome to Campus Build Sprint 2026!
The problem: Students lack reliable ways to find study groups.
We need a mobile app to solve this.
Deadline to submit is Nov 22, 9:00 AM PST.
Must use open source libraries.
Video pitch required.`,
  extractedSpans: [
    { id: 's-1', startIndex: 37, endIndex: 95 }, // Problem
    { id: 's-2', startIndex: 129, endIndex: 171 }, // Deadline
    { id: 's-3', startIndex: 172, endIndex: 202 }, // OS libs
    { id: 's-4', startIndex: 203, endIndex: 224 }, // Video
  ],
  confirmedCount: 3,
  totalExtracts: 4,
  rulesChangedEvent: { dateStr: '20 Sep', itemsToReviewCount: 2 },
  problemStatement: {
    text: 'Students lack reliable ways to find study groups.',
    sourceUrl: '#s-1',
  },
  rubric: [
    { id: 'c-1', name: 'Innovation', weightPercent: 30 },
    { id: 'c-2', name: 'Execution', weightPercent: 40 },
    { id: 'c-3', name: 'UI/UX', weightPercent: 30 },
  ],
  rulesChecklist: [
    { id: 'rc-1', title: 'Use open source libraries', isDone: false, isConfirmed: true, sourceSpanId: 's-3' },
    { id: 'rc-2', title: 'Include video pitch', isDone: true, isConfirmed: false, sourceSpanId: 's-4' },
  ],
  deadlines: [
    { id: 'd-1', label: 'Submission', timeText: '9:00 AM', timezone: 'PST' },
  ],
  eligibility: [
    { id: 'e-1', label: 'Student status', status: 'Pass' },
    { id: 'e-2', label: 'Team size <= 4', status: 'Fail' },
    { id: 'e-3', label: 'Prior projects', status: '?' },
  ],
  tracks: [
    { id: 't-1', name: 'EdTech', description: 'Best education solution', pastelFill: 'var(--pastel-sky)' },
    { id: 't-2', name: 'Design', description: 'Best UI/UX', pastelFill: 'var(--pastel-peach)' },
  ],
  aiPolicyText: 'AI tools permitted for code generation but must be disclosed.',
  formatProfile: 'Video',
};

export const teamFixture: TeamResponse = {
  roomId: 'r-1',
  members: [
    {
      id: 'm-1', fullName: 'Aarav Mehta', email: 'aarav@example.com', githubHandle: '@aaravm',
      roleTags: ['Fullstack', 'Leader'], availabilityHours: 20, skills: ['React', 'Node.js'],
      avatarId: 'AM', timeSlotsText: 'Evenings', sessionsCount: 4,
    },
    {
      id: 'm-2', fullName: 'Ishita Rao', email: 'ishita@example.com', githubHandle: '@ishitar',
      roleTags: ['Frontend', 'Design'], availabilityHours: 15, skills: ['Figma', 'CSS'],
      avatarId: 'IR', timeSlotsText: 'Weekends', sessionsCount: 2,
    },
    {
      id: 'm-3', fullName: 'Kabir Nair', email: 'kabir@example.com', githubHandle: '@kabirn',
      roleTags: ['Backend'], availabilityHours: 25, skills: ['PostgreSQL', 'Go'],
      avatarId: 'KN', timeSlotsText: 'Anytime', sessionsCount: 5,
    },
  ],
  charterPolls: [
    {
      id: 'cp-1', title: 'Goals',
      options: [
        { label: 'Win', count: 1, percent: 33, color: 'var(--pastel-peach)' },
        { label: 'Learn', count: 1, percent: 33, color: 'var(--pastel-sky)' },
        { label: 'Portfolio', count: 0, percent: 0, color: 'var(--pastel-yellow)' },
        { label: 'All three', count: 1, percent: 33, color: 'var(--pastel-lime)' },
      ],
      unansweredMemberIds: [],
    },
    {
      id: 'cp-2', title: 'Commitment hours',
      options: [
        { label: '10-15h', count: 1, percent: 50, color: 'var(--pastel-peach)' },
        { label: '20h+', count: 1, percent: 50, color: 'var(--pastel-sky)' },
      ],
      unansweredMemberIds: ['m-3'], // Kabir hasn't answered
    },
    {
      id: 'cp-3', title: 'Feedback norms',
      options: [
        { label: 'Direct', count: 3, percent: 100, color: 'var(--pastel-peach)' },
        { label: 'Gentle', count: 0, percent: 0, color: 'var(--pastel-sky)' },
      ],
      unansweredMemberIds: [],
    }
  ],
  skillGapRadar: [
    { capability: 'build', coverage: 80 },
    { capability: 'design', coverage: 60 },
    { capability: 'presentation', coverage: 40 },
    { capability: 'domain', coverage: 70 },
    { capability: 'ai', coverage: 20 },
  ],
  healthPanel: {
    checkInOptions: [
      { id: 'c-1', label: 'Energized', icon: '⚡' },
      { id: 'c-2', label: 'Focusing', icon: '🧠' },
      { id: 'c-3', label: 'Tired', icon: '🥱' },
    ],
    memberHealth: [
      { memberId: 'm-1', workloadPercent: 65, isOverloaded: true }, // > 60 triggers rescuer alert
      { memberId: 'm-2', workloadPercent: 20, isOverloaded: false },
      { memberId: 'm-3', workloadPercent: 15, isOverloaded: false },
    ],
  },
};

// ── Phase 3a: Ideate (S11) ──────────────────────────────────────

import type { IdeateResponse } from '@/api/client';

export const ideateFixture: IdeateResponse = {
  roomId: 'r-1',
  stage: 'Solo',
  ideas: [
    {
      id: 'idea-1',
      title: 'Study Buddy Tinder',
      identitySentence: 'A mobile app that matches students for study sessions based on course syllabus.',
      authorId: 'm-1',
      authorName: 'Aarav Mehta',
      authorAvatarId: 'AM',
      status: 'New',
      roleNeeds: ['Frontend', 'Backend'],
      commentCount: 2,
      attachmentCount: 1,
    },
    {
      id: 'idea-2',
      title: 'Campus Navigator AR',
      identitySentence: 'AR navigation for campus buildings with real-time class schedules.',
      authorId: 'm-2',
      authorName: 'Ishita Rao',
      authorAvatarId: 'IR',
      status: 'Shortlist',
      roleNeeds: ['Design', 'AR/VR'],
      commentCount: 5,
      attachmentCount: 3,
    },
    {
      id: 'idea-3',
      title: 'Study Room Booking Bot',
      identitySentence: 'A Telegram bot that finds and books empty study rooms instantly.',
      authorId: 'm-3',
      authorName: 'Kabir Nair',
      authorAvatarId: 'KN',
      status: 'Parked',
      roleNeeds: ['Backend'],
      commentCount: 0,
      attachmentCount: 0,
    },
  ],
  attachments: [
    { id: 'att-1', ideaId: 'idea-1', title: 'Competitor Analysis', type: 'link', url: 'https://example.com' },
    { id: 'att-2', ideaId: 'idea-2', title: 'ARKit Docs', type: 'note' },
  ],
  quotes: [
    { id: 'q-1', ideaId: 'idea-1', text: 'I always struggle to find people in my CS101 class to study with.', source: 'Freshman CS student' },
    { id: 'q-2', ideaId: 'idea-2', text: 'I got lost in the science building on my first day.', source: 'Transfer student' },
  ],
  talkedToRealUserCheckboxes: {
    'idea-1': true,
    'idea-2': false,
    'idea-3': false,
  },
  critiqueScores: [
    { ideaId: 'idea-1', rubricFit: 4, finishable: 5, differentiation: 3, userClarity: 5, teamSkillFit: 4, total: 21 },
    { ideaId: 'idea-2', rubricFit: 5, finishable: 2, differentiation: 5, userClarity: 4, teamSkillFit: 2, total: 18 },
    { ideaId: 'idea-3', rubricFit: 3, finishable: 5, differentiation: 2, userClarity: 5, teamSkillFit: 5, total: 20 },
  ],
  stressTests: [
    {
      ideaId: 'idea-1',
      questions: [
        { question: 'Does it solve a real problem?', passed: true },
        { question: 'Is the scope small enough?', passed: true },
        { question: 'Do we have the right skills?', passed: true },
        { question: 'Is it unique?', passed: false },
        { question: 'Are there blockers?', passed: true },
        { question: 'Can we demo it?', passed: true },
      ],
      overallBadge: 'Pass'
    },
    {
      ideaId: 'idea-2',
      questions: [
        { question: 'Does it solve a real problem?', passed: true },
        { question: 'Is the scope small enough?', passed: false },
        { question: 'Do we have the right skills?', passed: false },
        { question: 'Is it unique?', passed: true },
        { question: 'Are there blockers?', passed: false },
        { question: 'Can we demo it?', passed: true },
      ],
      overallBadge: 'Fail'
    },
  ],
  voteData: {
    votedCount: 2,
    totalVoters: 3,
    isClosed: false,
    results: [
      { ideaId: 'idea-1', votes: 2 },
      { ideaId: 'idea-2', votes: 0 },
      { ideaId: 'idea-3', votes: 1 },
    ]
  },
  lockedIdeaId: 'idea-1',
};

// ── Phase 3b: Plan & Docs Vault ──────────────────────────────────

import type { PlanStateResponse, PlanValidateResult, DocsVaultResponse } from '@/api/client';

export const planStateFixture: PlanStateResponse = {
  roomId: 'r-1',
  aiRestricted: false,
  isComplete: false,
};

export const planValidateSuccessFixture: PlanValidateResult = {
  success: true,
};

export const planValidateFailFixture: PlanValidateResult = {
  success: false,
  missingItems: ['Missing user roles', 'Missing offline fallback'],
  repairPrompt: 'Please update the plan to include definitions for user roles and detail an offline fallback mechanism.',
};

export const docsVaultFixture: DocsVaultResponse = {
  roomId: 'r-1',
  files: [
    { id: 'f1', name: 'PRD.md', version: 'v1', editedBy: 'Aarav Mehta', content: '# PRD\n\nThis is the Product Requirements Document.' },
    { id: 'f2', name: 'PROBLEM.md', version: 'v1', editedBy: 'Aarav Mehta', content: '# Problem\n\nDefining the core problem we are trying to solve.' },
    { id: 'f3', name: 'TECH_STACK.md', version: 'v1', editedBy: 'Aarav Mehta', content: '# Tech Stack\n\nFrontend: React\nBackend: Node.js' },
    { id: 'f4', name: 'PHASES.md', version: 'v1', editedBy: 'Aarav Mehta', content: '# Phases\n\n1. Design\n2. Implementation' },
    { id: 'f5', name: 'MVP.md', version: 'v1', editedBy: 'Aarav Mehta', content: '# MVP\n\nThe Minimum Viable Product.' },
    { id: 'f6', name: 'CUT_LIST.md', version: 'v1', editedBy: 'Aarav Mehta', content: '# Cut List\n\nFeatures we are skipping for the MVP.' },
    { id: 'f7', name: 'RISKS.md', version: 'v1', editedBy: 'Aarav Mehta', content: '# Risks\n\nTechnical and business risks.' },
    { id: 'f8', name: 'DEMO_SCRIPT.md', version: 'v1', editedBy: 'Aarav Mehta', content: '# Demo Script\n\nHow to present the product.' },
    { id: 'f9', name: 'DECISIONS.md', version: 'v1', editedBy: 'Aarav Mehta', content: '# Decisions\n\nKey architectural and product decisions made.' },
  ],
};

// 🧰 Phase 4a: Board (S14), Schedule (S15) & MVP Studio (S16) 🧰

import type { BoardResponse, ScheduleResponse, MvpStudioData } from '@/api/client';

export const boardResponseFixture: BoardResponse = {
  roomId: 'r-1',
  featureFreeze: false,
  tasks: [
    {
      id: 't-1',
      title: 'Set up repo and CI',
      description: 'Initialize GitHub repository and setup GitHub actions for CI/CD.',
      assigneeId: 'm-1', // Aarav Mehta
      role: 'Backend',
      phase: 'Prep',
      due: 'Fri 18:00',
      estimate: '1h',
      tags: ['Must-have'],
      checklist: [{ id: 'c-1', title: 'Create repo', isDone: true }, { id: 'c-2', title: 'Add Actions', isDone: false }],
      linkedPrs: ['main'],
      status: 'Building',
    },
    {
      id: 't-2',
      title: 'Attendance CSV importer',
      description: 'Script to import CSV attendance data into the database.',
      assigneeId: 'm-3', // Kabir Nair
      role: 'Frontend',
      phase: 'Build',
      due: 'Sat 10:00',
      estimate: '3h',
      tags: ['Frontend', 'Blocked'],
      checklist: [{ id: 'c-3', title: 'Parse CSV', isDone: false }, { id: 'c-4', title: 'Bulk insert', isDone: false }],
      linkedPrs: ['feat/csv-import'],
      status: 'Blocked',
    },
    {
      id: 't-3',
      title: 'Forecast endpoint (GET /api/v1/forecast)',
      description: 'ML model integration endpoint.',
      assigneeId: 'm-4', // Meera Iyer
      role: 'Backend',
      phase: 'Build',
      due: 'Sat 14:00',
      estimate: '4h',
      tags: ['Backend', 'Must-have'],
      checklist: [{ id: 'c-5', title: 'Model load', isDone: true }, { id: 'c-6', title: 'Endpoint route', isDone: true }],
      linkedPrs: ['feat/ml-forecast'],
      status: 'Done',
    },
    {
      id: 't-4',
      title: 'Record fallback demo video',
      description: 'Screen record the MVP flow as backup.',
      assigneeId: 'm-6', // Tanvi Kulkarni
      role: 'Pitch',
      phase: 'Ship',
      estimate: '2h',
      tags: ['Pitch', 'Must-have'],
      checklist: [{ id: 'c-7', title: 'Write script', isDone: false }, { id: 'c-8', title: 'Record', isDone: false }],
      linkedPrs: ['demo-safe'],
      status: 'Backlog',
    },
    {
      id: 't-5',
      title: 'Manager dashboard screen',
      description: 'Main UI for managers to view predictions.',
      assigneeId: 'm-2', // Ishita Rao
      role: 'Design',
      phase: 'Build',
      estimate: '5h',
      tags: ['Design', 'Frontend'],
      checklist: [{ id: 'c-9', title: 'Figma mock', isDone: true }, { id: 'c-10', title: 'React components', isDone: false }],
      linkedPrs: ['feat/dashboard'],
      status: 'Review',
    },
  ],
};

export const scheduleFixture: ScheduleResponse = {
  roomId: 'r-1',
  events: [
    {
      id: 'e-1',
      title: 'Kickoff',
      startTime: '2026-11-20T18:00:00',
      endTime: '2026-11-20T19:00:00',
      type: 'Checkpoint',
      phaseColorRef: 'bg-lav-100',
      attendees: ['m-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6'],
    },
    {
      id: 'e-2',
      title: 'Ideation',
      startTime: '2026-11-20T19:00:00',
      endTime: '2026-11-21T01:00:00',
      type: 'Phase Work',
      phaseColorRef: 'bg-peach-100',
      attendees: ['m-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6'],
    },
    {
      id: 'e-3',
      title: 'Sleep (Shift A)',
      startTime: '2026-11-21T01:00:00',
      endTime: '2026-11-21T06:00:00',
      type: 'Sleep',
      phaseColorRef: 'bg-surface-sunken',
      attendees: ['m-1', 'm-2', 'm-3'],
    },
    {
      id: 'e-4',
      title: 'Build Phase',
      startTime: '2026-11-21T06:00:00',
      endTime: '2026-11-21T22:00:00',
      type: 'Phase Work',
      phaseColorRef: 'bg-sky-100',
      attendees: ['m-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6'],
    },
    {
      id: 'e-5',
      title: 'Feature Freeze',
      startTime: '2026-11-21T22:00:00',
      endTime: '2026-11-21T22:00:00',
      type: 'Checkpoint',
      phaseColorRef: 'bg-coral-100',
      attendees: ['m-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6'],
    },
  ],
};

export const mvpStudioFixture: MvpStudioData = {
  roomId: 'r-1',
  identitySentence: 'MessMeter is a tool that tells mess managers how many meals to cook tomorrow, for college hostels.',
  coreFlow: [
    { stepNumber: 1, description: 'Manager opens dashboard' },
    { stepNumber: 2, description: 'System predicts demand for tomorrow' },
    { stepNumber: 3, description: 'Manager adjusts numbers and locks' },
  ],
  wowMoment: 'Seeing the ML model predict the exact surplus from last week accurately.',
  differentiation: 'We use historical attendance data integrated directly with hostel biometric systems.',
  breaksFirst: 'The CSV parser will fail on malformed historical data from the old biometric system.',
  realityLedger: [
    { id: 'rl-1', name: 'Biometric Auth Integration', status: 'Mocked' },
    { id: 'rl-2', name: 'Demand ML Model', status: 'Built this weekend' },
    { id: 'rl-3', name: 'React Frontend Dashboard', status: 'Built this weekend' },
    { id: 'rl-4', name: 'Database Hosting', status: 'Library / API' },
    { id: 'rl-5', name: 'Push Notifications', status: 'Planned' },
  ],
  healthChecklist: [
    { id: 'hc-1', question: 'Does the core flow work end-to-end?', isPassed: true },
    { id: 'hc-2', question: 'Is the wow moment functional?', isPassed: false },
    { id: 'hc-3', question: 'Is the app deployed and accessible?', isPassed: true },
    { id: 'hc-4', question: 'Have you practiced the demo script?', isPassed: false },
    { id: 'hc-5', question: 'Is there a fallback recorded?', isPassed: false },
  ],
};

// 🧰 Phase 4b: GitHub Hub (S17), API Hub (S18) & Diagram Studio (S19) 🧰

import type { GithubResponse, ApiHubResponse, DiagramStudioResponse } from '@/api/client';

export const githubFixture: GithubResponse = {
  roomId: 'r-1',
  isConnected: true,
  repoName: 'hackathon-os/mess-meter',
  branchesCount: 8,
  openPrsCount: 3,
  lastCommitTime: '10m ago',
  commitsSinceStart: 42,
  preEventRulePassed: true,
  branches: [
    { name: 'main', purpose: 'Production branch', ownerId: 'm-1', ownerName: 'Aarav Mehta', ahead: 0, behind: 0, prStatus: 'None', roleTag: 'main', lastCommitTime: '1h ago' },
    { name: 'demo-safe', purpose: 'Stable demo fallback', ownerId: 'm-6', ownerName: 'Tanvi Kulkarni', ahead: 2, behind: 5, prStatus: 'Open', roleTag: 'demo-safe', lastCommitTime: '2h ago' },
    { name: 'feat/ml-forecast', purpose: 'ML model integration', ownerId: 'm-4', ownerName: 'Meera Iyer', ahead: 12, behind: 2, prStatus: 'Merged', roleTag: 'experiment', lastCommitTime: '10m ago' },
    { name: 'feat/dashboard', purpose: 'Manager UI', ownerId: 'm-2', ownerName: 'Ishita Rao', ahead: 4, behind: 1, prStatus: 'Draft', roleTag: 'experiment', lastCommitTime: '45m ago' },
  ],
  healthChecklist: [
    { id: 'gc-1', label: 'README updated', isPassed: true },
    { id: 'gc-2', label: 'Run instructions', isPassed: true },
    { id: 'gc-3', label: '.env.example exists', isPassed: true },
    { id: 'gc-4', label: 'No secrets committed', isPassed: true },
    { id: 'gc-5', label: 'License added', isPassed: false },
    { id: 'gc-6', label: 'Deployed link', isPassed: true },
    { id: 'gc-7', label: 'Screenshots in repo', isPassed: false },
  ],
  commitHeatmap: [
    { date: '2026-11-20', count: 12 },
    { date: '2026-11-21', count: 30 },
  ],
  historyHealthWarning: false,
};

export const apiHubFixture: ApiHubResponse = {
  roomId: 'r-1',
  endpoints: [
    {
      id: 'api-1', name: 'Hostel Biometric Auth', baseUrl: 'https://auth.university.edu/api', auth: 'OAuth2', rateLimit: '100/min', cost: 'Free', keyLocation: 'env: UNI_AUTH_SECRET', status: 'Live', fallbackType: 'Mocked', isExternal: true
    },
    {
      id: 'api-2', name: 'Weather Forecast API', baseUrl: 'https://api.weather.gov', auth: 'API Key', rateLimit: '50/min', cost: '$0.00', keyLocation: 'env: WEATHER_KEY', status: 'Live', fallbackType: 'Cached', isExternal: true
    },
    {
      id: 'api-3', name: 'Prediction Service', baseUrl: '/api/v1/forecast', auth: 'Bearer Token', rateLimit: 'Internal', cost: 'N/A', keyLocation: 'Internal', status: 'Live', fallbackType: 'None', isExternal: false,
      method: 'GET', path: '/api/v1/forecast?date=YYYY-MM-DD', requestExample: 'curl -X GET /api/v1/forecast?date=2026-11-22', responseExample: '{\n  "predicted_meals": 450,\n  "confidence": 0.92\n}', tags: ['ML', 'Core']
    },
    {
      id: 'api-4', name: 'Update Attendance', baseUrl: '/api/v1/attendance', auth: 'Bearer Token', rateLimit: 'Internal', cost: 'N/A', keyLocation: 'Internal', status: 'Mocked', fallbackType: 'None', isExternal: false,
      method: 'POST', path: '/api/v1/attendance', requestExample: 'curl -X POST /api/v1/attendance -d \'{"count": 420}\'', responseExample: '{\n  "success": true\n}', tags: ['Data']
    }
  ]
};

export const diagramStudioFixture: DiagramStudioResponse = {
  roomId: 'r-1',
  templates: [
    { id: 'tpl-1', name: 'Architecture', icon: 'server', code: 'graph TD\n  Client-->Server\n  Server-->DB' },
    { id: 'tpl-2', name: 'User Flow', icon: 'users', code: 'graph LR\n  Login-->Dashboard\n  Dashboard-->Checkout' },
    { id: 'tpl-3', name: 'Sequence', icon: 'git-commit', code: 'sequenceDiagram\n  Alice->>Bob: Hello Bob, how are you?\n  Bob-->>Alice: Fine, thanks!' },
    { id: 'tpl-4', name: 'Entity Relationship', icon: 'database', code: 'erDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ LINE-ITEM : contains' },
    { id: 'tpl-5', name: 'Roadmap', icon: 'map', code: 'gantt\n  title Project Roadmap\n  section MVP\n  Design :a1, 2026-11-20, 10h\n  Build :after a1, 20h' },
  ]
};

// ── Phase 5a: Pitch Studio, Demo & Video Studio, Submission Center ──

import type {
  PitchDeckResponse, RehearseResponse, QaResponse,
  DemoResponse, SubmissionResponse,
} from '@/api/client';

export const pitchDeckFixture: PitchDeckResponse = {
  _fixture: 'Slide titles follow the template named in ideation F12. Guide questions for s1, s2, s4 are from design.md and ideation F12; s3 and s5 guides, slide content, coverage and lint results are invented.',
  slides: [
    { id: 's1', order: 1, title: 'Problem',     guide: 'who suffers, and how often?',          content: 'College mess managers waste 30% of food daily because they cook for peak capacity, not actual demand.' },
    { id: 's2', order: 2, title: 'Solution',    guide: 'what does it do, in one sentence?',    content: 'MessMeter forecasts meal demand using attendance data so managers cook the right amount.' },
    { id: 's3', order: 3, title: 'Demo',        guide: 'FIXTURE: what does the judge see first?', content: 'Live walkthrough of the manager dashboard showing tomorrow\'s predicted count.' },
    { id: 's4', order: 4, title: 'Impact',      guide: 'what number changes?',                 content: '30% food waste → under 10% in pilot hostel. Saves ₹4.2L per semester.' },
    { id: 's5', order: 5, title: "What's next", guide: 'FIXTURE: what happens after the event?', content: 'Expand to 3 hostels, add dietary preference tracking, partner with hostel admin software.' },
  ],
  coverage: {
    innovation: ['s2'], feasibility: ['s3'], impact: ['s4'],
    technical_depth: [], ux: ['s3'], presentation: ['s1', 's2'],
  },
  lint: [
    { type: 'too_much_text', slideId: 's3' },
    { type: 'no_impact_number', slideId: null },
  ],
};

export const rehearseFixture: RehearseResponse = {
  _fixture: 'targetSeconds = 180 assumes the live 3-minute pitch example in ideation F12. Runs and role assignments are invented.',
  targetSeconds: 180,
  runs: [
    { id: 'r1', durationSeconds: 196 },
    { id: 'r2', durationSeconds: 172 },
    { id: 'r3', durationSeconds: 185 },
  ],
  roles: [
    { role: 'Presenter',     memberId: 'tanvi-kulkarni', name: 'Tanvi Kulkarni' },
    { role: 'Demo operator', memberId: 'rohan-das',      name: 'Rohan Das' },
  ],
};

export const qaFixture: QaResponse = {
  _fixture: 'Question texts are examples from ideation F12. Statuses are invented. Module names reuse seed task names.',
  questions: [
    { id: 'q1', text: 'Who exactly is this for?',           status: 'answered' },
    { id: 'q2', text: 'What did you build this weekend?',   status: 'needs_work' },
    { id: 'q3', text: 'What breaks first?',                 status: 'needs_work' },
  ],
  codeDefense: [
    { id: 'm1', module: 'Attendance CSV importer' },
    { id: 'm2', module: 'Forecast endpoint (GET /api/v1/forecast)' },
    { id: 'm3', module: 'Manager dashboard screen' },
  ],
};

export const demoFixture: DemoResponse = {
  _fixture: 'Beat labels are from design.md. Durations, beat text, shots, rule results and tool cost/license values are invented or copied from ideation F13 examples. Total 108 s is under the 120 s limit.',
  videoMaxSeconds: 120,
  beats: [
    { id: 'hook',       label: 'Hook',        seconds: 10, text: 'MessMeter tells mess managers how many meals to cook tomorrow.' },
    { id: 'problem',    label: 'Problem',     seconds: 15, text: 'FIXTURE' },
    { id: 'core_flow',  label: 'Core flow',   seconds: 45, text: 'FIXTURE' },
    { id: 'wow_moment', label: 'Wow moment',  seconds: 20, text: 'FIXTURE' },
    { id: 'impact',     label: 'Impact',      seconds: 12, text: 'FIXTURE' },
    { id: 'whats_next', label: "What's next", seconds: 6,  text: 'FIXTURE' },
  ],
  shots: [
    { id: 'sh1', shot: 1, screen: 'Manager dashboard screen', narration: 'FIXTURE', lengthSeconds: 10 },
    { id: 'sh2', shot: 2, screen: 'Attendance CSV importer',  narration: 'FIXTURE', lengthSeconds: 30 },
    { id: 'sh3', shot: 3, screen: 'Manager dashboard screen', narration: 'FIXTURE', lengthSeconds: 45 },
    { id: 'sh4', shot: 4, screen: 'Manager dashboard screen', narration: 'FIXTURE', lengthSeconds: 23 },
  ],
  insurance: [
    { id: 'offline',  label: 'Offline works',              done: true },
    { id: 'cached',   label: 'Cached responses',           done: true },
    { id: 'fallback', label: 'Fallback video recorded',    done: false },
    { id: 'hardware', label: 'Spare charger and hotspot',  done: false },
  ],
  videoRules: [
    { field: 'max_length',  required: '2:00', actual: '1:48',        result: 'pass' },
    { field: 'public_link', required: 'Yes',  actual: 'Not checked', result: 'unknown' },
    { field: 'captions',    required: 'Yes',  actual: 'None found',  result: 'fail' },
  ],
  tools: [
    { name: 'Recordly',  use: 'Polished screen recording',              category: 'recording', cost: 'Free',     license: 'Open source', lastChecked: '2026-09-20', verified: true },
    { name: 'RepoClip',  use: 'Turns a GitHub repo into a promo video', category: 'video',     cost: 'Freemium', license: 'Proprietary', lastChecked: '2026-09-20', verified: true },
    { name: 'Remotion',  use: 'Build videos with code',                 category: 'video',     cost: null,       license: 'Special license; company license may be required', lastChecked: '2026-09-20', verified: true },
    { name: 'Brag',      use: 'FIXTURE',                                category: 'video',     cost: null,       license: null,          lastChecked: '2026-09-20', verified: false },
  ],
};

export const submissionFixture: SubmissionResponse = {
  _fixture: 'Item labels stand in for Brief-sourced rule text. The item set, grouping, counts, URLs and draft text are invented. 5 of 9 rows are done.',
  deadlineOffset: 'PT2H14M30S',
  items: [
    { id: 'i1', group: 'required',     category: 'video',                 label: 'Demo video uploaded (max 2 minutes)',                done: true,  sourceRuleId: 'rule-video',   ruleConfirmed: true },
    { id: 'i2', group: 'required',     category: 'repo_link',             label: 'Repository link added',                              done: true,  sourceRuleId: 'rule-repo',    ruleConfirmed: true },
    { id: 'i3', group: 'required',     category: 'correct_track',         label: 'Correct track selected',                             done: true,  sourceRuleId: 'rule-track',   ruleConfirmed: true },
    { id: 'i4', group: 'required',     category: 'prizes',                label: 'Prizes selected',                                    done: false, sourceRuleId: 'rule-prizes',  ruleConfirmed: false },
    { id: 'i5', group: 'required',     category: 'forms',                 label: 'Forms filled',                                       done: false, sourceRuleId: 'rule-forms',   ruleConfirmed: true },
    { id: 'i6', group: 'team',         category: 'teammates_registered',  label: 'All members registered on the submission platform',  done: true,  sourceRuleId: 'rule-members', ruleConfirmed: true },
    { id: 'i7', group: 'verification', category: 'links_open',            label: 'Links open',                                         done: false, sourceRuleId: null,           ruleConfirmed: true },
    { id: 'i8', group: 'verification', category: 'video_public',          label: 'Video is public',                                    done: true,  sourceRuleId: null,           ruleConfirmed: true },
    { id: 'i9', group: 'verification', category: 'repo_public',           label: 'Repo is public',                                     done: false, sourceRuleId: null,           ruleConfirmed: true },
  ],
  draft: {
    whatItDoes:   'MessMeter is a tool that tells mess managers how many meals to cook tomorrow, for college hostels.',
    whyItMatters: 'Reduce food waste in college messes using daily demand forecasts.',
    howWeBuiltIt: 'Attendance CSV importer, a forecast endpoint (GET /api/v1/forecast), and a manager dashboard screen.',
    challenges:   'FIXTURE',
    whatsNext:    'FIXTURE',
  },
  linkCheck: [
    { url: 'https://github.com/team-kaveri/messmeter',   status: 'failing',  fixTarget: 'FIXTURE' },
    { url: 'https://video.example/messmeter-demo',       status: 'verified', fixTarget: null },
  ],
};
