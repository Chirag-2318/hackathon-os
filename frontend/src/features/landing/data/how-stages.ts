// Stage copy is final product copy; times are illustrative; screenshots come from a seeded fictional room.

export type HowStage = {
  id: string;
  index: string;     // '01' to '08'
  title: string;
  line: string;      // the outcome line
  time: string;      // illustrative time remaining
  caption: string;   // small label shown on the product frame
  capture: string;   // what the real screenshot must show (used by the placeholder until an image exists)
};

export const HOW_STAGES: HowStage[] = [
  { id: 'setup', index: '01', title: 'Set up the room', line: 'Pick a playbook. The room is ready.', time: 'T–36:00:00', caption: 'Create room · playbook picker', capture: 'Create Room wizard with an event playbook selected.' },
  { id: 'brief', index: '02', title: 'Read the brief', line: 'Rules and rubric, confirmed by the leader.', time: 'T–35:40:00', caption: 'Brief · leader confirmation', capture: 'Brief page with the extracted rubric, weights and the confirm bar.' },
  { id: 'team', index: '03', title: 'Align the team', line: 'Roles named. Skill gaps visible.', time: 'T–34:30:00', caption: 'Team · skill-gap meter', capture: 'Team page with roles and the Skill-Gap Meter.' },
  { id: 'idea', index: '04', title: 'Choose one idea', line: 'The best idea wins, not the loudest voice.', time: 'T–33:00:00', caption: 'Ideate · stress test', capture: 'Ideate page after the silent round, with the AI Stress Test open.' },
  { id: 'plan', index: '05', title: 'Plan', line: 'Nine docs and a seeded board.', time: 'T–30:00:00', caption: 'Plan · docs vault', capture: 'Plan page (all four steps done) next to the nine-file Docs vault.' },
  { id: 'build', index: '06', title: 'Build', line: 'One core flow. An honest ledger.', time: 'T–28:00:00', caption: 'Board · dependencies', capture: 'Board with a dependency lock and one card marked blocked.' },
  { id: 'present', index: '07', title: 'Present', line: 'Rehearse out loud. Hear the hard questions.', time: 'T–06:00:00', caption: 'Pitch kit · rehearsal', capture: 'Pitch Kit rehearsal view with the waveform visible.' },
  { id: 'submit', index: '08', title: 'Submit and keep', line: 'Submit with margin. Keep the proof.', time: 'T–03:12:47', caption: 'Launch pad · countdown', capture: 'Launch Pad before submission: countdown and the leader-only button.' },
];

export const HOW_COPY = {
  eyebrow: 'how it works',
  headingLead: 'From kickoff to submission,',
  headingEm: 'on one clock.',
  lead: 'Eight stages. One room. The checkpoints that decide hackathons are built in.',
  note: 'Screens show a fictional example room.',
  tablistLabel: 'Stages',
  placeholderTitle: 'Screenshot goes here',
} as const;
