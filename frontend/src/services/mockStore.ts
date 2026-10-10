/**
 * mockStore.ts — localStorage-backed typed store for HOS v3 mocks.
 *
 * Keys (hos:v3:*):
 *   hos:v3:rooms       → Record<string, Room>
 *   hos:v3:members     → Record<string, RoomMember>  (userId → member)
 *   hos:v3:briefs      → Record<string, Brief>       (roomId → brief)
 *   hos:v3:ideas       → Record<string, Idea[]>      (roomId → ideas)
 *   hos:v3:crowd       → Record<string, CrowdRow[]>  (roomId → rows)
 *   hos:v3:plan        → Record<string, PlanState>   (roomId → state)
 *   hos:v3:docs        → Record<string, DocFile[]>   (roomId → files)
 *   hos:v3:phases      → Record<string, BoardPhase[]>(roomId → phases)
 *   hos:v3:tasks       → Record<string, Task[]>      (roomId → tasks)
 *   hos:v3:mvp         → Record<string, MvpState>    (roomId → mvpState)
 *   hos:v3:prep        → Record<string, PrepItem[]>  (roomId → items)
 *   hos:v3:notifs      → Notification[]
 *   hos:v3:currentUser → string (userId)
 *   hos:v3:role        → 'leader' | 'member' (dev-only role override)
 */
import type {
  Room, RoomMember, Brief, Idea, CrowdRow, PlanState,
  DocFile, BoardPhase, Task, PrepItem, Notification, MvpState
} from './types';

// Seeded demo member for "Aarav Mehta" (the leader)
export const CURRENT_USER_ID = 'u-aarav';

// Demo teammates added by the dev panel
export const DEMO_TEAMMATE_IDS = ['u-ishita', 'u-kabir', 'u-sanjay'];

export const DEMO_MEMBERS: Record<string, RoomMember> = {
  'u-aarav': {
    id: 'u-aarav',
    displayName: 'Aarav Mehta',
    initials: 'AM',
    avatarColor: '#5B6FF0',
    role: 'leader',
    roleTags: ['Frontend', 'Backend'],
  },
  'u-ishita': {
    id: 'u-ishita',
    displayName: 'Ishita Rao',
    initials: 'IR',
    avatarColor: '#E67C4E',
    role: 'member',
    roleTags: ['Design', 'Presenter'],
  },
  'u-kabir': {
    id: 'u-kabir',
    displayName: 'Kabir Nair',
    initials: 'KN',
    avatarColor: '#28A879',
    role: 'member',
    roleTags: ['ML/AI'],
  },
  'u-sanjay': {
    id: 'u-sanjay',
    displayName: 'Sanjay Gupta',
    initials: 'SG',
    avatarColor: '#C858D4',
    role: 'member',
    roleTags: ['Backend'],
  },
};

// ─── Demo seeded room (stage=build so existing pages keep working) ─────────────

const EVENT_START = '2026-10-07T07:00:00+05:30';
const EVENT_END   = '2026-10-09T07:00:00+05:30';

export const DEMO_ROOM_ID = 'r-1';

export const DEMO_ROOM: Room = {
  id: DEMO_ROOM_ID,
  name: 'Campus Build Sprint 2026',
  description: 'Our flagship hackathon team room.',
  projectDescription: 'A platform that helps hackathon teams plan, build, and present better.',
  templateId: 'pb-sih',
  createdAt: '2026-10-01T09:00:00.000Z',
  eventStart: EVENT_START,
  eventEnd: EVENT_END,
  timezone: 'Asia/Kolkata',
  ownerId: CURRENT_USER_ID,
  memberIds: [CURRENT_USER_ID, 'u-ishita', 'u-kabir', 'u-sanjay'],
  stage: 'build',
  stageDone: { brief: true, ideate: true, crowd: true, plan: true },
};

export const DEMO_PHASES: BoardPhase[] = [
  { id: 'p-0', name: 'Phase 0: Workspace Scaffolding', startPct: 0, endPct: 15, exitCheckpoint: 'Working local build and git repo initialized', goals: ['Set up Vite + TS', 'Scaffold state and routing'] },
  { id: 'p-1', name: 'Phase 1: Core Flow & Matching Engine', startPct: 15, endPct: 45, exitCheckpoint: 'Matching algorithm returns ranked squad teammates', goals: ['GitHub OAuth integration', 'Cosine similarity service'] },
  { id: 'p-2', name: 'Phase 2: Shared Room Synchronization', startPct: 45, endPct: 70, exitCheckpoint: 'Real-time WebSocket connection syncs task board', goals: ['Board Kanban actions', 'Activity event stream'] },
  { id: 'p-3', name: 'Phase 3: Feature Freeze & Polish', startPct: 70, endPct: 85, exitCheckpoint: 'No new features, zero console errors, responsive UI tested', goals: ['Mobile breakpoint fixes', 'Empty states & tooltips'] },
  { id: 'p-4', name: 'Phase 4: Pitch Rehearsal & Submission', startPct: 85, endPct: 100, exitCheckpoint: '90-second demo video rendered and live link verified', goals: ['Record demo video', 'Submit Devpost entry'] },
];

export const DEMO_TASKS: Task[] = [
  {
    id: 't-1',
    key: 'CBS-1',
    roomId: DEMO_ROOM_ID,
    summary: 'Set up Vite + React + Tailwind v4 project scaffold',
    description: 'Initialize clean frontend workspace with Inter typography and theme variables.',
    status: 'done',
    flagged: false,
    assigneeId: 'u-aarav',
    reporterId: 'u-aarav',
    priority: 'high',
    phaseId: 'p-0',
    role: 'Frontend',
    labels: ['Frontend', 'Setup'],
    estimateMin: 45,
    dueAt: '2026-10-07T12:00:00+05:30',
    dependsOn: [],
    acceptance: ['Dev server starts in under 500ms', 'Tailwind tokens load correctly'],
    subtasks: [{ id: 'st-1', text: 'Configure tsconfig paths', done: true }, { id: 'st-2', text: 'Add reset styles', done: true }],
    comments: [],
    history: [{ id: 'h-1', actorId: 'u-aarav', text: 'Aarav moved this to Done', at: '2026-10-07T11:45:00+05:30' }],
    order: 0,
    createdAt: '2026-10-07T08:00:00+05:30',
    updatedAt: '2026-10-07T11:45:00+05:30',
  },
  {
    id: 't-2',
    key: 'CBS-2',
    roomId: DEMO_ROOM_ID,
    summary: 'Implement GitHub OAuth login and profile parser',
    description: 'Fetch public repo contributions and calculate top languages.',
    status: 'done',
    flagged: false,
    assigneeId: 'u-sanjay',
    reporterId: 'u-aarav',
    priority: 'highest',
    phaseId: 'p-0',
    role: 'Backend',
    labels: ['Backend', 'Auth'],
    estimateMin: 60,
    dueAt: '2026-10-07T14:00:00+05:30',
    dependsOn: [],
    acceptance: ['User can log in with GitHub token', 'Language weights extracted into JSON'],
    subtasks: [{ id: 'st-3', text: 'Register OAuth app', done: true }],
    comments: [],
    history: [{ id: 'h-2', actorId: 'u-sanjay', text: 'Sanjay moved this to Done', at: '2026-10-07T13:30:00+05:30' }],
    order: 1,
    createdAt: '2026-10-07T08:30:00+05:30',
    updatedAt: '2026-10-07T13:30:00+05:30',
  },
  {
    id: 't-3',
    key: 'CBS-3',
    roomId: DEMO_ROOM_ID,
    summary: 'Design swipe card interaction for teammate matching',
    description: 'Card shows user initials, role tag, top languages, and complementary score.',
    status: 'done',
    flagged: false,
    assigneeId: 'u-ishita',
    reporterId: 'u-aarav',
    priority: 'high',
    phaseId: 'p-1',
    role: 'Design',
    labels: ['Design', 'UI'],
    estimateMin: 60,
    dueAt: '2026-10-07T17:00:00+05:30',
    dependsOn: ['t-1'],
    acceptance: ['Smooth 60fps gesture animation', 'Clean visual hierarchy for skill badges'],
    subtasks: [],
    comments: [],
    history: [{ id: 'h-3', actorId: 'u-ishita', text: 'Ishita moved this to Done', at: '2026-10-07T16:50:00+05:30' }],
    order: 2,
    createdAt: '2026-10-07T09:00:00+05:30',
    updatedAt: '2026-10-07T16:50:00+05:30',
  },
  {
    id: 't-4',
    key: 'CBS-4',
    roomId: DEMO_ROOM_ID,
    summary: 'Build vector embedding pipeline for skill complementarity',
    description: 'Calculate cosine similarity across team role requirements.',
    status: 'done',
    flagged: false,
    assigneeId: 'u-kabir',
    reporterId: 'u-aarav',
    priority: 'highest',
    phaseId: 'p-1',
    role: 'ML/AI',
    labels: ['ML/AI', 'Algorithm'],
    estimateMin: 90,
    dueAt: '2026-10-07T18:00:00+05:30',
    dependsOn: ['t-2'],
    acceptance: ['Top matches returned in under 20ms', 'Zero duplicate recommendations'],
    subtasks: [],
    comments: [],
    history: [{ id: 'h-4', actorId: 'u-kabir', text: 'Kabir moved this to Done', at: '2026-10-07T18:00:00+05:30' }],
    order: 3,
    createdAt: '2026-10-07T09:30:00+05:30',
    updatedAt: '2026-10-07T18:00:00+05:30',
  },
  {
    id: 't-5',
    key: 'CBS-5',
    roomId: DEMO_ROOM_ID,
    summary: 'Implement team room mutual match confirmation modal',
    description: 'Show both candidate profiles with one-click Accept Room handshake.',
    status: 'done',
    flagged: false,
    assigneeId: 'u-aarav',
    reporterId: 'u-aarav',
    priority: 'medium',
    phaseId: 'p-1',
    role: 'Frontend',
    labels: ['Frontend'],
    estimateMin: 45,
    dueAt: '2026-10-07T20:00:00+05:30',
    dependsOn: ['t-3', 't-4'],
    acceptance: ['Both users see reciprocal accept button', 'Triggers workspace creation on both clients'],
    subtasks: [],
    comments: [],
    history: [{ id: 'h-5', actorId: 'u-aarav', text: 'Aarav moved this to Done', at: '2026-10-07T19:40:00+05:30' }],
    order: 4,
    createdAt: '2026-10-07T10:00:00+05:30',
    updatedAt: '2026-10-07T19:40:00+05:30',
  },
  {
    id: 't-6',
    key: 'CBS-6',
    roomId: DEMO_ROOM_ID,
    summary: 'Build Jira-style Kanban Board with drag-and-drop',
    description: '3 columns with optimistic updates, drop line indicators, and swimlanes.',
    status: 'inprogress',
    flagged: false,
    assigneeId: 'u-aarav',
    reporterId: 'u-aarav',
    priority: 'highest',
    phaseId: 'p-2',
    role: 'Frontend',
    labels: ['Frontend', 'Kanban'],
    estimateMin: 75,
    dueAt: '2026-10-08T14:00:00+05:30',
    dependsOn: ['t-5'],
    acceptance: ['Pointer drag and drop works smoothly', 'Column counts update live'],
    subtasks: [{ id: 'st-4', text: 'Drop line rendering', done: true }, { id: 'st-5', text: 'Optimistic update store', done: true }, { id: 'st-6', text: 'Undo toast persistence', done: false }],
    comments: [{ id: 'c-1', authorId: 'u-ishita', text: 'Looking super clean on desktop, check mobile wrap next.', createdAt: '2026-10-08T11:00:00+05:30' }],
    history: [{ id: 'h-6', actorId: 'u-aarav', text: 'Aarav moved this to In progress', at: '2026-10-08T10:00:00+05:30' }],
    order: 0,
    createdAt: '2026-10-07T14:00:00+05:30',
    updatedAt: '2026-10-08T10:00:00+05:30',
  },
  {
    id: 't-7',
    key: 'CBS-7',
    roomId: DEMO_ROOM_ID,
    summary: 'WebSocket real-time sync for board task state',
    description: 'Broadcast task movement and assignees across connected clients.',
    status: 'inprogress',
    flagged: true,
    blockedReason: 'Waiting for staging WebSocket server certificate renewal',
    assigneeId: 'u-sanjay',
    reporterId: 'u-aarav',
    priority: 'high',
    phaseId: 'p-2',
    role: 'Backend',
    labels: ['Backend', 'WebSocket'],
    estimateMin: 60,
    dueAt: '2026-10-08T16:00:00+05:30',
    dependsOn: ['t-6'],
    acceptance: ['Tasks update without page reload', 'Reconnects automatically on network drop'],
    subtasks: [],
    comments: [{ id: 'c-2', authorId: 'u-sanjay', text: 'Certificate should be issued in 30 minutes.', createdAt: '2026-10-08T12:00:00+05:30' }],
    history: [{ id: 'h-7', actorId: 'u-sanjay', text: 'Sanjay flagged task as blocked', at: '2026-10-08T11:30:00+05:30' }],
    order: 1,
    createdAt: '2026-10-07T14:30:00+05:30',
    updatedAt: '2026-10-08T11:30:00+05:30',
  },
  {
    id: 't-8',
    key: 'CBS-8',
    roomId: DEMO_ROOM_ID,
    summary: 'Interactive MVP Studio reality ledger table',
    description: 'Summarize built vs existing vs mocked parts with stacked visual breakdown bar.',
    status: 'inprogress',
    flagged: false,
    assigneeId: 'u-ishita',
    reporterId: 'u-aarav',
    priority: 'medium',
    phaseId: 'p-2',
    role: 'Design',
    labels: ['Design', 'MVP'],
    estimateMin: 45,
    dueAt: '2026-10-08T18:00:00+05:30',
    dependsOn: [],
    acceptance: ['Stacked bar reflects row statuses', 'Inline edit for parts and owners'],
    subtasks: [{ id: 'st-7', text: 'Status lozenge dropdown', done: true }, { id: 'st-8', text: 'Stacked bar SVG', done: true }],
    comments: [],
    history: [{ id: 'h-8', actorId: 'u-ishita', text: 'Ishita moved this to In progress', at: '2026-10-08T10:30:00+05:30' }],
    order: 2,
    createdAt: '2026-10-07T15:00:00+05:30',
    updatedAt: '2026-10-08T10:30:00+05:30',
  },
  {
    id: 't-9',
    key: 'CBS-9',
    roomId: DEMO_ROOM_ID,
    summary: 'Docs vault 3-pane markdown reader and zip exporter',
    description: 'Safe markdown rendering with code blocks and zero-dependency zip archive creation.',
    status: 'inprogress',
    flagged: true,
    blockedReason: 'Mermaid live diagram parser throws on cyclic graphs',
    assigneeId: 'u-kabir',
    reporterId: 'u-aarav',
    priority: 'high',
    phaseId: 'p-2',
    role: 'ML/AI',
    labels: ['Docs', 'Utility'],
    estimateMin: 60,
    dueAt: '2026-10-08T19:00:00+05:30',
    dependsOn: [],
    acceptance: ['Markdown rendered without dangerouslySetInnerHTML vulnerability', 'Valid zip download opens on macOS and Windows'],
    subtasks: [{ id: 'st-9', text: 'ZIP CRC32 table', done: true }],
    comments: [],
    history: [{ id: 'h-9', actorId: 'u-kabir', text: 'Kabir flagged task as blocked', at: '2026-10-08T13:00:00+05:30' }],
    order: 3,
    createdAt: '2026-10-07T15:30:00+05:30',
    updatedAt: '2026-10-08T13:00:00+05:30',
  },
  {
    id: 't-10',
    key: 'CBS-10',
    roomId: DEMO_ROOM_ID,
    summary: 'Pitch judge defense Q&A preparation flashcards',
    description: 'Seed 8 key judge defense answers and practice timers.',
    status: 'inprogress',
    flagged: false,
    assigneeId: 'u-aarav',
    reporterId: 'u-aarav',
    priority: 'medium',
    phaseId: 'p-3',
    role: 'Presenter',
    labels: ['Pitch', 'Presentation'],
    estimateMin: 45,
    dueAt: '2026-10-08T22:00:00+05:30',
    dependsOn: [],
    acceptance: ['Answers to "What did you build?" and "What breaks first?" prominent', 'Copy button copies full answer to clipboard'],
    subtasks: [],
    comments: [],
    history: [{ id: 'h-10', actorId: 'u-aarav', text: 'Aarav assigned to himself', at: '2026-10-08T14:00:00+05:30' }],
    order: 4,
    createdAt: '2026-10-07T16:00:00+05:30',
    updatedAt: '2026-10-08T14:00:00+05:30',
  },
  {
    id: 't-11',
    key: 'CBS-11',
    roomId: DEMO_ROOM_ID,
    summary: 'End-to-end user testing of team room invitation link',
    description: 'Verify invite token resolution for new joining teammates.',
    status: 'todo',
    flagged: false,
    assigneeId: 'u-sanjay',
    reporterId: 'u-aarav',
    priority: 'medium',
    phaseId: 'p-3',
    role: 'Backend',
    labels: ['QA', 'Testing'],
    estimateMin: 30,
    dueAt: '2026-10-08T23:30:00+05:30',
    dependsOn: ['t-7'],
    acceptance: ['Invite URL opens with valid room name and team members', 'Copy invite button gives green confirmation'],
    subtasks: [],
    comments: [],
    history: [],
    order: 0,
    createdAt: '2026-10-07T16:30:00+05:30',
    updatedAt: '2026-10-07T16:30:00+05:30',
  },
  {
    id: 't-12',
    key: 'CBS-12',
    roomId: DEMO_ROOM_ID,
    summary: 'Fix mobile responsiveness on results table and filter bar',
    description: 'Ensure columns collapse to swipeable tabs on screens < 900px wide.',
    status: 'todo',
    flagged: false,
    assigneeId: 'u-ishita',
    reporterId: 'u-aarav',
    priority: 'high',
    phaseId: 'p-3',
    role: 'Frontend',
    labels: ['Frontend', 'Mobile'],
    estimateMin: 45,
    dueAt: '2026-10-09T01:00:00+05:30',
    dependsOn: ['t-6'],
    acceptance: ['Zero horizontal scrollbar at 375px width', 'Filter bar wraps cleanly'],
    subtasks: [],
    comments: [],
    history: [],
    order: 1,
    createdAt: '2026-10-07T17:00:00+05:30',
    updatedAt: '2026-10-07T17:00:00+05:30',
  },
  {
    id: 't-13',
    key: 'CBS-13',
    roomId: DEMO_ROOM_ID,
    summary: 'Record 90-second demo video screen capture',
    description: 'Follow shot list from DEMO_SCRIPT.md covering hook, problem, and wow moment.',
    status: 'todo',
    flagged: false,
    assigneeId: 'u-aarav',
    reporterId: 'u-aarav',
    priority: 'highest',
    phaseId: 'p-4',
    role: 'Presenter',
    labels: ['Demo', 'Video'],
    estimateMin: 90,
    dueAt: '2026-10-09T03:00:00+05:30',
    dependsOn: ['t-10', 't-12'],
    acceptance: ['Length between 60 and 90 seconds', 'Crisp 1080p audio and screen recording'],
    subtasks: [{ id: 'st-10', text: 'Record hook (15s)', done: false }, { id: 'st-11', text: 'Record swipe match (30s)', done: false }, { id: 'st-12', text: 'Record workspace live sync (30s)', done: false }],
    comments: [],
    history: [],
    order: 2,
    createdAt: '2026-10-07T17:30:00+05:30',
    updatedAt: '2026-10-07T17:30:00+05:30',
  },
  {
    id: 't-14',
    key: 'CBS-14',
    roomId: DEMO_ROOM_ID,
    summary: 'Verify GitHub repository public visibility and README installation steps',
    description: 'Ensure judges can clone and run npm install without missing environment variables.',
    status: 'todo',
    flagged: false,
    assigneeId: 'u-kabir',
    reporterId: 'u-aarav',
    priority: 'high',
    phaseId: 'p-4',
    role: 'Backend',
    labels: ['Docs', 'Repo'],
    estimateMin: 30,
    dueAt: '2026-10-09T04:30:00+05:30',
    dependsOn: [],
    acceptance: ['Clean clone runs with zero errors', 'Architecture mermaid diagram rendered in README'],
    subtasks: [],
    comments: [],
    history: [],
    order: 3,
    createdAt: '2026-10-07T18:00:00+05:30',
    updatedAt: '2026-10-07T18:00:00+05:30',
  },
  {
    id: 't-15',
    key: 'CBS-15',
    roomId: DEMO_ROOM_ID,
    summary: 'Review Devpost submission tracks and sponsor prize tags',
    description: 'Select primary category and attach public demo video link.',
    status: 'todo',
    flagged: false,
    assigneeId: 'u-ishita',
    reporterId: 'u-aarav',
    priority: 'high',
    phaseId: 'p-4',
    role: 'Presenter',
    labels: ['Submission'],
    estimateMin: 45,
    dueAt: '2026-10-09T05:30:00+05:30',
    dependsOn: ['t-13'],
    acceptance: ['All 4 team members tagged in Devpost', 'Video link playable in incognito window'],
    subtasks: [],
    comments: [],
    history: [],
    order: 4,
    createdAt: '2026-10-07T18:30:00+05:30',
    updatedAt: '2026-10-07T18:30:00+05:30',
  },
  {
    id: 't-16',
    key: 'CBS-16',
    roomId: DEMO_ROOM_ID,
    summary: 'Benchmark AI prompt execution latency under load',
    description: 'Measure LLM streaming response time and memory footprint during plan generation.',
    status: 'todo',
    flagged: false,
    assigneeId: undefined, // Unassigned 1
    reporterId: 'u-aarav',
    priority: 'low',
    phaseId: 'p-3',
    role: 'ML/AI',
    labels: ['Performance'],
    estimateMin: 30,
    dueAt: '2026-10-09T02:00:00+05:30',
    dependsOn: [],
    acceptance: ['Latency graphs logged in console', 'No memory leaks in long sessions'],
    subtasks: [],
    comments: [],
    history: [],
    order: 5,
    createdAt: '2026-10-07T19:00:00+05:30',
    updatedAt: '2026-10-07T19:00:00+05:30',
  },
  {
    id: 't-17',
    key: 'CBS-17',
    roomId: DEMO_ROOM_ID,
    summary: 'Audit third-party open-source license compatibility',
    description: 'Scan npm dependencies for strict GPL or incompatible commercial licenses.',
    status: 'todo',
    flagged: false,
    assigneeId: undefined, // Unassigned 2
    reporterId: 'u-aarav',
    priority: 'lowest',
    phaseId: 'p-3',
    role: 'Frontend',
    labels: ['Compliance'],
    estimateMin: 20,
    dueAt: '2026-10-09T02:30:00+05:30',
    dependsOn: [],
    acceptance: ['Zero high-risk license conflicts found in audit report'],
    subtasks: [],
    comments: [],
    history: [],
    order: 6,
    createdAt: '2026-10-07T19:30:00+05:30',
    updatedAt: '2026-10-07T19:30:00+05:30',
  },
  {
    id: 't-18',
    key: 'CBS-18',
    roomId: DEMO_ROOM_ID,
    summary: 'Prepare backup offline presentation slides (PDF fallback)',
    description: 'Export Keynote or Figma deck in case venue WiFi is unreliable during demo.',
    status: 'todo',
    flagged: false,
    assigneeId: undefined, // Unassigned 3
    reporterId: 'u-aarav',
    priority: 'low',
    phaseId: 'p-4',
    role: 'Design',
    labels: ['Pitch', 'Backup'],
    estimateMin: 30,
    dueAt: '2026-10-09T06:00:00+05:30',
    dependsOn: [],
    acceptance: ['Single standalone PDF downloaded to leader laptop'],
    subtasks: [],
    comments: [],
    history: [],
    order: 7,
    createdAt: '2026-10-07T20:00:00+05:30',
    updatedAt: '2026-10-07T20:00:00+05:30',
  },
];

// ─── Generic store helpers ────────────────────────────────────────────────────

function readKey<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeKey<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

// ─── Migration from hos:v2 to hos:v3 ──────────────────────────────────────────

export function migrateToV3(): void {
  const existingV3 = localStorage.getItem('hos:v3:rooms');
  if (existingV3) return; // Already migrated

  // Copy basic tables
  const v2Rooms = readKey<Record<string, Room>>('hos:v2:rooms', {});
  const v2Members = readKey<Record<string, RoomMember>>('hos:v2:members', {});
  const v2Briefs = readKey<Record<string, Brief>>('hos:v2:briefs', {});
  const v2Crowd = readKey<Record<string, CrowdRow[]>>('hos:v2:crowd', {});
  const v2Plan = readKey<Record<string, PlanState>>('hos:v2:plan', {});
  const v2Docs = readKey<Record<string, DocFile[]>>('hos:v2:docs', {});
  const v2Phases = readKey<Record<string, BoardPhase[]>>('hos:v2:phases', {});
  const v2Tasks = readKey<Record<string, any[]>>('hos:v2:tasks', {});
  const v2Prep = readKey<Record<string, PrepItem[]>>('hos:v2:prep', {});
  const v2Notifs = readKey<Notification[]>('hos:v2:notifs', []);
  const v2Role = localStorage.getItem('hos:v2:role');

  if (Object.keys(v2Rooms).length > 0) {
    writeKey('hos:v3:rooms', v2Rooms);
    writeKey('hos:v3:members', v2Members);
    writeKey('hos:v3:briefs', v2Briefs);
    writeKey('hos:v3:crowd', v2Crowd);
    writeKey('hos:v3:plan', v2Plan);
    writeKey('hos:v3:docs', v2Docs);
    writeKey('hos:v3:phases', v2Phases);
    writeKey('hos:v3:prep', v2Prep);
    writeKey('hos:v3:notifs', v2Notifs);
    if (v2Role) localStorage.setItem('hos:v3:role', v2Role);

    // Migrate ideas: text = [identity, problem].filter(Boolean).join(". "), links and notes
    const v2Ideas = readKey<Record<string, any[]>>('hos:v2:ideas', {});
    const v3Ideas: Record<string, Idea[]> = {};
    for (const [rid, list] of Object.entries(v2Ideas)) {
      v3Ideas[rid] = (list || []).map((i) => {
        const text = i.text || [i.identity, i.problem].filter(Boolean).join('. ') || 'Hackathon idea';
        const rawNotes = i.notes || [];
        const links = Array.isArray(i.links)
          ? i.links
          : rawNotes.filter((n: any) => n?.type === 'link').map((n: any) => ({ url: n.url || n.text, title: n.text }));
        const notes = Array.isArray(rawNotes) && typeof rawNotes[0] === 'string'
          ? rawNotes
          : rawNotes.filter((n: any) => n?.type === 'note').map((n: any) => n.text || String(n));

        return {
          id: i.id || `idea-${Date.now()}`,
          roomId: i.roomId || rid,
          authorId: i.authorId || CURRENT_USER_ID,
          createdAt: i.createdAt || new Date().toISOString(),
          text,
          links,
          notes,
          status: i.status || 'pending',
          rejectReason: i.rejectReason,
          isPrimary: i.isPrimary,
          hidden: i.hidden || false,
        };
      });
    }
    writeKey('hos:v3:ideas', v3Ideas);

    // Migrate tasks to full Task interface
    const v3Tasks: Record<string, Task[]> = {};
    for (const [rid, list] of Object.entries(v2Tasks)) {
      v3Tasks[rid] = (list || []).map((t, idx) => ({
        id: t.id || `t-${idx + 1}`,
        key: t.key || `TASK-${idx + 1}`,
        roomId: t.roomId || rid,
        summary: t.summary || t.title || 'Sprint task',
        description: t.description || '',
        status: (t.status === 'in-progress' ? 'inprogress' : t.status) || 'todo',
        flagged: Boolean(t.flagged),
        blockedReason: t.blockedReason,
        assigneeId: t.assigneeId,
        reporterId: t.reporterId || CURRENT_USER_ID,
        priority: t.priority || (t.dependsOn && t.dependsOn.length > 0 ? 'high' : 'medium'),
        phaseId: t.phaseId || 'phase-0',
        role: t.role || 'Frontend',
        labels: t.labels || (t.role ? [t.role] : []),
        estimateMin: Number(t.estimateMin) || 45,
        dueAt: t.dueAt,
        dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn : [],
        acceptance: Array.isArray(t.acceptance)
          ? t.acceptance
          : (t.acceptance ? String(t.acceptance).split(/\.\s+/).filter(Boolean) : []),
        subtasks: t.subtasks || [],
        comments: t.comments || [],
        history: t.history || [{ id: `h-${Date.now()}`, actorId: CURRENT_USER_ID, text: 'Migrated task', at: new Date().toISOString() }],
        order: t.order ?? idx,
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: t.updatedAt || new Date().toISOString(),
      }));
    }
    writeKey('hos:v3:tasks', v3Tasks);
  }
}

// ─── Initialise store with seeded data if first visit ────────────────────────

export function ensureStoreSeeded(): void {
  migrateToV3();

  const rooms = readKey<Record<string, Room>>('hos:v3:rooms', {});
  if (!rooms[DEMO_ROOM_ID]) {
    rooms[DEMO_ROOM_ID] = DEMO_ROOM;
    writeKey('hos:v3:rooms', rooms);
  }

  const members = readKey<Record<string, RoomMember>>('hos:v3:members', {});
  let membersChanged = false;
  for (const [id, m] of Object.entries(DEMO_MEMBERS)) {
    if (!members[id]) { members[id] = m; membersChanged = true; }
  }
  if (membersChanged) writeKey('hos:v3:members', members);

  // Seed demo phases if empty
  const phases = readKey<Record<string, BoardPhase[]>>('hos:v3:phases', {});
  if (!phases[DEMO_ROOM_ID] || phases[DEMO_ROOM_ID].length === 0) {
    phases[DEMO_ROOM_ID] = DEMO_PHASES;
    writeKey('hos:v3:phases', phases);
  }

  // Seed demo tasks if empty
  const tasks = readKey<Record<string, Task[]>>('hos:v3:tasks', {});
  if (!tasks[DEMO_ROOM_ID] || tasks[DEMO_ROOM_ID].length === 0) {
    tasks[DEMO_ROOM_ID] = DEMO_TASKS;
    writeKey('hos:v3:tasks', tasks);
  }

  // Seed demo MVP state if empty
  const mvpStates = readKey<Record<string, MvpState>>('hos:v3:mvp', {});
  if (!mvpStates[DEMO_ROOM_ID]) {
    mvpStates[DEMO_ROOM_ID] = {
      roomId: DEMO_ROOM_ID,
      identity: 'Tinder for hackathon teammates, matching verified GitHub profiles with sprint ambitions.',
      wow: 'Instant mutual match triggers an automated repo fork, Discord room, and shared planning board in 2 seconds.',
      coreFlow: [
        { id: 'cf-1', title: 'Connect GitHub and verify public repos', status: 'working', taskKey: 'CBS-2' },
        { id: 'cf-2', title: 'Select role and stack preferences', status: 'working', taskKey: 'CBS-1' },
        { id: 'cf-3', title: 'Swipe match with complementary teammates', status: 'working', taskKey: 'CBS-3' },
        { id: 'cf-4', title: 'Auto-scaffold shared Hackathon OS room', status: 'mocked', taskKey: 'CBS-5' },
      ],
      ledger: [
        { id: 'rl-1', part: 'Skill vector cosine matcher', status: 'built', ownerId: 'u-kabir', taskKey: 'CBS-4', notes: 'pgvector algorithm' },
        { id: 'rl-2', part: 'Kanban drag and drop board', status: 'built', ownerId: 'u-aarav', taskKey: 'CBS-6', notes: 'Pointer events DnD' },
        { id: 'rl-3', part: 'GitHub OAuth token validation', status: 'existing', ownerId: 'u-sanjay', taskKey: 'CBS-2', notes: 'GitHub REST API v3' },
        { id: 'rl-4', part: 'Live WebSocket task sync', status: 'mocked', ownerId: 'u-sanjay', taskKey: 'CBS-7', notes: 'Local broadcast mock' },
        { id: 'rl-5', part: 'AI auto-phase generator', status: 'built', ownerId: 'u-aarav', taskKey: 'CBS-1', notes: 'Plan prompt chain' },
        { id: 'rl-6', part: 'Offline presentation slides fallback', status: 'planned', ownerId: 'u-ishita', taskKey: 'CBS-18', notes: 'PDF builder' },
      ],
      health: {
        runs: true,
        stable: true,
        clear30: true,
        wow60: false,
      },
      differentiation: 'Unlike generic Slack or Discord channels, Hackathon OS computes skill complementarity vector distance and generates an entire Jira-style board in 60 seconds.',
      breaksFirst: 'Under heavy concurrent swipes, real-time WebSocket connection pools could exhaust memory before reconnecting.',
      cutList: [
        { id: 'cl-1', text: 'Real-time video calling inside room', cut: true },
        { id: 'cl-2', text: 'Multi-hackathon calendar sync', cut: true },
        { id: 'cl-3', text: 'Native mobile apps for iOS and Android', cut: false },
      ],
      updatedAt: new Date().toISOString(),
    };
    writeKey('hos:v3:mvp', mvpStates);
  }
}

// ─── Rooms ───────────────────────────────────────────────────────────────────

export function getRooms(): Record<string, Room> {
  return readKey<Record<string, Room>>('hos:v3:rooms', {});
}

export function getRoom(id: string): Room | null {
  return getRooms()[id] ?? null;
}

export function setRoom(room: Room): void {
  const rooms = getRooms();
  rooms[room.id] = room;
  writeKey('hos:v3:rooms', rooms);
}

export function deleteRoom(id: string): void {
  const rooms = getRooms();
  delete rooms[id];
  writeKey('hos:v3:rooms', rooms);
}

// ─── Members ─────────────────────────────────────────────────────────────────

export function getAllMembers(): Record<string, RoomMember> {
  return readKey<Record<string, RoomMember>>('hos:v3:members', {});
}

export function getMember(id: string): RoomMember | null {
  return getAllMembers()[id] ?? null;
}

export function setMember(m: RoomMember): void {
  const all = getAllMembers();
  all[m.id] = m;
  writeKey('hos:v3:members', all);
}

export function getRoomMembers(roomId: string): RoomMember[] {
  const room = getRoom(roomId);
  if (!room) return [];
  const all = getAllMembers();
  return room.memberIds.map(id => all[id]).filter(Boolean) as RoomMember[];
}

// ─── Brief ───────────────────────────────────────────────────────────────────

export function getBrief(roomId: string): Brief | null {
  const briefs = readKey<Record<string, Brief>>('hos:v3:briefs', {});
  return briefs[roomId] ?? null;
}

export function setBrief(brief: Brief): void {
  const briefs = readKey<Record<string, Brief>>('hos:v3:briefs', {});
  briefs[brief.roomId] = brief;
  writeKey('hos:v3:briefs', briefs);
}

// ─── Ideas ───────────────────────────────────────────────────────────────────

export function getIdeas(roomId: string): Idea[] {
  const all = readKey<Record<string, Idea[]>>('hos:v3:ideas', {});
  return all[roomId] ?? [];
}

export function setIdeas(roomId: string, ideas: Idea[]): void {
  const all = readKey<Record<string, Idea[]>>('hos:v3:ideas', {});
  all[roomId] = ideas;
  writeKey('hos:v3:ideas', all);
}

export function upsertIdea(idea: Idea): void {
  const ideas = getIdeas(idea.roomId);
  const idx = ideas.findIndex(i => i.id === idea.id);
  if (idx >= 0) ideas[idx] = idea;
  else ideas.unshift(idea);
  setIdeas(idea.roomId, ideas);
}

export function deleteIdea(roomId: string, ideaId: string): void {
  const ideas = getIdeas(roomId).filter(i => i.id !== ideaId);
  setIdeas(roomId, ideas);
}

// ─── CrowdRows ───────────────────────────────────────────────────────────────

export function getCrowdRows(roomId: string): CrowdRow[] {
  const all = readKey<Record<string, CrowdRow[]>>('hos:v3:crowd', {});
  return all[roomId] ?? [];
}

export function setCrowdRows(roomId: string, rows: CrowdRow[]): void {
  const all = readKey<Record<string, CrowdRow[]>>('hos:v3:crowd', {});
  all[roomId] = rows;
  writeKey('hos:v3:crowd', all);
}

// ─── PlanState ───────────────────────────────────────────────────────────────

function emptyPlanStep(): PlanState['steps']['prd'] {
  return { answer: '', validated: false, parsed: null, issues: [], warnings: [] };
}

export function getPlanState(roomId: string): PlanState {
  const all = readKey<Record<string, PlanState>>('hos:v3:plan', {});
  return all[roomId] ?? {
    roomId,
    steps: {
      prd: emptyPlanStep(),
      tech: emptyPlanStep(),
      phases: emptyPlanStep(),
      tasks: emptyPlanStep(),
      demo: emptyPlanStep(),
    },
  };
}

export function setPlanState(state: PlanState): void {
  const all = readKey<Record<string, PlanState>>('hos:v3:plan', {});
  all[state.roomId] = state;
  writeKey('hos:v3:plan', all);
}

// ─── Docs ────────────────────────────────────────────────────────────────────

export function getDocs(roomId: string): DocFile[] {
  const all = readKey<Record<string, DocFile[]>>('hos:v3:docs', {});
  return all[roomId] ?? [];
}

export function setDocs(roomId: string, docs: DocFile[]): void {
  const all = readKey<Record<string, DocFile[]>>('hos:v3:docs', {});
  all[roomId] = docs;
  writeKey('hos:v3:docs', all);
}

// ─── BoardPhases ─────────────────────────────────────────────────────────────

export function getPhases(roomId: string): BoardPhase[] {
  const all = readKey<Record<string, BoardPhase[]>>('hos:v3:phases', {});
  return all[roomId] ?? [];
}

export function setPhases(roomId: string, phases: BoardPhase[]): void {
  const all = readKey<Record<string, BoardPhase[]>>('hos:v3:phases', {});
  all[roomId] = phases;
  writeKey('hos:v3:phases', all);
}

// ─── BoardTasks / Tasks ───────────────────────────────────────────────────────

export function getTasks(roomId: string): Task[] {
  const all = readKey<Record<string, Task[]>>('hos:v3:tasks', {});
  return all[roomId] ?? [];
}

export function setTasks(roomId: string, tasks: Task[]): void {
  const all = readKey<Record<string, Task[]>>('hos:v3:tasks', {});
  all[roomId] = tasks;
  writeKey('hos:v3:tasks', all);
}

export function upsertTask(task: Task): void {
  const tasks = getTasks(task.roomId);
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx >= 0) tasks[idx] = task;
  else tasks.push(task);
  setTasks(task.roomId, tasks);
}

export function deleteTask(roomId: string, taskId: string): void {
  const tasks = getTasks(roomId).filter(t => t.id !== taskId);
  setTasks(roomId, tasks);
}

// ─── MVP State ───────────────────────────────────────────────────────────────

export function getMvpState(roomId: string): MvpState | null {
  const all = readKey<Record<string, MvpState>>('hos:v3:mvp', {});
  return all[roomId] ?? null;
}

export function setMvpState(roomId: string, state: MvpState): void {
  const all = readKey<Record<string, MvpState>>('hos:v3:mvp', {});
  all[roomId] = state;
  writeKey('hos:v3:mvp', all);
}

// ─── PrepItems ───────────────────────────────────────────────────────────────

export function getPrepItems(roomId: string): PrepItem[] {
  const all = readKey<Record<string, PrepItem[]>>('hos:v3:prep', {});
  return all[roomId] ?? [];
}

export function setPrepItems(roomId: string, items: PrepItem[]): void {
  const all = readKey<Record<string, PrepItem[]>>('hos:v3:prep', {});
  all[roomId] = items;
  writeKey('hos:v3:prep', all);
}

// ─── Notifications ───────────────────────────────────────────────────────────

export function getNotifications(): Notification[] {
  return readKey<Notification[]>('hos:v3:notifs', []);
}

export function addNotification(n: Notification): void {
  const all = getNotifications();
  all.unshift(n);
  writeKey('hos:v3:notifs', all.slice(0, 50));
}

export function markNotifRead(id: string): void {
  const all = getNotifications();
  const idx = all.findIndex(n => n.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], read: true };
    writeKey('hos:v3:notifs', all);
  }
}

// ─── Role override (dev only) ─────────────────────────────────────────────────

export function getCurrentRole(): 'leader' | 'member' {
  return (localStorage.getItem('hos:v3:role') as 'leader' | 'member') ?? 'leader';
}

export function setCurrentRole(role: 'leader' | 'member'): void {
  localStorage.setItem('hos:v3:role', role);
}

// ─── Simulated latency ───────────────────────────────────────────────────────

export function mockDelay(min = 100, max = 250): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(r => setTimeout(r, ms));
}

// ─── Generate IDs ────────────────────────────────────────────────────────────

export function genId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
