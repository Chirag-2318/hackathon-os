/**
 * S31 Speed Mode — MSW fixtures
 * Source: design.md §8.2 seed data (MessMeter tasks)
 *
 * Task titles from §8.2: "Set up repo and CI", "Attendance CSV importer",
 * "Forecast endpoint", "Manager dashboard screen",
 * "Record fallback demo video", "Write submission draft".
 * Numbers internally consistent with boardResponseFixture (§13).
 */
import type { SpeedModeState } from '../types';

const BASE = Date.now();

export const speedModeFixture: SpeedModeState = {
  timeToCheckpoint: '2h 14m',
  timeToSubmission: '9h 05m',
  nextCheckpoint: {
    label: 'Feature Freeze',
    endsAt: new Date(BASE + 2 * 60 * 60 * 1000 + 14 * 60 * 1000).toISOString(),
  },
  currentTask: {
    id: 't-2',
    title: 'Attendance CSV importer',
    checklist: [
      { id: 'c-3', title: 'Parse CSV', isDone: false },
      { id: 'c-4', title: 'Bulk insert', isDone: false },
    ],
    checklistDone: 0,
    category: 'build',
  },
  nextUpTasks: [
    {
      id: 't-5',
      title: 'Manager dashboard screen',
      checklist: [
        { id: 'c-9', title: 'Figma mock', isDone: true },
        { id: 'c-10', title: 'React components', isDone: false },
      ],
      checklistDone: 1,
      category: 'build',
    },
    {
      id: 't-4',
      title: 'Record fallback demo video',
      checklist: [
        { id: 'c-7', title: 'Write script', isDone: false },
        { id: 'c-8', title: 'Record', isDone: false },
      ],
      checklistDone: 0,
      category: 'pitch',
    },
  ],
  blockers: [
    {
      id: 'b-1',
      taskTitle: 'Attendance CSV importer',
      reportedBy: 'Kabir Nair',
    },
  ],
  categories: [
    { id: 'urgent', label: 'Urgent', count: 1 },
    { id: 'build', label: 'Build', count: 8 },
    { id: 'docs', label: 'Docs', count: 2 },
    { id: 'pitch', label: 'Pitch', count: 3 },
  ],
};

export const speedModeNoTaskFixture: SpeedModeState = {
  ...speedModeFixture,
  currentTask: null,
};

export const speedModeNoBlockersFixture: SpeedModeState = {
  ...speedModeFixture,
  blockers: [],
};
