/**
 * roomMock.ts — Single source of truth for Campus Build Sprint 2026 room data.
 * Both Home and RoomOverview import from here for roster, clock, and checkpoints.
 *
 * Event timeline:
 *   Start:  Wed 7 Oct 7:00 AM IST
 *   End:    Fri 9 Oct 7:00 AM IST   (48h total)
 *   Now:    Thu 8 Oct 10:00 PM IST  = hour 39 of 48
 *
 * Phase boundaries (fractions of 48h):
 *   Plan   0–25%  → 0–12h
 *   Build  25–60% → 12–28.8h
 *   Freeze 60–70% → 28.8–33.6h
 *   Polish 70–85% → 33.6–40.8h    ← current (hour 39 of 48 = 81.25%)
 *   Submit 85–100%→ 40.8–48h
 */

export type PhaseType = 'Plan' | 'Build' | 'Freeze' | 'Polish' | 'Submit';
export type MemberStatus = 'working' | 'idle' | 'blocked';
export type MemberRole = 'Leader' | 'Developer' | 'Designer' | 'Member';
export type SkillArea = 'Build' | 'Design' | 'AI' | 'Domain' | 'Presentation';

// ─── DERIVED CONSTANTS ────────────────────────────────────────────────────────
const EVENT_START_MS = new Date('2026-10-07T07:00:00+05:30').getTime();
const EVENT_DURATION_HOURS = 48;
const EVENT_END_MS = EVENT_START_MS + EVENT_DURATION_HOURS * 3600 * 1000;

// Simulated "now" = Thu 8 Oct 10:00 PM IST = hour 39
export const MOCK_NOW_MS = new Date('2026-10-08T22:00:00+05:30').getTime();
export const ELAPSED_HOURS = 39;
export const OVERALL_ELAPSED_PCT = (ELAPSED_HOURS / EVENT_DURATION_HOURS) * 100; // 81.25%

export const PHASES: { label: PhaseType; widthPct: number; startH: number; endH: number }[] = [
  { label: 'Plan',   widthPct: 25, startH: 0,    endH: 12   },
  { label: 'Build',  widthPct: 35, startH: 12,   endH: 28.8 },
  { label: 'Freeze', widthPct: 10, startH: 28.8, endH: 33.6 },
  { label: 'Polish', widthPct: 15, startH: 33.6, endH: 40.8 },
  { label: 'Submit', widthPct: 15, startH: 40.8, endH: 48   },
];

export const CURRENT_PHASE: PhaseType = 'Polish';
export const CURRENT_PHASE_IDX = PHASES.findIndex(p => p.label === CURRENT_PHASE); // 3

// How far we are inside Polish: (39 - 33.6) / (40.8 - 33.6) = 5.4 / 7.2 = 75%
const polishPhase = PHASES[CURRENT_PHASE_IDX];
export const PHASE_PROGRESS_PCT = ((ELAPSED_HOURS - polishPhase.startH) / (polishPhase.endH - polishPhase.startH)) * 100;

// Submit deadline = Fri 9 Oct 7:00 AM IST
export const SUBMIT_DEADLINE_MS = EVENT_END_MS;
export const HOURS_TO_SUBMIT = (SUBMIT_DEADLINE_MS - MOCK_NOW_MS) / (3600 * 1000); // 9.0

// ─── MILESTONE FLAGS ──────────────────────────────────────────────────────────
// "Feature freeze" = end of Freeze phase = hour 33.6 → passed (hour 39 > 33.6)
// "Demo video due" = Fri 1:30 AM = hour 42.5
// "Submission"     = Fri 7:00 AM = hour 48
export const MILESTONES = [
  { id: 'feature-freeze', label: 'Feature freeze', hourOffset: 33.6, passed: true },
  { id: 'demo-video',     label: 'Demo video due', hourOffset: 42.5, passed: false },
  { id: 'submission',     label: 'Submission',     hourOffset: 48,   passed: false },
];

// ─── ROSTER ───────────────────────────────────────────────────────────────────
export interface RoomMember {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  avatarColor: string;
  role: MemberRole;
  specialty: string;
  status: MemberStatus;
  currentTask: string | null; // null = idle
  blockedOn?: string;
  // workload chart data
  tasksDone: number;
  tasksExpected: number;
  // skill coverage
  skills: SkillArea[];
}

export const ROSTER: RoomMember[] = [
  {
    id: 'm1', firstName: 'Aarav', lastName: 'Mehta', initials: 'AM',
    avatarColor: '#3B5BFF',
    role: 'Leader', specialty: 'Full-stack',
    status: 'working',
    currentTask: 'Record the 90-second demo video',
    tasksDone: 12, tasksExpected: 10,
    skills: ['Build'],
  },
  {
    id: 'm2', firstName: 'Ishita', lastName: 'Rao', initials: 'IR',
    avatarColor: '#E5484D',
    role: 'Developer', specialty: 'Backend',
    status: 'blocked',
    currentTask: 'API deploy',
    blockedOn: 'API deploy',
    tasksDone: 7, tasksExpected: 10,
    skills: ['Build'],
  },
  {
    id: 'm3', firstName: 'Kabir', lastName: 'Nair', initials: 'KN',
    avatarColor: '#8B5CF6',
    role: 'Designer', specialty: 'UI/UX',
    status: 'idle',
    currentTask: null,
    tasksDone: 9, tasksExpected: 9,
    skills: ['Design'],
  },
  {
    id: 'm4', firstName: 'Sanjay', lastName: 'Gupta', initials: 'SG',
    avatarColor: '#22A55A',
    role: 'Developer', specialty: 'Frontend',
    status: 'working',
    currentTask: 'Fix mobile layout on the results page',
    tasksDone: 11, tasksExpected: 10,
    skills: ['Build'],
  },
  {
    id: 'm5', firstName: 'Priya', lastName: 'Lal', initials: 'PL',
    avatarColor: '#F59E0B',
    role: 'Developer', specialty: 'ML/AI',
    status: 'blocked',
    currentTask: 'Auth callback',
    blockedOn: 'Auth callback',
    tasksDone: 5, tasksExpected: 9,
    skills: ['AI'],
  },
  {
    id: 'm6', firstName: 'Dev', lastName: 'Patel', initials: 'DP',
    avatarColor: '#64748B',
    role: 'Member', specialty: 'Domain',
    status: 'idle',
    currentTask: null,
    tasksDone: 8, tasksExpected: 8,
    skills: ['Domain'],
  },
];

export const ACTIVE_MEMBERS = ROSTER.filter(m => m.status !== 'idle');

// ─── TASKS ────────────────────────────────────────────────────────────────────
export interface RoomTask {
  id: string;
  title: string;
  group: 'NOW' | 'TODAY' | 'LATER';
  tagLabel: string;
  tagColor: 'purple' | 'green' | 'red' | 'amber' | 'blue' | 'neutral';
  timeEstimate: string;
  urgent?: boolean;
  blocked?: boolean;
  subtasks?: { done: number; total: number };
  completed: boolean;
}

export const MY_TASKS: RoomTask[] = [
  {
    id: 't1', title: 'Record the 90-second demo video',
    group: 'NOW',
    tagLabel: 'DEMO', tagColor: 'purple',
    timeEstimate: '~45 min', completed: false,
  },
  {
    id: 't2', title: 'Export final cut and upload',
    group: 'TODAY',
    tagLabel: 'DEMO', tagColor: 'purple',
    timeEstimate: 'in 3h', completed: false,
  },
  {
    id: 't3', title: 'Fix mobile layout on the results page',
    group: 'TODAY',
    tagLabel: 'FRONTEND', tagColor: 'green',
    timeEstimate: 'in 5h',
    subtasks: { done: 2, total: 4 },
    completed: false,
  },
  {
    id: 't4', title: 'Update README with run steps',
    group: 'TODAY',
    tagLabel: 'DOCS', tagColor: 'blue',
    timeEstimate: '',
    completed: false,
  },
  {
    id: 't5', title: 'Final link check',
    group: 'LATER',
    tagLabel: 'SUBMIT', tagColor: 'red',
    timeEstimate: 'in 8h', completed: false,
  },
  {
    id: 't6', title: 'Archive demo backup recording',
    group: 'LATER',
    tagLabel: 'DEMO', tagColor: 'purple',
    timeEstimate: '', completed: false,
  },
];

// ─── TASKS SUMMARY ────────────────────────────────────────────────────────────
export const TASKS_SUMMARY = {
  total: 75,
  done: 57,
  open: 18,
  toDo: 11,
  inProgress: 5,
  blocked: 2,
  actualPct: 76,
  plannedPct: 81,
  delta: -5,
};

// ─── CHECKPOINTS ─────────────────────────────────────────────────────────────
export interface Checkpoint {
  id: string;
  label: string;
  status: 'done' | 'current' | 'upcoming';
  /** ISO string or relative label */
  timeLabel: string;
  /** For current checkpoint only */
  progress?: { done: number; total: number };
  /** Hours from event start */
  hourOffset: number;
}

export const CHECKPOINTS: Checkpoint[] = [
  {
    id: 'cp1', label: 'Rules confirmed',
    status: 'done', timeLabel: 'Wed 7:40 AM', hourOffset: 0.67,
  },
  {
    id: 'cp2', label: 'Idea locked',
    status: 'done', timeLabel: 'Wed 11:20 AM', hourOffset: 4.33,
  },
  {
    id: 'cp3', label: 'Core flow runs end to end',
    status: 'done', timeLabel: 'Wed 8:30 PM', hourOffset: 13.5,
  },
  {
    id: 'cp4', label: 'Feature freeze',
    status: 'done', timeLabel: 'Thu 4:36 PM', hourOffset: 33.6,
  },
  {
    id: 'cp5', label: 'Demo rehearsed 3 times',
    status: 'current', timeLabel: 'in progress',
    progress: { done: 1, total: 3 },
    hourOffset: 38,
  },
  {
    id: 'cp6', label: 'Demo video recorded and fallback saved',
    status: 'upcoming', timeLabel: 'in 3h 30m', hourOffset: 42.5,
  },
  {
    id: 'cp7', label: 'Submission verified',
    status: 'upcoming', timeLabel: 'in 9h 05m', hourOffset: 48,
  },
];

export const CHECKPOINTS_PASSED = CHECKPOINTS.filter(c => c.status === 'done').length; // 4
export const CHECKPOINTS_TOTAL = CHECKPOINTS.length; // 7

// ─── PROJECT SNAPSHOT ─────────────────────────────────────────────────────────
export const PROJECT = {
  name: 'StudySync',
  identity: 'A tool that matches first-year study groups to free rooms and exam dates.',
  chips: [
    { label: 'AI TRACK', color: 'purple' as const },
    { label: 'SPONSOR API', color: 'green' as const },
  ],
  rubric: [
    { label: 'Innovation', weight: 30, color: '#3B5BFF' },
    { label: 'Feasibility', weight: 25, color: '#6B8FFF' },
    { label: 'Impact', weight: 25, color: '#9BB5FF' },
    { label: 'Pitch', weight: 20, color: '#C3CCFF' },
  ],
  mvpChecks: [
    { label: 'Runs end to end', pass: true },
    { label: 'No flaky dependency', pass: true },
    { label: 'Judge understands in 30s', pass: false },
    { label: 'Wow moment in first minute', pass: true },
  ],
  rules: [
    { label: 'AI allowed', icon: '🤖' },
    { label: 'Video max 2 min', icon: '🎥' },
    { label: 'Public repo', icon: '📂' },
  ],
};

// ─── SKILLS COVERAGE ─────────────────────────────────────────────────────────
export const SKILLS_COVERAGE: { area: SkillArea; memberIds: string[] }[] = [
  { area: 'Build',        memberIds: ['m1', 'm2', 'm4'] },
  { area: 'Design',       memberIds: ['m3'] },
  { area: 'AI',           memberIds: ['m5'] },
  { area: 'Domain',       memberIds: ['m6'] },
  { area: 'Presentation', memberIds: [] }, // GAP
];

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
export interface ActivityItem {
  id: string;
  memberId: string;
  memberName: string;
  action: string;
  object: string;
  relativeTime: string;
  isBlocked?: boolean;
}

export const ACTIVITY: ActivityItem[] = [
  {
    id: 'a1', memberId: 'm4', memberName: 'Sanjay',
    action: 'finished', object: 'Fix results page',
    relativeTime: '12m',
  },
  {
    id: 'a2', memberId: 'm5', memberName: 'Priya',
    action: 'pushed 3 commits to', object: 'feat/api',
    relativeTime: '25m',
  },
  {
    id: 'a3', memberId: 'm2', memberName: 'Ishita',
    action: 'is blocked on', object: 'API deploy',
    relativeTime: '41m',
    isBlocked: true,
  },
  {
    id: 'a4', memberId: 'm1', memberName: 'Aarav',
    action: 'passed', object: 'Feature freeze',
    relativeTime: '5h',
  },
  {
    id: 'a5', memberId: 'm3', memberName: 'Kabir',
    action: 'uploaded', object: 'final logo',
    relativeTime: '6h',
  },
];

// ─── INVITE LINK ─────────────────────────────────────────────────────────────
export const INVITE_LINK = 'hackathonos.app/join/Hf45rlf';

// ─── ROOM METADATA ────────────────────────────────────────────────────────────
export const ROOM = {
  id: 'room1',
  name: 'Campus Build Sprint 2026',
  type: 'CAMPUS' as const,
  eventStartMs: EVENT_START_MS,
  eventEndMs: EVENT_END_MS,
  durationHours: EVENT_DURATION_HOURS,
};

// ─── PROGRESS CHART WAYPOINTS ─────────────────────────────────────────────────
// Planned: derived from phase completions (cumulative done % at each phase end)
// x = hours from start, y = planned %
export const PLANNED_WAYPOINTS = [
  { h: 0,    pct: 0   },
  { h: 12,   pct: 10  },
  { h: 28.8, pct: 60  },
  { h: 33.6, pct: 70  },
  { h: 40.8, pct: 85  },
  { h: 48,   pct: 100 },
];

// Actual: drawn up to "now" (hour 39) ending at 76%
export const ACTUAL_WAYPOINTS = [
  { h: 0,  pct: 0  },
  { h: 12, pct: 8  },
  { h: 28.8, pct: 55 },
  { h: 33.6, pct: 65 },
  { h: 39, pct: 76 },
];

export const NOW_HOUR = ELAPSED_HOURS;
export const NOW_ACTUAL_PCT = TASKS_SUMMARY.actualPct;
export const NOW_PLANNED_PCT = TASKS_SUMMARY.plannedPct;
