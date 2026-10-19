export type DoorId = 'prep' | 'live' | 'explore';
export type Door = {
  id: DoorId;
  index: string;
  state: string;
  title: string;
  line: string;
  outcomes: string[];
  cta: string;
  to: string;
  live?: boolean;
};

export const DOORS_COPY = {
  eyebrow: 'three starting points',
  headingLead: 'Start where you',
  headingEm: 'are.',
  lead: 'Three ways in, depending on where the clock is.',
} as const;

// Outcomes describe things the product does today. Check them before launch.
export const DOORS: Door[] = [
  { id: 'prep', index: '01', state: 'Before kickoff', title: 'The event hasn’t started.', line: 'Pick a playbook, read the rules, form the team.', outcomes: ['A playbook with the right clock and team size', 'Rules and rubric confirmed before the build starts', 'Roles named and skill gaps visible'], cta: 'Set up before kickoff', to: '/signin?intent=prep' },
  { id: 'explore', index: '02', state: 'No account', title: 'Just exploring.', line: 'Browse playbooks and the tool directory.', outcomes: ['Browse all six playbooks', 'Explore the tool directory', 'No account needed'], cta: 'Browse playbooks', to: '/playbooks' },
  { id: 'live', index: '03', state: 'Live now', title: 'The event is live.', line: 'Get the brief in, lock one idea, generate the plan now.', outcomes: ['Paste the brief and get the rules extracted', 'Lock one idea, then generate the plan', 'A board seeded from the plan, ready now'], cta: 'Start the room now', to: '/signin?intent=speed', live: true },
];
