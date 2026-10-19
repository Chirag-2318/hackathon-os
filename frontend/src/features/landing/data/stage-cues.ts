import { JUDGE, LAUNCH, READINESS, REHEARSAL } from './stage-act';

// The four cues of the stage act. Times are illustrative. Each cue is one real product screen, shown in the dark look.
export type StageCueId = 'rehearse' | 'questions' | 'readiness' | 'submit';

export type StageCue = {
  id: StageCueId;
  index: string;
  label: string;
  line: string;
  time: string;          // illustrative time remaining shown in the room's top bar and on the rail
  nav: string;           // the sidebar item highlighted in the room shell
  crumbs: string[];
  rings: number[];       // six readiness values for the room's top bar
  desc: string;          // text description for screen readers
};

export const STAGE_CUES: StageCue[] = [
  { id: 'rehearse', index: '01', label: 'Rehearse', line: 'Say it out loud, against the clock.', time: 'T–05:58:12', nav: 'Pitch kit', crumbs: ['My rooms', 'Club budget tracker', 'Present', 'Pitch kit'], rings: [100, 85, 55, 90, 30, 40], desc: 'Pitch kit screen: teleprompter lines advance while a waveform follows the voice, with the run of show underneath.' },
  { id: 'questions', index: '02', label: 'Questions', line: 'Hear the hard questions first.', time: 'T–05:20:00', nav: 'Pitch kit', crumbs: ['My rooms', 'Club budget tracker', 'Present', 'Pitch kit'], rings: [100, 85, 70, 90, 30, 40], desc: 'Judge’s Chair screen: a hard question with its difficulty, why it is asked and an answer prepared from the reality ledger.' },
  { id: 'readiness', index: '03', label: 'Readiness', line: 'See what is still weak before the judges do.', time: 'T–04:10:00', nav: 'Readiness', crumbs: ['My rooms', 'Club budget tracker', 'Review', 'Readiness'], rings: [100, 92, 100, 100, 100, 76], desc: 'Readiness screen: six readiness rings, with fallback insurance still weak.' },
  { id: 'submit', index: '04', label: 'Submit', line: 'Submit with margin. Keep the proof.', time: 'T–03:12:47', nav: 'Submission', crumbs: ['My rooms', 'Club budget tracker', 'Present', 'Submission'], rings: [100, 92, 100, 100, 100, 76], desc: 'Launch pad screen: a countdown, the pre-flight checklist and the leader-only submit control. Pressing it stamps the room as submitted with margin.' },
];

export type SatelliteSpec =
  | { kind: 'timer'; label: string; value: string; note: string }
  | { kind: 'note'; label: string; text: string }
  | { kind: 'ledger'; label: string; note: string; rows: { name: string; status: string }[] }
  | { kind: 'milestones'; label: string; steps: string[] }
  | { kind: 'result'; label: string; text: string };

// The two floating notes shown beside the window for a cue. On the last cue they change after the stamp lands.
export function satellitesFor(index: number, submitted: boolean): { a?: SatelliteSpec; b?: SatelliteSpec } {
  if (index === 0) {
    return {
      a: { kind: 'timer', label: 'Run of show', value: '2:48 / 3:00', note: '12 seconds of margin.' },
      b: { kind: 'note', label: 'Simulated here', text: REHEARSAL.caption },
    };
  }
  if (index === 1) {
    return {
      a: { kind: 'note', label: 'Why asked', text: JUDGE.why.replace(/^Why asked:\s*/, '') },
      b: { kind: 'ledger', label: JUDGE.ledgerLabel, note: JUDGE.ledgerNote, rows: JUDGE.ledgerRows.map((row) => ({ name: row.name, status: row.status })) },
    };
  }
  if (index === 2) {
    return {
      a: { kind: 'note', label: 'Weak spot', text: READINESS.weak },
      b: { kind: 'note', label: READINESS.exampleChip, text: 'One view of where the team stands before the judges arrive.' },
    };
  }
  if (!submitted) return { a: { kind: 'note', label: LAUNCH.note, text: LAUNCH.line } };
  return {
    a: { kind: 'milestones', label: 'Room timeline', steps: [...LAUNCH.milestones] },
    b: { kind: 'result', label: 'Result', text: LAUNCH.result },
  };
}
