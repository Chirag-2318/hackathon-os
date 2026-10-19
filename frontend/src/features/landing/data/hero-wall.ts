export type WallScreenId =
  | 'brief' | 'team' | 'idea' | 'plan' | 'ledger' | 'rehearsal' | 'judge'
  | 'readiness' | 'launch' | 'docs' | 'clock' | 'playbooks' | 'summary' | 'tools';

export type WallFrameDef = {
  /** unique key (fillers repeat a screen, so the key differs from the screen id) */
  key: string;
  screen: WallScreenId;
  /** 1-based grid column and row */
  col: number;
  row: number;
  /** how many columns the frame spans (1 or 2) */
  colSpan: 1 | 2;
  /** 1 to 9 for the journey frames the camera visits, null for fillers */
  journeyIndex: number | null;
  /** mono caption */
  label: string;
  /** illustrative clock time shown at the right of the caption, or null */
  time: string | null;
};

export const WALL_COLS = 6;
export const WALL_ROWS = 5;

export const WALL_FRAMES: WallFrameDef[] = [
  // row 1
  { key: 'tools-1',     screen: 'tools',     col: 1, row: 1, colSpan: 1, journeyIndex: null, label: 'Tool directory', time: null },
  { key: 'clock-1',     screen: 'clock',     col: 2, row: 1, colSpan: 1, journeyIndex: null, label: 'Clock',          time: null },
  { key: 'playbooks-1', screen: 'playbooks', col: 3, row: 1, colSpan: 2, journeyIndex: null, label: 'Playbooks',      time: null },
  { key: 'docs-1',      screen: 'docs',      col: 5, row: 1, colSpan: 1, journeyIndex: null, label: 'Docs',           time: null },
  { key: 'summary-1',   screen: 'summary',   col: 6, row: 1, colSpan: 1, journeyIndex: null, label: 'Project summary', time: null },
  // row 2 (journey, left to right)
  { key: 'docs-2',      screen: 'docs',      col: 1, row: 2, colSpan: 1, journeyIndex: null, label: 'Docs',           time: null },
  { key: 'brief',       screen: 'brief',     col: 2, row: 2, colSpan: 1, journeyIndex: 1, label: 'Read the brief',  time: 'T–35:40' },
  { key: 'team',        screen: 'team',      col: 3, row: 2, colSpan: 1, journeyIndex: 2, label: 'Align the team',  time: 'T–34:10' },
  { key: 'idea',        screen: 'idea',      col: 4, row: 2, colSpan: 1, journeyIndex: 3, label: 'Choose one idea', time: 'T–32:30' },
  { key: 'plan',        screen: 'plan',      col: 5, row: 2, colSpan: 1, journeyIndex: 4, label: 'Plan',            time: 'T–30:00' },
  { key: 'clock-2',     screen: 'clock',     col: 6, row: 2, colSpan: 1, journeyIndex: null, label: 'Clock',          time: null },
  // row 3 (journey, right to left)
  { key: 'summary-2',   screen: 'summary',   col: 1, row: 3, colSpan: 1, journeyIndex: null, label: 'Project summary', time: null },
  { key: 'readiness',   screen: 'readiness', col: 2, row: 3, colSpan: 1, journeyIndex: 8, label: 'Readiness',       time: 'T–03:40' },
  { key: 'judge',       screen: 'judge',     col: 3, row: 3, colSpan: 1, journeyIndex: 7, label: 'Judge’s Chair',   time: 'T–04:10' },
  { key: 'rehearsal',   screen: 'rehearsal', col: 4, row: 3, colSpan: 1, journeyIndex: 6, label: 'Rehearse',        time: 'T–05:30' },
  { key: 'ledger',      screen: 'ledger',    col: 5, row: 3, colSpan: 1, journeyIndex: 5, label: 'Reality Ledger',  time: 'T–12:00' },
  { key: 'tools-2',     screen: 'tools',     col: 6, row: 3, colSpan: 1, journeyIndex: null, label: 'Tool directory', time: null },
  // row 4
  { key: 'docs-3',      screen: 'docs',      col: 1, row: 4, colSpan: 1, journeyIndex: null, label: 'Docs',           time: null },
  { key: 'launch',      screen: 'launch',    col: 2, row: 4, colSpan: 1, journeyIndex: 9, label: 'Launch pad',      time: 'T–03:12' },
  { key: 'summary-3',   screen: 'summary',   col: 3, row: 4, colSpan: 2, journeyIndex: null, label: 'Project summary', time: null },
  { key: 'clock-3',     screen: 'clock',     col: 5, row: 4, colSpan: 1, journeyIndex: null, label: 'Clock',          time: null },
  { key: 'docs-4',      screen: 'docs',      col: 6, row: 4, colSpan: 1, journeyIndex: null, label: 'Docs',           time: null },
  // row 5
  { key: 'playbooks-2', screen: 'playbooks', col: 1, row: 5, colSpan: 2, journeyIndex: null, label: 'Playbooks',      time: null },
  { key: 'tools-3',     screen: 'tools',     col: 3, row: 5, colSpan: 1, journeyIndex: null, label: 'Tool directory', time: null },
  { key: 'docs-5',      screen: 'docs',      col: 4, row: 5, colSpan: 1, journeyIndex: null, label: 'Docs',           time: null },
  { key: 'summary-4',   screen: 'summary',   col: 5, row: 5, colSpan: 2, journeyIndex: null, label: 'Project summary', time: null },
];

/** The order the camera visits the lit frames. It follows the product journey. */
export const WALL_SEQUENCE: string[] = [
  'brief', 'team', 'idea', 'plan', 'ledger', 'rehearsal', 'judge', 'readiness', 'launch',
];

export const WALL_CAPTION = 'Illustrative screens · fictional room';
