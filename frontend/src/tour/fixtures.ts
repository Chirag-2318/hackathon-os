/**
 * Tour Fixtures for "The 36-Hour Flight"
 * Fixed sample data: Team Orbit, SIH-Style 36h, 5 teammates with preset avatars.
 */
import type { UserLike } from '@/components/ui/user-avatar';

export const SAMPLE_ROOM = {
  id: 'orbit-36-sample',
  name: 'Team Orbit',
  code: 'ORBIT36X',
  event: 'Smart India Hackathon · Hardware & Software Edition',
  track: 'Smart Mobility & Urban Transit',
  durationHours: 36,
  membersLimit: 6,
};

export const SAMPLE_TEAMMATES: Array<UserLike & { role: string; roleTag: string }> = [
  {
    userId: 'u-priya',
    name: 'Priya Sharma',
    displayName: 'Priya Sharma',
    username: 'priya_lead',
    avatarType: 'PRESET',
    avatarPreset: 1,
    role: 'Team Lead & Full Stack',
    roleTag: 'LEADER',
  },
  {
    userId: 'u-alex',
    name: 'Alex Chen',
    displayName: 'Alex Chen',
    username: 'alex_ux',
    avatarType: 'PRESET',
    avatarPreset: 2,
    role: 'Frontend & Interactions',
    roleTag: 'FRONTEND',
  },
  {
    userId: 'u-rohan',
    name: 'Rohan Verma',
    displayName: 'Rohan Verma',
    username: 'rohan_cloud',
    avatarType: 'PRESET',
    avatarPreset: 3,
    role: 'Backend & GTFS Microservices',
    roleTag: 'BACKEND',
  },
  {
    userId: 'u-ananya',
    name: 'Ananya Patel',
    displayName: 'Ananya Patel',
    username: 'ananya_ml',
    avatarType: 'PRESET',
    avatarPreset: 4,
    role: 'ML & Demand Heatmaps',
    roleTag: 'AI/ML',
  },
  {
    userId: 'u-sam',
    name: 'Sam Miller',
    displayName: 'Sam Miller',
    username: 'sam_pitch',
    avatarType: 'PRESET',
    avatarPreset: 5,
    role: 'Product Strategy & Pitch Lead',
    roleTag: 'PRODUCT',
  },
];

export const RAW_EVENT_RULES = `SIH Problem Statement SIH1429: AI-Driven Fleet Synchronization for Smart Bus Corridors.
Evaluation Breakdown: Innovation (30%), Technical Feasibility & Architecture (25%), Real-world Passenger Impact (25%), Demo & Q&A Defense (20%).
Mandatory Milestones:
- Milestone 1 (T+5h): Architecture Blueprint & PRD validated.
- Milestone 2 (T+25h): Code Freeze. No non-critical PRs accepted beyond this checkpoint.
- Milestone 3 (T+30h): Final Slide Deck submission & 3-min recorded walkthrough upload.
- Final Sprint (T+35h): Live Prototype deploy check & Judge Q&A submission.
Rules Checklist:
1. Public GitHub repository with clean commit lineage and branch protection.
2. Complete documentation stack: PRD, Tech Stack, Execution Phases, Demo script.
3. Live working container or hosted URL available during judge interrogation.`;

export const RUBRIC_CRITERIA = [
  { name: 'Innovation', weight: 30, color: 'bg-amber-500' },
  { name: 'Feasibility', weight: 25, color: 'bg-emerald-500' },
  { name: 'Impact', weight: 25, color: 'bg-blue-500' },
  { name: 'Presentation', weight: 20, color: 'bg-purple-500' },
];

export const RULES_CHECKLIST = [
  { id: 'rule-git', text: 'Clean commit lineage & protected main branch' },
  { id: 'rule-docs', text: 'PRD, Tech Stack & Phase cut-lists validated' },
  { id: 'rule-demo', text: '3-minute demo script & Canva pitch deck ready' },
  { id: 'rule-freeze', text: 'Hard code freeze 10 hours before final bell' },
];

export const SAMPLE_IDEAS = [
  {
    id: 'idea-1',
    author: SAMPLE_TEAMMATES[0],
    title: 'Real-time bus bunching prevention with dynamic dispatch intervals',
    approved: true,
  },
  {
    id: 'idea-2',
    author: SAMPLE_TEAMMATES[1],
    title: 'Gamified commuter eco-credits based on off-peak boarding QR scans',
    approved: false,
    rejected: true,
  },
  {
    id: 'idea-3',
    author: SAMPLE_TEAMMATES[2],
    title: 'Automated multimodal transit route optimizer using open GTFS feeds',
    approved: false,
  },
  {
    id: 'idea-4',
    author: SAMPLE_TEAMMATES[3],
    title: 'Crowdsourced station accessibility audit with offline speech reporting',
    approved: false,
  },
];

export const PLAN_STEPS = [
  { id: 's1', step: 'PRD + MVP', file: 'PRD.md', desc: 'Core problem, user stories, and strict scope boundary' },
  { id: 's2', step: 'Tech stack & Architecture', file: 'TECH_STACK.md', desc: 'Vite React, Spring Boot 4, PostgreSQL, GTFS feeds' },
  { id: 's3', step: 'Phases & Design', file: 'PHASES.md', desc: '0-8h Foundation, 8-24h Core Engine, 24-36h Polish' },
  { id: 's4', step: 'Demo + Q&A', file: 'DEMO_SCRIPT.md', desc: '3-min spoken story & judge grill rebuttals' },
];

export const SAMPLE_ROOM_PHASES = [
  {
    id: 'p1',
    key: 'P1',
    name: 'Foundation & Auth',
    position: 0,
    status: 'COMPLETED' as const,
    startHour: 0,
    endHour: 8,
    goal: 'Architecture blueprint, DB schema & GTFS microservice bootstrap',
    exitCheckpoint: 'Clean container deploy on staging',
    owners: 'Priya, Rohan',
    deliverables: '- PostgreSQL spatial schema\n- Auth service JWT flow',
    rawMarkdown: '## Phase 1: Foundation\n- Hours: 0 to 8\n- Goal: Architecture blueprint',
    taskCounts: { total: 4, confirmed: 4, awaiting: 0, inProgress: 0, todo: 0, dropped: 0 },
    hoursPlanned: 8,
    hoursConfirmed: 8,
    window: { startHour: 0, endHour: 8, startTime: new Date(Date.now() - 10 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
    overdue: false,
    ready: false,
    tasksGenerated: true,
    isCurrent: false,
    nextPhaseKey: 'P2',
    startPct: 0,
    endPct: 25,
  },
  {
    id: 'p2',
    key: 'P2',
    name: 'Core Engine & ML',
    position: 1,
    status: 'ACTIVE' as const,
    startHour: 8,
    endHour: 24,
    goal: 'GTFS real-time ingestion & corridor bunching predictor',
    exitCheckpoint: 'Predictor API live with <200ms latency',
    owners: 'Ananya, Alex',
    deliverables: '- Ingestion parser\n- Heatmap overlay',
    rawMarkdown: '## Phase 2: Core Engine\n- Hours: 8 to 24\n- Goal: GTFS ingestion',
    taskCounts: { total: 5, confirmed: 2, awaiting: 1, inProgress: 2, todo: 0, dropped: 0 },
    hoursPlanned: 16,
    hoursConfirmed: 6,
    window: { startHour: 8, endHour: 24, startTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() + 14 * 3600 * 1000).toISOString() },
    overdue: false,
    ready: false,
    tasksGenerated: true,
    isCurrent: true,
    nextPhaseKey: 'P3',
    startPct: 25,
    endPct: 65,
  },
  {
    id: 'p3',
    key: 'P3',
    name: 'Polish, Rehearsal & Deploy',
    position: 2,
    status: 'NOT_STARTED' as const,
    startHour: 24,
    endHour: 36,
    goal: 'Offline demo snapshots & pitch defense drill',
    exitCheckpoint: 'Final prototype submission & Canva deck',
    owners: 'Sam, Priya',
    deliverables: '- Recorded walkthrough\n- Judge Q&A defense card',
    rawMarkdown: '## Phase 3: Polish\n- Hours: 24 to 36\n- Goal: Demo preparation',
    taskCounts: { total: 0, confirmed: 0, awaiting: 0, inProgress: 0, todo: 0, dropped: 0 },
    hoursPlanned: 12,
    hoursConfirmed: 0,
    window: { startHour: 24, endHour: 36, startTime: new Date(Date.now() + 14 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() + 26 * 3600 * 1000).toISOString() },
    overdue: false,
    ready: false,
    tasksGenerated: false,
    isCurrent: false,
    nextPhaseKey: null,
    startPct: 65,
    endPct: 100,
  },
];

export const SAMPLE_KANBAN_TASKS = [
  { id: 't1', title: 'GTFS real-time schedule feed parser', assignee: SAMPLE_TEAMMATES[2], col: 'todo' },
  { id: 't2', title: 'Commuter route interactive map overlay', assignee: SAMPLE_TEAMMATES[1], col: 'in_progress' },
  { id: 't3', title: 'Bus bunching prediction engine (v1)', assignee: SAMPLE_TEAMMATES[0], col: 'in_progress' },
  { id: 't4', title: 'PostgreSQL transit spatial schema & index', assignee: SAMPLE_TEAMMATES[2], col: 'done' },
  { id: 't5', title: 'Judge presentation deck outline', assignee: SAMPLE_TEAMMATES[4], col: 'done' },
];

export const SAMPLE_TECH_BRANCHES = [
  { name: 'main', purpose: 'Production demo target (clean)', badge: 'Protected' },
  { name: 'demo-safe', purpose: 'Offline cached snapshots for stage wifi', badge: 'Backup' },
  { name: 'feature-auth', purpose: 'Transit admin dashboard login flow', badge: 'PR #12' },
];

export const SAMPLE_APIS = [
  { path: 'GET /api/v1/routes/live', label: 'Live Bus Geo Coordinates', status: 'ready' },
  { path: 'GET /api/v1/gtfs/realtime', label: 'Transit Agency Schedule Ingestion', status: 'ready' },
  { path: 'POST /api/v1/predictions/eta', label: 'ML Corridor Bunching Predictor', status: 'ready' },
  { path: 'GET /api/v1/transit/alerts', label: 'Severe Weather / Divert Broadcasts', status: 'ready' },
];

export const PRESENT_SAMPLE = {
  judgeQuestion: 'What breaks first when 50,000 riders query simultaneous arrivals?',
  counterAnswer: 'Edge-cached GTFS snapshots with 5-second TTL absorb 94% of traffic before hitting the spatial database.',
  deckTitle: 'Deck: Canva link',
  deckUrl: 'https://www.canva.com/design/team-orbit-presentation',
};
