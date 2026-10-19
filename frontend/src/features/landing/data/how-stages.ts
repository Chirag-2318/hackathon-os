// Stage copy is final product copy; times are illustrative. Each stage is one real product screen drawn as a static copy.
export type HowStageId = 'setup' | 'brief' | 'team' | 'idea' | 'plan' | 'build' | 'present' | 'submit';

export type HowStage = {
  id: HowStageId;
  shell: 'app' | 'room';
  index: string;
  title: string;
  line: string;
  time: string;            // illustrative time remaining, also shown in the room's top bar
  caption: string;         // small label on the plate
  nav: string;             // the sidebar item highlighted in the shell (the product's own label)
  crumbs: string[];        // the top-bar breadcrumb trail
  rings: number[] | null;  // six readiness values for the room's top bar (null for the app shell)
  desc: string;            // text description for screen readers
};

export const HOW_STAGES: HowStage[] = [
  { id: 'setup', shell: 'app', index: '01', title: 'Set up the room', line: 'Pick a playbook. The room is ready.', time: 'T–36:00:00', caption: 'Create room · playbook', nav: 'Playbooks', crumbs: ['Workspace', 'Create room'], rings: null, desc: 'Setup screen: a playbook is chosen and the room details are filled in for an example project.' },
  { id: 'brief', shell: 'room', index: '02', title: 'Read the brief', line: 'Rules and rubric, confirmed by the leader.', time: 'T–35:40:00', caption: 'Brief · confirmed rules', nav: 'Brief', crumbs: ['My rooms', 'Club budget tracker', 'Plan', 'Brief'], rings: [100, 0, 0, 0, 0, 0], desc: 'Brief screen: the rubric and seven more rules extracted from the problem statement, all confirmed by the leader.' },
  { id: 'team', shell: 'room', index: '03', title: 'Align the team', line: 'Roles named. Skill gaps visible.', time: 'T–34:30:00', caption: 'Team · skill gaps', nav: 'Team', crumbs: ['My rooms', 'Club budget tracker', 'Team'], rings: [100, 0, 0, 0, 0, 0], desc: 'Team screen: four members with roles and a skill-gap meter that shows one gap.' },
  { id: 'idea', shell: 'room', index: '04', title: 'Choose one idea', line: 'The best idea wins, not the loudest voice.', time: 'T–33:00:00', caption: 'Ideate · stress test', nav: 'Ideate', crumbs: ['My rooms', 'Club budget tracker', 'Plan', 'Ideate'], rings: [100, 0, 0, 0, 0, 0], desc: 'Ideate screen: three ideas with anonymous votes and an AI stress test for the leading idea.' },
  { id: 'plan', shell: 'room', index: '05', title: 'Plan', line: 'Nine docs and a seeded board.', time: 'T–30:00:00', caption: 'Plan · docs vault', nav: 'Plan', crumbs: ['My rooms', 'Club budget tracker', 'Plan'], rings: [100, 30, 0, 0, 0, 0], desc: 'Plan screen: four validated steps and nine generated documents.' },
  { id: 'build', shell: 'room', index: '06', title: 'Build', line: 'One core flow. An honest ledger.', time: 'T–28:00:00', caption: 'Board · dependencies', nav: 'Board', crumbs: ['My rooms', 'Club budget tracker', 'Build', 'Board'], rings: [100, 55, 0, 20, 0, 0], desc: 'Board screen: tasks in three lanes, one blocked task and one waiting on a dependency.' },
  { id: 'present', shell: 'room', index: '07', title: 'Present', line: 'Rehearse out loud. Hear the hard questions.', time: 'T–06:00:00', caption: 'Pitch kit · rehearsal', nav: 'Pitch kit', crumbs: ['My rooms', 'Club budget tracker', 'Present', 'Pitch kit'], rings: [100, 85, 70, 90, 30, 40], desc: 'Pitch kit screen: teleprompter lines, a live waveform and the run of show.' },
  { id: 'submit', shell: 'room', index: '08', title: 'Submit and keep', line: 'Submit with margin. Keep the proof.', time: 'T–03:12:47', caption: 'Launch pad · countdown', nav: 'Submission', crumbs: ['My rooms', 'Club budget tracker', 'Present', 'Submission'], rings: [100, 92, 100, 100, 100, 76], desc: 'Launch pad screen: a countdown, the pre-flight checklist and the leader-only submit control.' },
];

export const HOW_COPY = {
  eyebrow: 'how it works',
  headingLead: 'From kickoff to submission,',
  headingVivid: 'on one clock.',
  lead: 'Eight stages. One room. The checkpoints that decide hackathons are built in.',
  note: 'Screens are static copies of the product with fictional sample data.',
  tablistLabel: 'Stages',
} as const;
