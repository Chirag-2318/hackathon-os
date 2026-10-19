export const STAGE_HEAD = {
  eyebrow: 'the stage',
  headingLead: 'Walk in',
  headingEm: 'ready.',
  line: 'Rehearse out loud. Hear the hard questions first. Submit with margin.',
} as const;

export const REHEARSAL = {
  barLabel: 'Pitch rehearsal',
  micLabel: 'Microphone',
  lines: [
    'Every club treasurer has the same problem.',
    'Receipts pile up, budgets drift, and nobody knows the real number.',
    'Our tool turns each receipt into a live budget.',
    'Clubs plan every event with numbers they trust.',
    'Ask us for the demo.',
  ],
  segments: [
    { label: 'Problem', time: '0:30', seconds: 30 },
    { label: 'Solution', time: '0:45', seconds: 45 },
    { label: 'Demo', time: '1:00', seconds: 60 },
    { label: 'Impact', time: '0:30', seconds: 30 },
    { label: 'Ask', time: '0:15', seconds: 15 },
  ],
  readout: 'Run 3 · 2:48 / 3:00',
  caption: 'Simulated here. In the product the waveform follows your microphone.',
} as const;

export const JUDGE = {
  barLabel: 'Judge’s Chair',
  cardLabel: 'Judge’s question',
  question: 'What did you build this weekend, and what is mocked?',
  difficulty: 2,
  difficultyMax: 3,
  difficultyLabel: 'Difficulty 2 of 3',
  why: 'Why asked: judges check that the demo matches the build.',
  risk: 'Receipt scanner is mocked.',
  ready: 'Answer ready',
  ledgerLabel: 'Your ledger says',
  wallLedgerLabel: 'Reality ledger',
  ledgerNote: 'The answer comes from the ledger.',
  timerLabel: '00:30 to answer',
  nextLabel: 'Next questions',
  nextQuestions: [
    'Who is this for, and how do you know?',
    'What happens when a receipt is blurry?',
    'What would you build with another week?',
  ],
  ledgerRows: [
    { name: 'Receipt scanner', status: 'Mocked' },
    { name: 'Export to Sheets', status: 'Mocked' },
  ],
  caption: 'Example question with sample data.',
} as const;

export const READINESS = {
  barLabel: 'Readiness',
  exampleChip: 'Example room',
  rings: [
    { label: 'Rubric coverage', value: 100 },
    { label: 'MVP health', value: 92 },
    { label: 'Demo rehearsal', value: 100 },
    { label: 'Pitch deck', value: 100 },
    { label: 'Submission checklist', value: 100 },
    { label: 'Fallback insurance', value: 76 },
  ],
  weak: 'Fallback insurance: add a 60-second backup video.',
} as const;

export const LAUNCH = {
  barLabel: 'Launch pad',
  clockLabel: 'Time left',
  time: '03:12:47',
  line: 'Submit your project on the event’s own platform. When that’s done, mark it here to close out this room.',
  button: 'Mark as submitted',
  note: 'Leader only',
  stamp: 'SUBMITTED',
  result: 'Submitted with margin.',
  milestones: ['room created', 'brief confirmed', 'plan generated', 'build started', 'first task done', 'submitted'],
} as const;
