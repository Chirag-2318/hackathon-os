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
