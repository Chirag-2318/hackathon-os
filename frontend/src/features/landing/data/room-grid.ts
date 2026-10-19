export type RoomVisualKey = 'brief' | 'team' | 'ideate' | 'docs' | 'board' | 'ledger' | 'tech' | 'present' | 'readiness';
export type RoomTile = { id: string; label: string; line: string; span: 1 | 2; visual: RoomVisualKey };

export const ROOM_COPY = {
  eyebrow: 'the room',
  headingLead: 'Everything in the room,',
  headingEm: 'nothing to set up.',
} as const;

// Nine tiles on a four-column grid: rows are 2+1+1, 1+2+1, 2+1+1. Benefit lines are final product copy.
export const ROOM_TILES: RoomTile[] = [
  { id: 'brief', label: 'brief', line: 'You won’t be disqualified for a rule nobody read.', span: 2, visual: 'brief' },
  { id: 'team', label: 'team', line: 'Roles named and skill gaps visible before the build starts.', span: 1, visual: 'team' },
  { id: 'ideate', label: 'ideate', line: 'The best idea wins, not the loudest voice.', span: 1, visual: 'ideate' },
  { id: 'docs', label: 'plan + docs', line: 'You start with a PRD, a stack, phases and tasks, not a blank page.', span: 1, visual: 'docs' },
  { id: 'board', label: 'board', line: 'The team always knows what is next and who is stuck.', span: 2, visual: 'board' },
  { id: 'mvp', label: 'mvp studio', line: 'You can answer judge questions honestly and confidently.', span: 1, visual: 'ledger' },
  { id: 'tech', label: 'tech', line: 'No surprise rule violations, and a demo build a late commit cannot break. Frontend and backend work in parallel from hour one.', span: 2, visual: 'tech' },
  { id: 'present', label: 'present', line: 'You practice out loud, against time.', span: 1, visual: 'present' },
  { id: 'readiness', label: 'readiness + review', line: 'One view of where the team stands before the judges arrive.', span: 1, visual: 'readiness' },
];
