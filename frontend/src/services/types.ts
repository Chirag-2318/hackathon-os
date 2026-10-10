/**
 * types.ts — Shared TypeScript types for the HOS v2 mock data layer.
 * Every service reads/writes these shapes persisted in localStorage.
 */

// ── Room ──────────────────────────────────────────────────────────────────────

export type RoomStage = 'brief' | 'ideate' | 'crowd' | 'plan' | 'build';

export interface Room {
  id: string;
  name: string;
  description: string;
  projectDescription: string;
  templateId: string;
  createdAt: string; // ISO
  eventStart: string | null; // ISO or null
  eventEnd: string | null; // ISO or null
  timezone: string;
  ownerId: string;
  memberIds: string[];
  stage: RoomStage;
  stageDone: {
    brief: boolean;
    ideate: boolean;
    crowd: boolean;
    plan: boolean;
  };
}

// ── Member ────────────────────────────────────────────────────────────────────

export interface RoomMember {
  id: string;
  displayName: string;
  initials: string;
  avatarColor: string;
  role: 'leader' | 'member';
  roleTags: string[];
  avatarUrl?: string;
}

// ── Brief ─────────────────────────────────────────────────────────────────────

export interface RubricCriterion {
  criterion: string;
  weight: number;
}

export interface BriefDeadlines {
  start: string | null;
  freeze: string | null;
  submission: string | null;
}

export interface BriefFields {
  problemStatement: string;
  targetAudience: string;
  rubric: RubricCriterion[];
  deadlines: BriefDeadlines;
  eligibility: string;
  techRules: string;
  aiPolicy: string;
  deliverables: string[];
  tracksAndPrizes: string[];
  judgingFormat: string;
}

export type BriefSource = 'link' | 'pdf' | 'manual';

export interface Brief {
  roomId: string;
  source: BriefSource;
  sourceUrl?: string;
  fileName?: string;
  rawText: string;
  fields: BriefFields;
  confirmed: boolean;
  confirmedFields: Record<string, boolean>;
  risks: string[];
}

// ── Idea ──────────────────────────────────────────────────────────────────────

export type IdeaStatus = 'pending' | 'approved' | 'rejected';

export interface IdeaLink {
  url: string;
  title?: string;
}

export interface Idea {
  id: string;
  roomId: string;
  authorId: string;
  createdAt: string; // ISO
  text: string;
  links: IdeaLink[];
  notes: string[];
  status: IdeaStatus;
  rejectReason?: string;
  isPrimary?: boolean;
  hidden?: boolean;
  // Backward compatibility during migration
  who?: string;
  problem?: string;
  identity?: string;
  coreFlow?: string[];
  wow?: string;
  riskiest?: string;
  tech?: string;
}

// ── CrowdCheck ────────────────────────────────────────────────────────────────

export interface Competitor {
  name: string;
  url?: string;
}

export type CrowdednessLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 1 | 2 | 3 | 4 | 5 | null;

export interface CrowdRow {
  id: string;
  ideaId?: string;
  option: string;
  likelyCompetingIdeas?: string;
  collegeOverlap?: number | null;
  crowdedness?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  notes?: string;
  title?: string;
  competitors?: Competitor[];
}

// ── Plan ─────────────────────────────────────────────────────────────────────

export interface PlanStepState {
  answer: string;
  validated: boolean;
  parsed: any;
  issues: string[];
  warnings?: string[];
}

export interface PlanState {
  roomId: string;
  steps: {
    prd: PlanStepState;
    tech: PlanStepState;
    phases: PlanStepState;
    tasks: PlanStepState;
    demo: PlanStepState;
  };
  completedAt?: string;
}

// ── Docs ─────────────────────────────────────────────────────────────────────

export interface DocVersion {
  id: string;
  version: number;
  content: string;
  editedBy?: string;
  createdAt: string;
  label?: string;
}

export interface DocComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface DocFile {
  id: string;
  name: string;
  content: string;
  version: number;
  versions?: DocVersion[];
  comments?: DocComment[];
  createdAt: string;
  updatedAt?: string;
}

// ── Board / Task ─────────────────────────────────────────────────────────────

export type TaskPriority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';
export type TaskStatus = 'todo' | 'inprogress' | 'done';

export interface TaskSubtask {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface TaskHistory {
  id: string;
  actorId: string;
  text: string;
  at: string;
}

export interface Task {
  id: string;
  key: string;
  roomId: string;
  summary: string;
  description: string;
  status: TaskStatus;
  flagged: boolean;
  blockedReason?: string;
  assigneeId?: string;
  reporterId: string;
  priority: TaskPriority;
  phaseId: string;
  role: string;
  labels: string[];
  estimateMin: number;
  dueAt?: string;
  dependsOn: string[];
  acceptance: string[];
  subtasks: TaskSubtask[];
  comments: TaskComment[];
  history: TaskHistory[];
  order: number;
  createdAt: string;
  updatedAt: string;
  title?: string;
}

export type BoardTask = Task;

export interface BoardPhase {
  id: string;
  name: string;
  startPct: number;
  endPct: number;
  exitCheckpoint: string;
  goals: string[];
}

// ── MVP Studio ───────────────────────────────────────────────────────────────

export interface CoreFlowStep {
  id: string;
  title: string;
  status: 'working' | 'notyet' | 'mocked';
  taskKey?: string;
}

export interface RealityLedgerItem {
  id: string;
  part: string;
  status: 'built' | 'existing' | 'mocked' | 'planned';
  ownerId?: string;
  taskKey?: string;
  notes?: string;
}

export interface CutListItem {
  id: string;
  text: string;
  cut: boolean;
}

export interface MvpState {
  roomId: string;
  identity: string;
  wow: string;
  coreFlow: CoreFlowStep[];
  ledger: RealityLedgerItem[];
  health: {
    runs: boolean;
    stable: boolean;
    clear30: boolean;
    wow60: boolean;
  };
  differentiation: string;
  breaksFirst: string;
  cutList: CutListItem[];
  updatedAt?: string;
}

// ── Prep ─────────────────────────────────────────────────────────────────────

export interface PrepItem {
  id: string;
  roomId: string;
  title: string;
  done: boolean;
  dueDate?: string;
  category: string;
}

// ── Notification ──────────────────────────────────────────────────────────────

export type NotificationType =
  | 'room_created'
  | 'brief_confirmed'
  | 'new_idea'
  | 'idea_approved'
  | 'idea_rejected'
  | 'ideation_done'
  | 'plan_complete'
  | 'build_unlocked';

export interface Notification {
  id: string;
  roomId: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

// ── EventTemplate ─────────────────────────────────────────────────────────────

export interface EventTemplate {
  id: string;
  name: string;
  durationHours: number;
  teamSize: number;
  meta: string;
  prefills: string;
  icon: string;
}
