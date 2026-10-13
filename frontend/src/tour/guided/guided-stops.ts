import type { ComponentType } from 'react';
import type { SceneProps, TourPath } from '../types';
import { PickSeatScene } from '../scenes/PickSeatScene';
import { CreateRoomScene } from '../scenes/CreateRoomScene';
import { OverviewScene } from '../scenes/OverviewScene';
import { BriefScene } from '../scenes/BriefScene';
import { TeamScene } from '../scenes/TeamScene';
import { IdeateScene } from '../scenes/IdeateScene';
import { PlanScene } from '../scenes/PlanScene';
import { BuildScene } from '../scenes/BuildScene';
import { TechScene } from '../scenes/TechScene';
import { PresentScene } from '../scenes/PresentScene';
import { SubmitScene } from '../scenes/SubmitScene';

export interface GuidedStop {
  id: string;
  route: string;
  target?: string;
  fallbackTarget?: string;
  hour: number;
  hourLabel?: string;
  label: string;
  sidebarTag?: string;
  title: string | ((path: TourPath) => string);
  caption: string | ((path: TourPath) => string);
  Scene: ComponentType<SceneProps>;
  isSeatChoice?: boolean;
}

export const GUIDED_STOPS: GuidedStop[] = [
  {
    id: 'stop-seat',
    route: '/app/home',
    hour: 0,
    hourLabel: 'SEAT',
    label: 'Seat',
    sidebarTag: 'FLIGHT > Seat',
    title: "Who's on this flight?",
    caption: 'Same plane, different seat. Choose your role to tailor the tour.',
    Scene: PickSeatScene as unknown as ComponentType<SceneProps>,
    isSeatChoice: true,
  },
  {
    id: 'stop-create-room',
    route: '/app/home',
    target: 'create-room',
    fallbackTarget: 'nav-rooms',
    hour: 0,
    hourLabel: 'SETUP',
    label: 'Setup',
    sidebarTag: 'HOME > My rooms',
    title: 'Spin up a room in under a minute.',
    caption: "Name it, pick an event template, and you're the leader. Everything else hangs off this room.",
    Scene: CreateRoomScene,
  },
  {
    id: 'stop-overview',
    route: '/app/room/sample-room/overview',
    target: 'nav-overview',
    hour: 0,
    hourLabel: 'HOUR 0',
    label: 'Overview',
    sidebarTag: 'ROOM > Overview',
    title: "One screen always knows what's next.",
    caption: 'Your clock, your journey from Brief to Review, and a single Next up action.',
    Scene: OverviewScene,
  },
  {
    id: 'stop-brief',
    route: '/app/room/sample-room/brief',
    target: 'nav-brief',
    hour: 0,
    label: 'Brief',
    sidebarTag: 'PLAN > Brief',
    title: 'Read the rules before they read you.',
    caption: 'Paste the event text. Hackathon OS turns it into a rubric, deadlines and a rules checklist your team can tick.',
    Scene: BriefScene,
  },
  {
    id: 'stop-team',
    route: '/app/room/sample-room/team',
    target: 'nav-team',
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
    Scene: TeamScene,
  },
  {
    id: 'stop-ideate',
    route: '/app/room/sample-room/ideate',
    target: 'nav-ideate',
    hour: 2,
    label: 'Ideate',
    sidebarTag: 'IDEATE > Ideas',
    title: 'Everyone pitches. One person decides.',
    caption: "Every member's idea is its own block. The leader approves or rejects. Approved ideas feed the plan.",
    Scene: IdeateScene,
  },
  {
    id: 'stop-plan',
    route: '/app/room/sample-room/plan',
    target: 'nav-plan',
    hour: 5,
    label: 'Plan',
    sidebarTag: 'PLAN > Plan',
    title: 'Ideas become a plan.',
    caption: 'Five steps. Each one: copy the prompt, paste the answer, validate. Nothing goes live unreviewed.',
    Scene: PlanScene,
  },
  {
    id: 'stop-build',
    route: '/app/room/sample-room/board',
    target: 'nav-board',
    hour: 12,
    label: 'Build',
    sidebarTag: 'BUILD > Board',
    title: 'The clock is a teammate.',
    caption: "A classic board, a workload view and a freeze marker, so nobody wonders what's next.",
    Scene: BuildScene,
  },
  {
    id: 'stop-tech',
    route: '/app/room/sample-room/github',
    target: 'nav-github',
    hour: 26,
    label: 'Tech',
    sidebarTag: 'TECH > Branches',
    title: 'Your repo and APIs, with meaning.',
    caption: 'See branches by purpose, and every API your project touches, with a fallback.',
    Scene: TechScene,
  },
  {
    id: 'stop-present',
    route: '/app/room/sample-room/pitch-kit',
    target: 'nav-pitch',
    hour: 30,
    label: 'Present',
    sidebarTag: 'PRESENT > Pitch Kit',
    title: 'Rehearse against the toughest judge in the room.',
    caption: 'Build the deck link, rehearse your pitch, and get ready for the questions judges actually ask.',
    Scene: PresentScene,
  },
  {
    id: 'stop-submit',
    route: '/app/room/sample-room/submission',
    target: 'nav-submission',
    hour: 35,
    label: 'Submit',
    sidebarTag: 'SUBMIT > Submission',
    title: 'Submit with time to spare.',
    caption: "One checklist, built from the event's own rules.",
    Scene: SubmitScene,
  },
];
