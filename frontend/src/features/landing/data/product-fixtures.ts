import { REHEARSAL } from './stage-act';

// Fictional data for the hero product tour replicas.
// Project: Club budget tracker at Campus Build Sprint 2026.
// Team: Aarav (leader), Meera, Kabir, Isha.

export type FixtureMember = {
  id: string;
  name: string;
  initials: string;
  role: 'leader' | 'member';
  color: string;
};

export const FIXTURE_TEAM: FixtureMember[] = [
  { id: 'aarav', name: 'Aarav', initials: 'A', role: 'leader', color: 'var(--pastel-lavender)' },
  { id: 'meera', name: 'Meera', initials: 'M', role: 'member', color: 'var(--pastel-green)' },
  { id: 'kabir', name: 'Kabir', initials: 'K', role: 'member', color: 'var(--pastel-sun)' },
  { id: 'isha', name: 'Isha', initials: 'I', role: 'member', color: 'var(--pastel-pink)' },
];

export const SHELL_FIXTURE = {
  eventName: 'Campus Build Sprint 2026',
  roomName: 'Club budget tracker',
  subtitle: 'A tool that helps small campus clubs track event budgets',
  clock: 'T–35:40:00',
  stage: 'Planning',
  members: FIXTURE_TEAM,
  readinessPct: 88,
} as const;

export type BriefRubricItem = {
  criterion: string;
  weight: number;
};

export type BriefExtractedField = {
  id: string;
  key: string;
  label: string;
  value: string;
  confirmed: boolean;
};

export const BRIEF_FIXTURE = {
  title: 'Hackathon Brief',
  status: 'CONFIRMED',
  confirmedCount: 8,
  totalCount: 8,
  confirmedText: '8 of 8 rules confirmed by the leader',
  sourceType: 'pasted text',
  rawSnippet:
    'Campus Build Sprint 2026 · Problem Statement 07. Build a tool that helps small campus clubs track event budgets. Teams of 2–4. Judging: Impact 30%, Feasibility 30%, Innovation 20%, Presentation 20%. Submission is due Sunday 6:00 PM IST with a 3-minute demo video and a public repo link. No paid APIs. AI tools are allowed with disclosure. Code committed before Friday 9:00 AM disqualifies the team.',
  problemStatement: 'Build a tool that helps small campus clubs track event budgets.',
  targetAudience: 'Campus clubs, treasurers and student organizations',
  rubric: [
    { criterion: 'Impact', weight: 30 },
    { criterion: 'Feasibility', weight: 30 },
    { criterion: 'Innovation', weight: 20 },
    { criterion: 'Presentation', weight: 20 },
  ] as BriefRubricItem[],
  deadlines: {
    start: 'Friday 9:00 AM IST',
    submission: 'Sunday 6:00 PM IST',
  },
  eligibility: 'Teams of 2 to 4 members',
  techRules: 'No paid APIs',
  aiPolicy: 'Allowed with disclosure',
  deliverables: ['3-minute demo video', 'Public repo link'],
  startRule: 'No commits before Friday 9:00 AM',
} as const;

export type PlanStep = {
  id: number;
  title: string;
  validated: boolean;
  tag: string;
};

export type PlanDoc = {
  name: string;
  version: number;
  status: 'ok' | 'healthy';
  description: string;
};

export const PLAN_FIXTURE = {
  title: 'Plan',
  stepsDone: 4,
  stepsTotal: 4,
  statusLabel: 'Plan locked & verified',
  summaryText: 'Sprint specifications have been confirmed for execution.',
  steps: [
    { id: 1, title: 'PRD and MVP', validated: true, tag: 'Validated' },
    { id: 2, title: 'Tech stack and architecture', validated: true, tag: 'Validated' },
    { id: 3, title: 'Phases and design', validated: true, tag: 'Validated' },
    { id: 4, title: 'Demo and Q&A', validated: true, tag: 'Validated' },
  ] as PlanStep[],
  docsCount: 9,
  phasesCount: 5,
  tasksCount: 38,
  docs: [
    { name: 'PRD.md', version: 1, status: 'ok', description: 'Product requirements & problem framing' },
    { name: 'PROBLEM.md', version: 1, status: 'ok', description: 'User pain points & campus persona' },
    { name: 'TECH_STACK.md', version: 1, status: 'ok', description: 'Stack selections & free APIs only' },
    { name: 'PHASES.md', version: 1, status: 'ok', description: '5 sprint build phases' },
    { name: 'MVP.md', version: 1, status: 'ok', description: 'Core flow boundaries & cut list' },
    { name: 'CUT_LIST.md', version: 1, status: 'ok', description: 'Deferred features & mock ledger' },
    { name: 'RISKS.md', version: 1, status: 'ok', description: 'OCR accuracy fallbacks & mitigation' },
    { name: 'DEMO_SCRIPT.md', version: 1, status: 'ok', description: '3-minute run of show' },
    { name: 'DECISIONS.md', version: 1, status: 'ok', description: 'Architecture log & tradeoffs' },
  ] as PlanDoc[],
} as const;

export type BoardTask = {
  id: string;
  key: string;
  title: string;
  tag: string;
  assignee: FixtureMember;
  status: 'todo' | 'inprogress' | 'done';
  blocked?: boolean;
  blockedReason?: string;
  waitsFor?: string;
  done?: boolean;
  confirmed?: boolean;
  estimate: string;
  priority: 'high' | 'medium' | 'low';
};

export const BOARD_FIXTURE = {
  title: 'Board',
  phase: 'Phase 1: Core Flow',
  lanes: [
    {
      id: 'todo',
      title: 'To do',
      tasks: [
        {
          id: 'b-1',
          key: 'OS-11',
          title: 'Event cost model',
          tag: 'backend',
          assignee: FIXTURE_TEAM[2], // Kabir
          status: 'todo',
          estimate: '45m',
          priority: 'medium',
        },
        {
          id: 'b-2',
          key: 'OS-14',
          title: 'Role permissions',
          tag: 'backend',
          assignee: FIXTURE_TEAM[3], // Isha
          status: 'todo',
          waitsFor: 'Receipt upload API',
          estimate: '1h',
          priority: 'medium',
        },
      ] as BoardTask[],
    },
    {
      id: 'inprogress',
      title: 'In progress',
      tasks: [
        {
          id: 'b-3',
          key: 'OS-08',
          title: 'Receipt upload API',
          tag: 'backend',
          assignee: FIXTURE_TEAM[1], // Meera
          status: 'inprogress',
          blocked: true,
          blockedReason: 'Blocked by OCR rate limits',
          estimate: '2h',
          priority: 'high',
        },
        {
          id: 'b-4',
          key: 'OS-09',
          title: 'Budget dashboard layout',
          tag: 'frontend',
          assignee: FIXTURE_TEAM[0], // Aarav
          status: 'inprogress',
          estimate: '1h 30m',
          priority: 'high',
        },
      ] as BoardTask[],
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [
        {
          id: 'b-5',
          key: 'OS-01',
          title: 'Project setup',
          tag: 'setup',
          assignee: FIXTURE_TEAM[0], // Aarav
          status: 'done',
          done: true,
          confirmed: true,
          estimate: '30m',
          priority: 'high',
        },
        {
          id: 'b-6',
          key: 'OS-02',
          title: 'Sample data seeds',
          tag: 'backend',
          assignee: FIXTURE_TEAM[2], // Kabir
          status: 'done',
          done: true,
          confirmed: true,
          estimate: '45m',
          priority: 'medium',
        },
      ] as BoardTask[],
    },
  ],
} as const;

export const PRESENT_FIXTURE = {
  title: 'Pitch kit',
  subtitle: 'Demo, pitch and Q&A in one place',
  readinessPct: 88,
  rehearsalLabel: 'Pitch rehearsal',
  rehearsalSub: 'Run 3 of 3 rehearsals',
  lines: REHEARSAL.lines,
  currentLineIndex: 1, // 'Receipts pile up, budgets drift, and nobody knows the real number.'
  segments: REHEARSAL.segments,
  readout: REHEARSAL.readout,
  targetTime: '3:00',
  audioBars: 32,
  audioLevel: 0.85,
  judgeQuestion: {
    question: 'What did you build this weekend, and what is mocked?',
    difficulty: 2,
    difficultyMax: 3,
    status: 'Answer ready',
    why: 'Why asked: judges check that the demo matches the build.',
  },
} as const;

export type EventTemplateFixture = {
  id: string;
  name: string;
  description: string;
  durationHours: number;
  teamMin: number;
  teamMax: number;
};

export const SETUP_FIXTURE = {
  title: 'Create Hackathon Room',
  subtitle: 'Set up your shared workspace, invite teammates, and start building.',
  roomName: 'Club budget tracker',
  eventName: 'Campus Build Sprint 2026',
  teamSize: '4',
  description: 'Campus Build Sprint 2026 · Problem Statement 07 · Team of 4',
  selectedTemplateId: 'sih-36h',
  scheduledStart: true,
  kickoffTime: 'Friday 9:00 AM IST',
  templates: [
    {
      id: 'sih-36h',
      name: 'SIH-Style',
      description: '36-hour non-stop national hackathon',
      durationHours: 36,
      teamMin: 4,
      teamMax: 6,
    },
    {
      id: 'weekend-48h',
      name: 'Weekend Sprint',
      description: 'Classic 48h weekend competition',
      durationHours: 48,
      teamMin: 2,
      teamMax: 4,
    },
    {
      id: 'fast-24h',
      name: '24h Hackathon',
      description: 'Rapid 1-day build and pitch',
      durationHours: 24,
      teamMin: 2,
      teamMax: 4,
    },
    {
      id: 'global-72h',
      name: 'Global Online',
      description: 'Multi-timezone asynchronous build',
      durationHours: 72,
      teamMin: 2,
      teamMax: 5,
    },
    {
      id: 'mini-12h',
      name: 'Mini Hack',
      description: 'Half-day sprint or workshop',
      durationHours: 12,
      teamMin: 1,
      teamMax: 3,
    },
    {
      id: 'internal-corp',
      name: 'Company Hack',
      description: 'Internal team hackathon',
      durationHours: 24,
      teamMin: 3,
      teamMax: 6,
    },
  ] as EventTemplateFixture[],
} as const;

export type TeamMemberFixture = {
  id: string;
  username: string;
  displayName: string;
  initials: string;
  isLeader: boolean;
  roleTags: string[];
  joinedText: string;
  isOnline: boolean;
  isMe: boolean;
  color: string;
};

export const TEAM_FIXTURE = {
  title: 'Team',
  filledSeats: 4,
  roomCap: 6,
  members: [
    {
      id: 'aarav',
      username: 'aarav',
      displayName: 'Aarav',
      initials: 'A',
      isLeader: true,
      roleTags: ['Backend'],
      joinedText: 'Joined 2d ago',
      isOnline: true,
      isMe: true,
      color: 'var(--pastel-lavender)',
    },
    {
      id: 'meera',
      username: 'meera',
      displayName: 'Meera',
      initials: 'M',
      isLeader: false,
      roleTags: ['Frontend'],
      joinedText: 'Joined 2d ago',
      isOnline: true,
      isMe: false,
      color: 'var(--pastel-green)',
    },
    {
      id: 'kabir',
      username: 'kabir',
      displayName: 'Kabir',
      initials: 'K',
      isLeader: false,
      roleTags: ['ML / AI', 'Data'],
      joinedText: 'Joined 1d ago',
      isOnline: false,
      isMe: false,
      color: 'var(--pastel-sun)',
    },
    {
      id: 'isha',
      username: 'isha',
      displayName: 'Isha',
      initials: 'I',
      isLeader: false,
      roleTags: ['Design', 'Presenter'],
      joinedText: 'Joined 1d ago',
      isOnline: true,
      isMe: false,
      color: 'var(--pastel-pink)',
    },
  ] as TeamMemberFixture[],
  openSeatsCount: 2,
  allRoles: [
    'Frontend',
    'Backend',
    'ML / AI',
    'Design',
    'Presenter',
    'Domain expert',
    'QA / Demo operator',
  ] as const,
  coveredRoles: ['Frontend', 'Backend', 'ML / AI', 'Design', 'Presenter'] as const,
  missingRoles: ['Domain expert', 'QA / Demo operator'] as const,
  skillSummary: 'Covered 5 of 7. No one on Domain expert or QA / Demo operator yet.',
} as const;

export type IdeateIdeaFixture = {
  id: string;
  title: string;
  identity: string;
  votes: number;
  votePct: number;
  badge: 'Pass' | 'Fail' | 'Risky';
  isChosen: boolean;
};

export type StressRowFixture = {
  label: string;
  score: number;
  verdict: 'strong' | 'risky' | 'low';
  passed: boolean;
  note: string;
};

export const IDEATE_FIXTURE = {
  title: 'Ideate',
  subtitle: 'Silent brainstorming, anonymous voting, and AI stress tests.',
  silentChip: 'Silent round · revealed',
  problemStatement: 'Build a tool that helps small campus clubs track event budgets.',
  totalVoters: 4,
  votedCount: 4,
  ideas: [
    {
      id: 'receipt',
      title: 'Receipt-to-budget',
      identity: 'A tool that turns club receipts into a live event budget.',
      votes: 3,
      votePct: 75,
      badge: 'Pass',
      isChosen: true,
    },
    {
      id: 'split',
      title: 'Event cost splitter',
      identity: 'A tool that splits event costs fairly across club members.',
      votes: 2,
      votePct: 50,
      badge: 'Pass',
      isChosen: false,
    },
    {
      id: 'bot',
      title: 'Club treasurer bot',
      identity: 'A chat bot that answers budget questions for club treasurers.',
      votes: 1,
      votePct: 25,
      badge: 'Risky',
      isChosen: false,
    },
  ] as IdeateIdeaFixture[],
  stressTest: {
    selectedIdeaId: 'receipt',
    selectedIdeaTitle: 'Receipt-to-budget',
    overallBadge: 'Pass',
    overallVerdict: 'strong' as const,
    rows: [
      {
        label: 'Rubric fit',
        score: 82,
        verdict: 'strong',
        passed: true,
        note: 'Matches 4 of 4 rubric dimensions directly',
      },
      {
        label: 'Finishable in the hours left',
        score: 46,
        verdict: 'risky',
        passed: false,
        note: 'Tighter scope recommended for 36h sprint',
      },
      {
        label: 'Technically feasible',
        score: 55,
        verdict: 'risky',
        passed: false,
        note: 'OCR parser needs sample fallback seeds',
      },
      {
        label: 'Different from an AI wrapper',
        score: 72,
        verdict: 'strong',
        passed: true,
        note: 'Live reconciliation ledger distinguishes it',
      },
    ] as StressRowFixture[],
  },
  leaderLockNote: 'Leader only: @aarav',
} as const;

export type ChecklistItemFixture = {
  id: string;
  label: string;
  checked: boolean;
};

export type DeliverableFixture = {
  label: string;
  value: string;
};

export const LAUNCH_FIXTURE = {
  title: 'Have you submitted?',
  subtitle: 'Submit your project on the event’s own platform. When that’s done, mark it here to close out this room.',
  countdownText: '03:12:47',
  countdownSubtext: 'Submissions close in 3h 12m',
  deadlineAt: 'Sunday 6:00 PM IST',
  leaderHandle: '@aarav',
  isLeader: true,
  buttonLabel: "Yes, we've submitted",
  checklist: [
    { id: 'video', label: '3-minute demo video recorded and uploaded', checked: true },
    { id: 'repo', label: 'Public GitHub repository link verified', checked: true },
    { id: 'readme', label: 'README and local setup instructions written', checked: true },
    { id: 'rubric', label: 'Rubric coverage self-check passed (4 of 4)', checked: true },
    { id: 'deploy', label: 'Live preview deployment operational', checked: true },
  ] as ChecklistItemFixture[],
  deliverables: [
    { label: 'Demo video', value: '3 minutes max (YouTube / Loom)' },
    { label: 'Public repo', value: 'github.com/campus-sprint/budget-tracker' },
    { label: 'Slide deck', value: '10 slides (PDF)' },
  ] as DeliverableFixture[],
} as const;

export const JUDGE_PAGE = {
  title: 'Pitch kit',
  station: 'Q&A',
  subtitle: 'Anticipated judge questions and defence cards',
  progressText: '3 of 3 solid',
  questions: [
    {
      id: 'q1',
      question: 'What did you build this weekend, and what is mocked?',
      difficulty: 2,
      difficultyMax: 3,
      why: 'Judges check that the demo matches the build.',
      risk: 'Receipt scanner is mocked.',
      answerReady: true,
      answer: 'Our core budget ledger, event planning workflow, and member invite system are fully functional on SQLite. The receipt OCR scanner and export to Google Sheets are mocked with fixtures for this demo.',
      followup: 'What happens when a judge uploads a non-standard receipt?',
      counter: 'We validate file format at upload and prompt for manual entry if parsing confidence is low.',
      proof: 'DEMO_SCRIPT.md · Board tasks',
      criterion: 'Technical Execution',
      category: 'Implementation',
      source: 'AI draft',
      words: 34,
      speakingTimeSec: 16,
    },
    {
      id: 'q2',
      question: 'How does the receipt scanner cope with blurry photos?',
      difficulty: 3,
      difficultyMax: 3,
      why: 'Tests error handling and user edge cases.',
      risk: 'OCR confidence below 60% falls back to manual entry.',
      answerReady: true,
      criterion: 'User Experience',
      category: 'Robustness',
      source: 'AI draft',
    },
    {
      id: 'q3',
      question: 'What would you build next with another week?',
      difficulty: 1,
      difficultyMax: 3,
      why: 'Judges look for roadmap vision and prioritisation.',
      risk: 'Real bank API integration was cut.',
      answerReady: true,
      criterion: 'Vision',
      category: 'Roadmap',
      source: 'AI draft',
    },
  ],
} as const;

export const READINESS_PAGE = {
  title: 'Readiness',
  subtitle: 'One view of where the team stands before the judges arrive.',
  rings: [
    { id: 'rubric', label: 'Rubric coverage', valueText: '100%', progress: 1.0 },
    { id: 'mvp', label: 'MVP health', valueText: '92%', progress: 0.92 },
    { id: 'demo', label: 'Demo rehearsal', valueText: '100%', progress: 1.0 },
    { id: 'deck', label: 'Pitch deck', valueText: '100%', progress: 1.0 },
    { id: 'checklist', label: 'Submission checklist', valueText: '100%', progress: 1.0 },
    { id: 'fallback', label: 'Fallback insurance', valueText: '76%', progress: 0.76 },
  ],
  weakSpots: [
    {
      id: 'w1',
      code: 'FB',
      title: 'Fallback insurance: add a 60-second backup video.',
      owner: 'Meera',
      severity: 'high' as const,
      percent: 76,
    },
    {
      id: 'w2',
      code: 'MH',
      title: 'MVP health: 1 task waiting on dependency.',
      owner: 'Alex',
      severity: 'medium' as const,
      percent: 92,
    },
    {
      id: 'w3',
      code: 'OD',
      title: 'Offline demo: pre-cache sample receipt images.',
      owner: 'Sam',
      severity: 'low' as const,
      percent: 85,
    },
  ],
  simulator: {
    disclaimer: 'Estimate, not a prediction',
    scores: [
      { name: 'Technical Execution', score: 9, max: 10 },
      { name: 'Originality & Innovation', score: 8.5, max: 10 },
      { name: 'Design & Usability', score: 9, max: 10 },
      { name: 'Business & Impact', score: 8, max: 10 },
    ],
    likelyQuestions: [
      'What did you build this weekend, and what is mocked?',
      'How does the receipt scanner cope with blurry photos?',
      'What happens if the database connection drops during judging?',
    ],
  },
} as const;


