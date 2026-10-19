export type Callout = { label: string; x: number; y: number; w: number; h: number; click?: boolean };

// Positions are percentages of the screenshot frame (x and y are the top-left corner).
// These are FIRST GUESSES made before the real screenshots existed; adjust them after the screenshots are added.
// The callout marked `click: true` is where the demo cursor goes.
export const HOW_CALLOUTS: Record<string, Callout[]> = {
  setup: [
    { label: 'Playbook', x: 6, y: 18, w: 42, h: 24, click: true },
    { label: 'Join code', x: 62, y: 20, w: 28, h: 12 },
  ],
  brief: [
    { label: 'Rubric weights', x: 6, y: 24, w: 54, h: 26 },
    { label: 'Confirm', x: 56, y: 78, w: 36, h: 10, click: true },
  ],
  team: [
    { label: 'Roles', x: 6, y: 20, w: 40, h: 40 },
    { label: 'Skill-gap meter', x: 52, y: 20, w: 40, h: 42, click: true },
  ],
  idea: [
    { label: 'Silent votes', x: 6, y: 22, w: 44, h: 40 },
    { label: 'Lock idea', x: 62, y: 78, w: 30, h: 10, click: true },
  ],
  plan: [
    { label: 'Four steps', x: 6, y: 16, w: 40, h: 20 },
    { label: 'Nine docs', x: 52, y: 20, w: 40, h: 50, click: true },
  ],
  build: [
    { label: 'Dependency lock', x: 34, y: 30, w: 28, h: 16, click: true },
    { label: 'Blocked', x: 64, y: 52, w: 28, h: 14 },
  ],
  present: [
    { label: 'Judge’s Chair', x: 6, y: 14, w: 30, h: 10 },
    { label: 'Waveform', x: 50, y: 30, w: 42, h: 20, click: true },
  ],
  submit: [
    { label: 'Countdown', x: 26, y: 26, w: 48, h: 22 },
    { label: 'Leader only', x: 34, y: 64, w: 32, h: 12, click: true },
  ],
};
