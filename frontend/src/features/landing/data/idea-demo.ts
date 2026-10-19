export type Verdict = 'strong' | 'risky' | 'low';

export const RUBRIC_CRITERIA = [
  { label: 'Impact', weight: 30 },
  { label: 'Feasibility', weight: 30 },
  { label: 'Innovation', weight: 20 },
  { label: 'Presentation', weight: 20 },
] as const;

export type IdeaOption = {
  id: string;
  name: string;
  identity: string;
  wow: string;
  risk: string;
  rubric: number[]; // one score (0 to 100) per RUBRIC_CRITERIA entry
  finish: number; // finishable in the hours left
  feasible: number; // technically feasible
  different: number; // different from an AI wrapper
};

export const IDEAS: IdeaOption[] = [
  {
    id: 'receipt',
    name: 'Receipt-to-budget',
    identity: 'A tool that turns club receipts into a live event budget.',
    wow: 'Snap a receipt and the budget updates itself.',
    risk: 'Receipt scanning has to work on crumpled paper.',
    rubric: [82, 52, 64, 86],
    finish: 46,
    feasible: 55,
    different: 72,
  },
  {
    id: 'bot',
    name: 'Club treasurer bot',
    identity: 'A chat bot that answers budget questions for club treasurers.',
    wow: 'Ask “can we afford the venue?” and get an answer.',
    risk: 'It can look like a thin wrapper around a language model.',
    rubric: [66, 84, 38, 60],
    finish: 82,
    feasible: 88,
    different: 28,
  },
  {
    id: 'split',
    name: 'Event cost splitter',
    identity: 'A tool that splits event costs fairly across club members.',
    wow: 'Everyone sees their share before the event starts.',
    risk: 'Fair splitting rules differ from club to club.',
    rubric: [74, 78, 52, 70],
    finish: 76,
    feasible: 80,
    different: 58,
  },
];

export function verdictFor(score: number): Verdict {
  if (score >= 70) return 'strong';
  if (score >= 45) return 'risky';
  return 'low';
}

// Weighted average of the four rubric scores.
export function rubricScore(rubric: number[]): number {
  const total = RUBRIC_CRITERIA.reduce((sum, criterion, index) => sum + criterion.weight * (rubric[index] ?? 0), 0);
  return Math.round(total / 100);
}

export const STRESS_ROWS = [
  'Rubric fit',
  'Finishable in the hours left',
  'Technically feasible',
  'Different from an AI wrapper',
] as const;

export const IDEA_TEXT = {
  silentChip: 'Silent round · revealed',
  identityLabel: 'Identity',
  wowLabel: 'Wow moment',
  riskLabel: 'Riskiest assumption',
  runLabel: 'Stress test',
  testingLabel: 'Testing…',
  lockLabel: 'Lock idea',
  leaderNote: 'Leader only',
  lockedChip: 'Locked',
  lockedNote: 'The plan starts from this one.',
  caption: 'Example output with sample data.',
  tablistLabel: 'Ideas',
  verdicts: { strong: 'strong', risky: 'risky', low: 'low' },
} as const;
