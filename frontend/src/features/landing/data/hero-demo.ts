/* sample data for the hero demo; invented event, never a real competition */

export type DemoItem = { id: string; label: string; value: string };
export type BriefPart = { text: string; item?: string }; // `item` is the id of the DemoItem this phrase belongs to

export const DEMO_ITEMS: DemoItem[] = [
  { id: 'rubric', label: 'Rubric', value: 'Impact 30, Feasibility 30, Innovation 20, Presentation 20' },
  { id: 'deadline', label: 'Deadline', value: 'Sun 6:00 PM IST' },
  { id: 'team', label: 'Team size', value: '2 to 4 members' },
  { id: 'video', label: 'Demo video', value: '3 minutes max' },
  { id: 'repo', label: 'Repo', value: 'Public link required' },
  { id: 'tech', label: 'Tech', value: 'No paid APIs' },
  { id: 'ai', label: 'AI policy', value: 'Allowed, disclose use' },
  { id: 'start', label: 'Start rule', value: 'No commits before Fri 9:00 AM' },
];

export const RUBRIC_WEIGHTS: number[] = [30, 30, 20, 20];

export const BRIEF_PARTS: BriefPart[] = [
  { text: 'Campus Build Sprint 2026 · Problem Statement 07. Build a tool that helps small campus clubs track event budgets. ' },
  { text: 'Teams of 2–4', item: 'team' },
  { text: '. Judging: ' },
  { text: 'Impact 30%', item: 'rubric' },
  { text: ', ' },
  { text: 'Feasibility 30%', item: 'rubric' },
  { text: ', ' },
  { text: 'Innovation 20%', item: 'rubric' },
  { text: ', ' },
  { text: 'Presentation 20%', item: 'rubric' },
  { text: '. Submission is due ' },
  { text: 'Sunday 6:00 PM IST', item: 'deadline' },
  { text: ' with a ' },
  { text: '3-minute demo video', item: 'video' },
  { text: ' and a ' },
  { text: 'public repo link', item: 'repo' },
  { text: '. ' },
  { text: 'No paid APIs', item: 'tech' },
  { text: '. ' },
  { text: 'AI tools are allowed with disclosure', item: 'ai' },
  { text: '. Code committed ' },
  { text: 'before Friday 9:00 AM', item: 'start' },
  { text: ' disqualifies the team.' },
];

export const DEMO_CLOCK_START = 'T–36:00:00';

export const DEMO_TEXT = {
  barLabel: 'Problem statement',
  pastedChip: 'Pasted text',
  readingChip: 'reading…',
  roomReady: 'Room ready',
  paneTitle: 'Brief',
  confirmLabel: 'Confirm brief',
  confirmedLabel: 'Brief confirmed',
  leaderNote: 'Only the leader can confirm.',
  summary: 'Example with a fictional event: [brackit] reads a pasted problem statement, finds eight items in it, and the team leader confirms them one by one.',
  replayLabel: '[ replay ]',
  replayAria: 'Replay the demo',
  blockedNote: 'Every rule needs a tick.',
  itemsFound: '8 items found',
} as const;

