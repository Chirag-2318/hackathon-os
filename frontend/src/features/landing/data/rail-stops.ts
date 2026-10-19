/* the five failure lines are verbatim product copy listed in the order they hit a team; the times are illustrative, not data. */

export type RailVisualKey = 'rubric' | 'bars' | 'demo' | 'form' | 'wifi';
export type RailStopData = {
  id: string;
  time: string; // illustrative time remaining
  title: string; // the failure line (verbatim product copy)
  line: string; // one supporting sentence
  visual: RailVisualKey;
  late: boolean; // true for the last two stops, where time pressure turns red
};

export const RAIL_STOPS: RailStopData[] = [
  { id: 'rubric', time: 'T–36:00:00', title: 'Rubric never read.', line: 'The rules sat in a PDF nobody opened. A missing demo video, the wrong team size or a single-commit repo can disqualify a team.', visual: 'rubric', late: false },
  { id: 'scope', time: 'T–30:00:00', title: 'Scope larger than the clock.', line: 'Five half-working paths. Zero end-to-end flows.', visual: 'bars', late: false },
  { id: 'demo', time: 'T–18:00:00', title: 'No demo running by the halfway point.', line: 'Halfway through, there is still nothing to click.', visual: 'demo', late: false },
  { id: 'submit', time: 'T–01:00:00', title: 'Submission started last.', line: 'The form, the video and the repo link all land in the final hour.', visual: 'form', late: true },
  { id: 'wifi', time: 'T–00:20:00', title: 'No fallback if wifi fails.', line: 'The demo needs the network. The network is gone.', visual: 'wifi', late: true },
];

export const RAIL_COPY = {
  eyebrow: 'the problem',
  headingLead: 'Here is how the 36 hours',
  headingEm: 'usually go.',
  note: 'Illustrative. A team that skipped the order.',
  legendLabel: 'Time remaining',
  legendClock: 'T–36:00:00',
  closingLead: 'None of this is a coding problem. It is an',
  closingEm: 'order problem.',
} as const;
