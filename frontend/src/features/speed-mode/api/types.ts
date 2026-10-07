/**
 * S31 Speed Mode — API types
 * Source: PRD Phase 6b §3.3, design.md §6 S31
 *
 * Fields limited to what the column sections actually display.
 */

export interface SpeedModeChecklistItem {
  id: string;
  title: string;
  isDone: boolean;
}

export interface SpeedModeTask {
  id: string;
  title: string;
  checklist: SpeedModeChecklistItem[];
  /** Done count for progress ring */
  checklistDone: number;
  category?: 'urgent' | 'build' | 'docs' | 'pitch';
}

export interface SpeedModeCheckpoint {
  label: string;
  /** ISO-8601 */
  endsAt: string;
}

export interface SpeedModeCategory {
  id: 'urgent' | 'build' | 'docs' | 'pitch';
  label: string;
  count: number;
}

export interface SpeedModeBlocker {
  id: string;
  taskTitle: string;
  reportedBy: string;
}

export interface SpeedModeState {
  timeToCheckpoint: string; // e.g. "2h 14m"
  timeToSubmission: string;  // e.g. "9h 05m"
  nextCheckpoint: SpeedModeCheckpoint;
  currentTask: SpeedModeTask | null;
  nextUpTasks: SpeedModeTask[]; // exactly 0–2 items per §3.3
  blockers: SpeedModeBlocker[];
  categories: SpeedModeCategory[];
}
