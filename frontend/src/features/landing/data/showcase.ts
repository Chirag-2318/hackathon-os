// Sample content for the hero product tour. Everything here is invented for a fictional project.
export type ShowcaseViewId = 'brief' | 'plan' | 'board' | 'present';
export type SatelliteKind = 'gate' | 'rule' | 'stress' | 'cut' | 'blocked' | 'ledger' | 'judge' | 'readiness';

export type ShowcaseView = {
  id: ShowcaseViewId;
  index: string;
  label: string;
  desc: string;
  time: string;                       // illustrative time remaining shown in the room's clock
  nav: string;                        // which sidebar item is highlighted (product's real nav key/label)
  rings: number[];                    // six readiness values for this moment
  satellites: [SatelliteKind, SatelliteKind];
};

export const SHOWCASE_VIEWS: ShowcaseView[] = [
  {
    id: 'brief',
    index: '01',
    label: 'Brief',
    desc: 'Brief page of an example room: all eight rules extracted from the pasted problem statement and confirmed by the leader.',
    time: 'T–35:40:00',
    nav: 'brief',
    rings: [100, 0, 0, 0, 0, 0],
    satellites: ['gate', 'rule'],
  },
  {
    id: 'plan',
    index: '02',
    label: 'Plan',
    desc: 'Plan page of an example room: the four plan steps are done and nine documents are generated.',
    time: 'T–30:00:00',
    nav: 'plan',
    rings: [100, 30, 0, 0, 0, 0],
    satellites: ['stress', 'cut'],
  },
  {
    id: 'board',
    index: '03',
    label: 'Board',
    desc: 'Board page of an example room: tasks in three lanes, one blocked task and one waiting on a dependency.',
    time: 'T–28:00:00',
    nav: 'board',
    rings: [100, 55, 0, 20, 0, 0],
    satellites: ['blocked', 'ledger'],
  },
  {
    id: 'present',
    index: '04',
    label: 'Present',
    desc: 'Pitch kit page of an example room: teleprompter lines, a live waveform and the run of show.',
    time: 'T–06:00:00',
    nav: 'pitch-kit',
    rings: [100, 85, 70, 90, 30, 40],
    satellites: ['judge', 'readiness'],
  },
];

export const SHOWCASE_COPY = {
  tablistLabel: 'Product tour',
  roomName: 'Club budget tracker',
  eventChip: 'Campus Build Sprint 2026',
  note: 'Example room with sample data. Every screen shows a fictional project.',
} as const;

export const LEDGER_MIX: [string, number][] = [['built', 2], ['existing', 1], ['mocked', 2], ['planned', 1]];
export const LEDGER_LEGEND = 'Built 2 · Existing 1 · Mocked 2 · Planned 1';
