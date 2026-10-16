import { BriefScene } from './scenes/BriefScene';
import { TeamScene } from './scenes/TeamScene';
import { IdeateScene } from './scenes/IdeateScene';
import { PlanScene } from './scenes/PlanScene';
import { BuildScene } from './scenes/BuildScene';
import { TechScene } from './scenes/TechScene';
import { PresentScene } from './scenes/PresentScene';
import { SubmitScene } from './scenes/SubmitScene';
import type { TourStop } from './types';

export const TOUR_STOPS: TourStop[] = [
  {
    id: 'stop-brief',
    hour: 0,
    label: 'Brief',
    sidebarTag: 'PLAN > Brief',
    title: 'Read the rules before they read you.',
    caption:
      'Paste the event text. Hackathon OS turns it into a rubric, deadlines and a rules checklist your team can tick.',
    durationMs: 8500,
    Scene: BriefScene,
  },
  {
    id: 'stop-team',
    hour: 1,
    label: 'Team',
    sidebarTag: 'TEAM > Members',
    title: (path) =>
      path === 'LEADER'
        ? 'Share one code, not a group-chat novel.'
        : "Got a code? You're in.",
    caption: (path) =>
      path === 'LEADER'
        ? "You're the leader. Teammates join with a short code."
        : 'Type it once. Your room opens.',
    durationMs: 8500,
    hasTryIt: true,
    Scene: TeamScene,
  },
  {
    id: 'stop-ideate',
    hour: 2,
    label: 'Ideate',
    sidebarTag: 'IDEATE > Ideas',
    title: 'Everyone pitches. One person decides.',
    caption:
      "Every member's idea is its own block. The leader approves or rejects. Approved ideas feed the plan.",
    durationMs: 9000,
    hasTryIt: true,
    Scene: IdeateScene,
  },
  {
    id: 'stop-plan',
    hour: 5,
    label: 'Plan',
    sidebarTag: 'PLAN > Plan',
    title: 'Ideas become a plan.',
    caption:
      'Five steps. Each one: copy the prompt, paste the answer, validate. Nothing goes live unreviewed.',
    durationMs: 9000,
    Scene: PlanScene,
  },
  {
    id: 'stop-build',
    hour: 12,
    label: 'Build',
    sidebarTag: 'BUILD > Board',
    title: 'The clock is a teammate.',
    caption:
      "A classic board, a workload view and a freeze marker, so nobody wonders what's next.",
    durationMs: 9500,
    hasTryIt: true,
    Scene: BuildScene,
  },
  {
    id: 'stop-tech',
    hour: 26,
    label: 'Tech',
    sidebarTag: 'TECH > Branches',
    title: 'Your repo and APIs, with meaning.',
    caption:
      'See branches by purpose, and every API your project touches, with a fallback.',
    durationMs: 8500,
    Scene: TechScene,
  },
  {
    id: 'stop-present',
    hour: 30,
    label: 'Present',
    sidebarTag: 'PRESENT > Pitch Kit',
    title: 'Rehearse against the toughest judge in the room.',
    caption:
      'Build the deck link, rehearse your pitch, and get ready for the questions judges actually ask.',
    durationMs: 9000,
    Scene: PresentScene,
  },
  {
    id: 'stop-submit',
    hour: 35,
    label: 'Submit',
    sidebarTag: 'SUBMIT > Submission',
    title: 'Submit with time to spare.',
    caption: "Mark the project submitted when you've sent it to the event platform.",
    durationMs: 8500,
    Scene: SubmitScene,
  },
];
