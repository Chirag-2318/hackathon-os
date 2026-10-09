/**
 * homeMock.ts — Home page data.
 * Roster and checkpoint data is imported from roomMock.ts (single source of truth).
 * This file keeps Home-specific types and extends them as needed.
 */
import { CHECKPOINTS_PASSED, CHECKPOINTS_TOTAL } from '../room-overview/roomMock';

export type PhaseType = 'Plan' | 'Build' | 'Freeze' | 'Polish' | 'Submit';

export interface HackathonMember {
  id: string;
  firstName: string;
  status: 'working' | 'idle' | 'blocked';
  tasksDoneThisPhase: number;
  tasksExpectedByNow: number;
}

export interface Checkpoint {
  id: string;
  label: string;
  countPassed: number;
  countTotal: number;
  passed: boolean;
  linkText: string;
  linkHref: string;
}

export interface HackathonEvent {
  id: string;
  name: string;
  type: 'CAMPUS' | 'INTERNAL';
  startTimeMs: number;
  endTimeMs: number;
  totalDurationHours: number;
  elapsedHours: number;
  currentPhase: PhaseType;
  phaseProgressPercent: number;
  overallProgressPercent: number;
  timeRemainingText: string;
  timeRemainingState: 'on-track' | 'due-soon' | 'final-stretch';
  timeRemainingRawMs: number;
  checkpointsPassed: number;
  checkpointsTotal: number;
  currentCheckpoint?: Checkpoint;
}

export interface Task {
  id: string;
  title: string;
  tagLabel: string;
  tagColor: 'purple' | 'green' | 'red' | 'amber' | 'blue';
  timeEstimate: string;
  resourceLink?: string;
  resourceHref?: string;
  completed: boolean;
}

export interface Deadline {
  id: string;
  title: string;
  timeHighlight: string;
  tagLabel: string;
  tagColor: 'purple' | 'green' | 'red' | 'amber' | 'blue';
  timeRemainingText: string;
  description: string;
  completed: boolean;
}

export interface UserData {
  id: string;
  firstName: string;
}

export const mockUser: UserData = {
  id: 'u1',
  firstName: 'Aarav',
};

// Now = Thursday 8 Oct, 10:00 PM IST = Hour 39 of 48
// 9h 05m left to submission (Fri 9 Oct 7:00 AM IST)
export const mockCurrentEvent: HackathonEvent = {
  id: 'evt1',
  name: 'Campus Build Sprint 2026',
  type: 'CAMPUS',
  startTimeMs: new Date('2026-10-07T07:00:00+05:30').getTime(),
  endTimeMs: new Date('2026-10-09T07:00:00+05:30').getTime(),
  totalDurationHours: 48,
  elapsedHours: 39,
  currentPhase: 'Polish',
  phaseProgressPercent: 75,
  overallProgressPercent: 81,
  timeRemainingText: '9h 05m',
  timeRemainingState: 'due-soon',
  timeRemainingRawMs: 9 * 60 * 60 * 1000 + 5 * 60 * 1000,
  checkpointsPassed: CHECKPOINTS_PASSED, // 4 — from roomMock (unified)
  checkpointsTotal: CHECKPOINTS_TOTAL,   // 7 — from roomMock (unified)
  currentCheckpoint: {
    id: 'cp5',
    label: 'Demo rehearsed 3 times',
    countPassed: 1,
    countTotal: 3,
    passed: false,
    linkText: 'Open rehearsal',
    linkHref: '/app/room/r-1/pitch/rehearse',
  },
};

// Unified roster from roomMock — first 4 members for Home display
export const mockTeamMembers: HackathonMember[] = [
  { id: 'm1', firstName: 'Aarav',  status: 'working', tasksDoneThisPhase: 12, tasksExpectedByNow: 10 },
  { id: 'm2', firstName: 'Ishita', status: 'blocked', tasksDoneThisPhase: 7,  tasksExpectedByNow: 10 },
  { id: 'm4', firstName: 'Sanjay', status: 'working', tasksDoneThisPhase: 11, tasksExpectedByNow: 10 },
  { id: 'm3', firstName: 'Kabir',  status: 'idle',    tasksDoneThisPhase: 9,  tasksExpectedByNow: 9  },
];

export const mockDeadlines: Deadline[] = [
  {
    id: 'dl1',
    title: 'Upload demo video by',
    timeHighlight: '1:30 AM',
    tagLabel: 'VIDEO',
    tagColor: 'purple',
    timeRemainingText: 'in 3h 30m',
    description: 'Public link, max 2 minutes',
    completed: false,
  },
  {
    id: 'dl2',
    title: 'Review submission draft by',
    timeHighlight: '4:00 AM',
    tagLabel: 'DRAFT',
    tagColor: 'blue',
    timeRemainingText: 'in 6h',
    description: 'Check text, track and prizes',
    completed: false,
  },
  {
    id: 'dl3',
    title: 'Final submission by',
    timeHighlight: '7:00 AM',
    tagLabel: 'SUBMIT',
    tagColor: 'red',
    timeRemainingText: 'in 9h 05m',
    description: 'All members added, links open',
    completed: false,
  },
];

export const mockYourTasks: Task[] = [
  {
    id: 't1',
    title: 'Record the 90-second demo video',
    tagLabel: 'DEMO',
    tagColor: 'purple',
    timeEstimate: '~45 min',
    resourceLink: 'demo-script.md',
    resourceHref: '#',
    completed: false,
  },
  {
    id: 't2',
    title: 'Export final cut and upload',
    tagLabel: 'DEMO',
    tagColor: 'purple',
    timeEstimate: 'in 3h',
    completed: false,
  },
  {
    id: 't3',
    title: 'Fix mobile layout on the results page',
    tagLabel: 'FRONTEND',
    tagColor: 'green',
    timeEstimate: '',
    completed: false,
  },
  {
    id: 't4',
    title: 'Update README with run steps',
    tagLabel: 'DOCS',
    tagColor: 'blue',
    timeEstimate: '',
    completed: false,
  },
];

export const mockOtherRooms: HackathonEvent[] = [
  mockCurrentEvent,
  {
    id: 'evt2',
    name: 'Internal Round: Software Edition',
    type: 'INTERNAL',
    startTimeMs: Date.now() - 100000000,
    endTimeMs: Date.now() + 2 * 24 * 3600 * 1000 + 4 * 3600 * 1000,
    totalDurationHours: 168,
    elapsedHours: 116,
    currentPhase: 'Build',
    phaseProgressPercent: 50,
    overallProgressPercent: 60,
    timeRemainingText: '2d 4h',
    timeRemainingState: 'on-track',
    timeRemainingRawMs: 2 * 24 * 3600 * 1000 + 4 * 3600 * 1000,
    checkpointsPassed: 1,
    checkpointsTotal: 7,
  }
];
