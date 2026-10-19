// Example values for a fictional room.

export const RING_LABEL = 'Readiness';
export const RING_START = 5; // index of the first stage (06, Build) that shows the readiness rings
// Six values per stage (0 to 100), in this order: Rubric coverage, MVP health, Demo rehearsal, Pitch deck, Submission checklist, Fallback insurance.
export const RING_VALUES: Record<string, number[]> = {
  build: [100, 55, 0, 20, 0, 0],
  present: [100, 85, 70, 90, 30, 40],
  submit: [100, 92, 100, 100, 100, 76],
};
