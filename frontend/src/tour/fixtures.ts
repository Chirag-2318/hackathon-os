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
  { id: 's2', step: 'Tech stack', file: 'TECH_STACK.md', desc: 'Vite React, Spring Boot 4, PostgreSQL, GTFS feeds' },
  { id: 's3', step: 'Phases', file: 'PHASES.md', desc: '0-8h Foundation, 8-24h Core Engine, 24-35h Polish' },
  { id: 's4', step: 'Tasks', file: 'MVP.md', desc: '14 prioritized tasks mapped across 5 teammates' },
  { id: 's5', step: 'Demo + Q&A', file: 'DEMO_SCRIPT.md', desc: '3-min spoken story & judge grill rebuttals' },
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
